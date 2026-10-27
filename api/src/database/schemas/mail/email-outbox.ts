import { randomUUID } from 'node:crypto';
import {
  char,
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  tinyint,
  varchar,
} from 'drizzle-orm/mysql-core';

export enum EmailOutboxStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Email gửi ngay bị lỗi, chờ cron (`POST /cron/send-emails`) gửi lại.
 *
 * Rules:
 * - `payload` là `{ subject, html, text }` mã hoá AES-256-GCM bằng `MAIL_OUTBOX_KEY`: thư mời chứa token
 *   gốc trong khi DB chỉ lưu hash, nên bản dump DB không được đọc ra link dùng được.
 * - Xoá `payload` ngay khi thư đã gửi, hỏng hẳn hoặc bị huỷ.
 * - `invitationTokenHash` chụp lại token lúc gửi (không có khoá ngoại): cron chỉ gửi khi còn lời mời đang
 *   chờ, chưa hết hạn với đúng hash đó; lời mời đã đổi token, bị thu hồi, đã chấp nhận hay hết hạn thì
 *   thư mang link chết và bị huỷ.
 * - Một cron giành dòng bằng `claimToken` + `lockedUntil` (một lệnh UPDATE), không dùng `SKIP LOCKED`
 *   vì chưa chắc bản MySQL/MariaDB của hosting hỗ trợ.
 */
export const emailOutbox = mysqlTable(
  'email_outbox',
  {
    id: char('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    invitationTokenHash: char('invitation_token_hash', { length: 64 }),
    recipient: varchar('recipient', { length: 255 }).notNull(),
    payload: text('payload'),
    status: mysqlEnum('status', EmailOutboxStatus)
      .notNull()
      .default(EmailOutboxStatus.PENDING),
    // Lần gửi ngay đã tính là lần thứ nhất.
    attemptCount: tinyint('attempt_count', { unsigned: true })
      .notNull()
      .default(1),
    nextAttemptAt: datetime('next_attempt_at').notNull(),
    claimToken: char('claim_token', { length: 36 }),
    lockedUntil: datetime('locked_until'),
    // Chỉ tên/mã lỗi của Resend, không bao giờ ghi địa chỉ hay nội dung thư.
    lastError: varchar('last_error', { length: 255 }),
    sentAt: datetime('sent_at'),
    createdAt: datetime('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: datetime('updated_at')
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_email_outbox_status_next_attempt_at').on(
      table.status,
      table.nextAttemptAt,
    ),
    index('idx_email_outbox_claim_token').on(table.claimToken),
  ],
);

export type EmailOutboxSelect = typeof emailOutbox.$inferSelect;
