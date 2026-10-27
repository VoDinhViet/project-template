import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { AllConfigType } from '../../config/config.type.js';
import type { MailContent } from './templates/invitation-email.js';

export type MailMessage = MailContent & {
  to: string;
};

// `errorName` chỉ là tên lỗi của Resend, không bao giờ chứa địa chỉ hay nội dung thư.
export type MailSendResult = {
  isSent: boolean;
  // Lỗi tạm (mạng, 5xx, 429) thì gửi lại có thể thành công; Resend từ chối vì thư sai (4xx) thì không.
  isRetryable?: boolean;
  errorName?: string;
};

type SendBatchOptions = {
  // Gửi lại đúng lô này trong 24 giờ thì Resend trả kết quả cũ thay vì gửi lần nữa.
  idempotencyKey?: string;
};

const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR = 500;

/**
 * Bọc `resend`: gửi lỗi không làm hỏng việc đang làm, chỉ báo kết quả từng thư để người gọi xử lý.
 *
 * Rules:
 * - Không ghi nội dung email hay link vào log (link mời chứa token).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private client: Resend | undefined;

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  get isEnabled(): boolean {
    return this.configService.get('mail.resend', { infer: true }) !== undefined;
  }

  /**
   * Một request cho cả lô (Resend nhận tối đa 100 email) nên không chạm giới hạn tốc độ. Trả kết quả
   * theo đúng thứ tự `messages`: thư nào Resend từ chối riêng (`permissive`) chỉ làm hỏng thư đó, còn
   * lỗi cả lô thì mọi thư đều hỏng.
   */
  async sendBatch(
    messages: MailMessage[],
    { idempotencyKey }: SendBatchOptions = {},
  ): Promise<MailSendResult[]> {
    const resendConfig = this.configService.get('mail.resend', { infer: true });
    if (!resendConfig || messages.length === 0) {
      return messages.map(() => ({ isSent: false, errorName: 'disabled' }));
    }
    this.client ??= new Resend(resendConfig.apiKey);
    try {
      const { data: acceptedBatch, error } = await this.client.batch.send(
        messages.map((message) => ({
          from: resendConfig.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        })),
        { batchValidation: 'permissive', idempotencyKey },
      );
      if (error || !acceptedBatch) {
        this.logger.warn(
          `Resend từ chối lô ${messages.length} email: ${error?.name ?? 'không có dữ liệu'} (${error?.statusCode ?? 'không rõ mã'})`,
        );
        const statusCode = error?.statusCode ?? undefined;
        return messages.map(() => ({
          isSent: false,
          isRetryable:
            statusCode === undefined ||
            statusCode === HTTP_TOO_MANY_REQUESTS ||
            statusCode >= HTTP_SERVER_ERROR,
          errorName: error?.name ?? 'unknown',
        }));
      }
      const rejectedIndexes = new Set(
        (acceptedBatch.errors ?? []).map((rejection) => rejection.index),
      );
      if (rejectedIndexes.size > 0) {
        this.logger.warn(
          `Resend từ chối ${rejectedIndexes.size}/${messages.length} email trong lô`,
        );
      }
      return messages.map((_message, index) =>
        rejectedIndexes.has(index)
          ? { isSent: false, isRetryable: false, errorName: 'rejected' }
          : { isSent: true },
      );
    } catch (error) {
      this.logger.warn(
        `Không gọi được Resend: ${error instanceof Error ? error.name : 'lỗi không rõ'}`,
      );
      return messages.map(() => ({
        isSent: false,
        isRetryable: true,
        errorName: 'network',
      }));
    }
  }
}
