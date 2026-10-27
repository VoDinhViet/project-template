import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { and, asc, eq, gt, inArray, isNull, lt, lte, or } from 'drizzle-orm';
import { addMinutes, subDays } from 'date-fns';
import { createHash, randomUUID } from 'node:crypto';
import type { AllConfigType } from '../../config/config.type.js';
import { DRIZZLE } from '../../database/database.module.js';
import type { Database } from '../../database/database.type.js';
import {
  emailOutbox,
  EmailOutboxStatus,
  invitations,
  type EmailOutboxSelect,
} from '../../database/schemas/index.js';
import { SendQueuedEmailsResDto } from './dto/send-queued-emails.res.dto.js';
import {
  MAIL_RETRY_DELAY_MINUTES,
  MailDeliveryStatus,
  MAX_MAIL_ATTEMPTS,
  OUTBOX_BATCH_SIZE,
  OUTBOX_LOCK_MINUTES,
  OUTBOX_MAX_AGE_DAYS,
  OUTBOX_RETENTION_DAYS,
} from './mail.constant.js';
import {
  MailService,
  type MailMessage,
  type MailSendResult,
} from './mail.service.js';
import { decryptOutboxPayload, encryptOutboxPayload } from './outbox-cipher.js';
import type { MailContent } from './templates/invitation-email.js';

export type OutboxMailMessage = MailMessage & {
  // Thư mời: hash token lúc gửi, để cron huỷ khi link đã chết (xem schema `email_outbox`).
  invitationTokenHash?: string;
};

type SendableEmail = {
  email: EmailOutboxSelect;
  message: MailMessage;
};

type RetryEmail = {
  email: EmailOutboxSelect;
  attemptCount: number;
  errorName?: string;
};

type QueuedEmailsCounts = {
  claimedCount: number;
  sentCount: number;
  retriedCount: number;
  failedCount: number;
  cancelledCount: number;
};

/**
 * Gửi thư ngay; thư lỗi được cất mã hoá để cron gửi lại.
 *
 * Rules:
 * - Lỗi gửi hay lỗi cất thư không bao giờ làm hỏng việc đang làm: người gọi chỉ nhận trạng thái.
 * - Chỉ cất thư khi có cả `MAIL_OUTBOX_KEY` lẫn `CRON_SECRET`: thiếu cron thì thư nằm lại mãi.
 * - Không ghi địa chỉ, nội dung hay thông điệp lỗi gốc vào log (lỗi DB có thể kèm cả payload).
 */
@Injectable()
export class EmailOutboxService {
  private readonly logger = new Logger(EmailOutboxService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly mailService: MailService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  /** Kết quả theo đúng thứ tự `messages`. */
  async sendOrQueue(
    messages: OutboxMailMessage[],
  ): Promise<MailDeliveryStatus[]> {
    if (!this.mailService.isEnabled) {
      return messages.map(() => MailDeliveryStatus.DISABLED);
    }
    const sendResults = await this.mailService.sendBatch(messages);
    const deliveryStatuses: MailDeliveryStatus[] = [];
    for (const [index, sendResult] of sendResults.entries()) {
      deliveryStatuses.push(
        await this.resolveDeliveryStatus(messages[index], sendResult),
      );
    }
    return deliveryStatuses;
  }

  /**
   * Một lượt cron: lấy tối đa `OUTBOX_BATCH_SIZE` thư tới hạn, gửi, rồi ghi kết quả.
   *
   * Rules:
   * - Giành thư bằng một lệnh UPDATE gán `claimToken`; mọi lệnh ghi kết quả đều kèm `claimToken` để
   *   lượt chạy chậm (đã mất khoá) không ghi đè lên lượt đang xử lý lại thư đó.
   * - Thư mời chỉ gửi khi còn lời mời đang chờ, chưa hết hạn với đúng hash token lúc gửi.
   * - Chưa cấu hình gửi mail thì không lấy thư, để không tốn lượt thử.
   */
  async sendQueuedEmails(): Promise<SendQueuedEmailsResDto> {
    if (!this.mailService.isEnabled) {
      return plainToInstance(
        SendQueuedEmailsResDto,
        {
          claimedCount: 0,
          sentCount: 0,
          retriedCount: 0,
          failedCount: 0,
          cancelledCount: 0,
        },
        { excludeExtraneousValues: true },
      );
    }
    const now = new Date();
    const expiredCount = await this.expireStaleEmails(now);
    const { claimToken, claimedEmails } = await this.claimDueEmails(now);
    const liveTokenHashes = await this.loadLiveTokenHashes(claimedEmails, now);
    const { cancelledEmailIds, undecryptableEmailIds, sendableEmails } =
      this.partitionClaimedEmails(claimedEmails, liveTokenHashes);

    await this.finishEmails(
      claimToken,
      cancelledEmailIds,
      EmailOutboxStatus.CANCELLED,
      null,
    );
    await this.finishEmails(
      claimToken,
      undecryptableEmailIds,
      EmailOutboxStatus.FAILED,
      'decrypt',
    );
    const deliveryCounts = await this.deliver(claimToken, sendableEmails, now);
    await this.deleteOldEmails(now);

    return plainToInstance(
      SendQueuedEmailsResDto,
      {
        claimedCount: claimedEmails.length,
        sentCount: deliveryCounts.sentCount,
        retriedCount: deliveryCounts.retriedCount,
        failedCount:
          expiredCount +
          undecryptableEmailIds.length +
          deliveryCounts.failedCount,
        cancelledCount: cancelledEmailIds.length,
      },
      { excludeExtraneousValues: true },
    );
  }

  private async resolveDeliveryStatus(
    message: OutboxMailMessage,
    sendResult: MailSendResult,
  ): Promise<MailDeliveryStatus> {
    if (sendResult.isSent) {
      return MailDeliveryStatus.SENT;
    }
    const isQueued =
      sendResult.isRetryable &&
      (await this.queueMessage(message, sendResult.errorName));
    return isQueued ? MailDeliveryStatus.QUEUED : MailDeliveryStatus.FAILED;
  }

  /** Trả `false` khi chưa đủ cấu hình hoặc ghi DB lỗi: người gọi báo `FAILED`. */
  private async queueMessage(
    message: OutboxMailMessage,
    errorName: string | undefined,
  ): Promise<boolean> {
    const outboxKey = this.configService.get('mail.outboxKey', { infer: true });
    const cronSecret = this.configService.get('cron.secret', { infer: true });
    if (!outboxKey || !cronSecret) {
      return false;
    }
    try {
      const content: MailContent = {
        subject: message.subject,
        html: message.html,
        text: message.text,
      };
      await this.db.insert(emailOutbox).values({
        recipient: message.to,
        invitationTokenHash: message.invitationTokenHash,
        payload: encryptOutboxPayload(
          JSON.stringify(content),
          message.to,
          outboxKey,
        ),
        nextAttemptAt: addMinutes(new Date(), MAIL_RETRY_DELAY_MINUTES[0]),
        lastError: errorName,
      });
      return true;
    } catch (error) {
      this.logger.warn(
        `Không cất được thư lỗi vào outbox: ${error instanceof Error ? error.name : 'lỗi không rõ'}`,
      );
      return false;
    }
  }

  /** Thư chờ quá lâu thì bỏ: cron hỏng hay chưa cấu hình không được để link mời nằm lại mãi. */
  private async expireStaleEmails(now: Date): Promise<number> {
    const [result] = await this.db
      .update(emailOutbox)
      .set({
        status: EmailOutboxStatus.FAILED,
        payload: null,
        lastError: 'expired',
        claimToken: null,
        lockedUntil: null,
      })
      .where(
        and(
          eq(emailOutbox.status, EmailOutboxStatus.PENDING),
          lt(emailOutbox.createdAt, subDays(now, OUTBOX_MAX_AGE_DAYS)),
        ),
      );
    return result.affectedRows;
  }

  private async claimDueEmails(
    now: Date,
  ): Promise<{ claimToken: string; claimedEmails: EmailOutboxSelect[] }> {
    const claimToken = randomUUID();
    await this.db
      .update(emailOutbox)
      .set({
        claimToken,
        lockedUntil: addMinutes(now, OUTBOX_LOCK_MINUTES),
      })
      .where(
        and(
          eq(emailOutbox.status, EmailOutboxStatus.PENDING),
          lte(emailOutbox.nextAttemptAt, now),
          or(isNull(emailOutbox.lockedUntil), lt(emailOutbox.lockedUntil, now)),
        ),
      )
      // `id` làm khoá phụ để thứ tự lấy ổn định giữa hai lượt chạy chồng nhau.
      .orderBy(asc(emailOutbox.nextAttemptAt), asc(emailOutbox.id))
      .limit(OUTBOX_BATCH_SIZE);
    const claimedEmails = await this.db
      .select()
      .from(emailOutbox)
      .where(
        and(
          eq(emailOutbox.claimToken, claimToken),
          eq(emailOutbox.status, EmailOutboxStatus.PENDING),
        ),
      );
    return { claimToken, claimedEmails };
  }

  private async loadLiveTokenHashes(
    claimedEmails: EmailOutboxSelect[],
    now: Date,
  ): Promise<Set<string>> {
    const tokenHashes = claimedEmails.flatMap((email) =>
      email.invitationTokenHash ? [email.invitationTokenHash] : [],
    );
    if (tokenHashes.length === 0) {
      return new Set();
    }
    const liveInvitations = await this.db
      .select({ tokenHash: invitations.tokenHash })
      .from(invitations)
      .where(
        and(
          inArray(invitations.tokenHash, tokenHashes),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
          gt(invitations.expiresAt, now),
        ),
      );
    return new Set(liveInvitations.map((invitation) => invitation.tokenHash));
  }

  private partitionClaimedEmails(
    claimedEmails: EmailOutboxSelect[],
    liveTokenHashes: Set<string>,
  ): {
    cancelledEmailIds: string[];
    undecryptableEmailIds: string[];
    sendableEmails: SendableEmail[];
  } {
    const cancelledEmailIds: string[] = [];
    const undecryptableEmailIds: string[] = [];
    const sendableEmails: SendableEmail[] = [];
    for (const email of claimedEmails) {
      if (
        email.invitationTokenHash &&
        !liveTokenHashes.has(email.invitationTokenHash)
      ) {
        cancelledEmailIds.push(email.id);
        continue;
      }
      const message = this.decryptMessage(email);
      if (message) {
        sendableEmails.push({ email, message });
      } else {
        undecryptableEmailIds.push(email.id);
      }
    }
    return { cancelledEmailIds, undecryptableEmailIds, sendableEmails };
  }

  /** Sai khoá, sai người nhận hoặc payload bị sửa thì thư hỏng hẳn, không thử lại. */
  private decryptMessage(email: EmailOutboxSelect): MailMessage | undefined {
    const outboxKey = this.configService.get('mail.outboxKey', { infer: true });
    if (!outboxKey || !email.payload) {
      return undefined;
    }
    try {
      const content = JSON.parse(
        decryptOutboxPayload(email.payload, email.recipient, outboxKey),
      ) as MailContent;
      return { to: email.recipient, ...content };
    } catch {
      return undefined;
    }
  }

  private async deliver(
    claimToken: string,
    sendableEmails: SendableEmail[],
    now: Date,
  ): Promise<
    Pick<QueuedEmailsCounts, 'sentCount' | 'retriedCount' | 'failedCount'>
  > {
    if (sendableEmails.length === 0) {
      return { sentCount: 0, retriedCount: 0, failedCount: 0 };
    }
    const sendResults = await this.mailService.sendBatch(
      sendableEmails.map(({ message }) => message),
      { idempotencyKey: this.buildIdempotencyKey(sendableEmails) },
    );

    const sentEmailIds: string[] = [];
    const exhaustedEmailIds: string[] = [];
    const rejectedEmailIds: string[] = [];
    const retryEmails: RetryEmail[] = [];
    for (const [index, { email }] of sendableEmails.entries()) {
      const sendResult = sendResults[index];
      const attemptCount = email.attemptCount + 1;
      if (sendResult.isSent) {
        sentEmailIds.push(email.id);
      } else if (!sendResult.isRetryable) {
        rejectedEmailIds.push(email.id);
      } else if (attemptCount >= MAX_MAIL_ATTEMPTS) {
        exhaustedEmailIds.push(email.id);
      } else {
        retryEmails.push({
          email,
          attemptCount,
          errorName: sendResult.errorName,
        });
      }
    }

    await this.finishEmails(
      claimToken,
      sentEmailIds,
      EmailOutboxStatus.SENT,
      null,
    );
    await this.finishEmails(
      claimToken,
      exhaustedEmailIds,
      EmailOutboxStatus.FAILED,
      'exhausted',
    );
    await this.finishEmails(
      claimToken,
      rejectedEmailIds,
      EmailOutboxStatus.FAILED,
      'rejected',
    );
    await this.scheduleRetries(claimToken, retryEmails, now);
    return {
      sentCount: sentEmailIds.length,
      retriedCount: retryEmails.length,
      failedCount: exhaustedEmailIds.length + rejectedEmailIds.length,
    };
  }

  /**
   * Cùng tập thư và cùng số lần thử thì cùng khoá: cron chết sau khi Resend nhận lô mà chưa kịp ghi DB
   * thì lượt sau gửi lại không tạo thư thứ hai.
   */
  private buildIdempotencyKey(sendableEmails: SendableEmail[]): string {
    const batchFingerprint = sendableEmails
      .map(({ email }) => `${email.id}:${email.attemptCount}`)
      .sort()
      .join(',');
    return `outbox-${createHash('sha256').update(batchFingerprint).digest('hex')}`;
  }

  private async scheduleRetries(
    claimToken: string,
    retryEmails: RetryEmail[],
    now: Date,
  ): Promise<void> {
    for (const { email, attemptCount, errorName } of retryEmails) {
      await this.db
        .update(emailOutbox)
        .set({
          attemptCount,
          nextAttemptAt: addMinutes(
            now,
            MAIL_RETRY_DELAY_MINUTES[attemptCount - 1],
          ),
          lastError: errorName,
          claimToken: null,
          lockedUntil: null,
        })
        .where(
          and(
            eq(emailOutbox.id, email.id),
            eq(emailOutbox.claimToken, claimToken),
          ),
        );
    }
  }

  /** Thư đã xong thì xoá `payload`: link mời không nên nằm lại trong DB. */
  private async finishEmails(
    claimToken: string,
    emailIds: string[],
    status: EmailOutboxStatus,
    lastError: string | null,
  ): Promise<void> {
    if (emailIds.length === 0) {
      return;
    }
    await this.db
      .update(emailOutbox)
      .set({
        status,
        payload: null,
        lastError,
        sentAt: status === EmailOutboxStatus.SENT ? new Date() : undefined,
        claimToken: null,
        lockedUntil: null,
      })
      .where(
        and(
          inArray(emailOutbox.id, emailIds),
          eq(emailOutbox.claimToken, claimToken),
        ),
      );
  }

  private async deleteOldEmails(now: Date): Promise<void> {
    await this.db
      .delete(emailOutbox)
      .where(
        and(
          inArray(emailOutbox.status, [
            EmailOutboxStatus.SENT,
            EmailOutboxStatus.FAILED,
            EmailOutboxStatus.CANCELLED,
          ]),
          lt(emailOutbox.updatedAt, subDays(now, OUTBOX_RETENTION_DAYS)),
        ),
      );
  }
}
