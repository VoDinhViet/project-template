export enum MailDeliveryStatus {
  SENT = 'SENT',
  // Gửi ngay lỗi, thư đã được cất để cron gửi lại.
  QUEUED = 'QUEUED',
  FAILED = 'FAILED',
  DISABLED = 'DISABLED',
}

// Lần gửi ngay tính là lần thứ nhất, nên có tối đa 5 lần gửi lại.
export const MAX_MAIL_ATTEMPTS = 6;

// Khoảng chờ trước lần gửi lại thứ n (phút): sau lần gửi ngay, rồi sau mỗi lần cron gửi lỗi.
export const MAIL_RETRY_DELAY_MINUTES = [5, 15, 30, 60, 120];

// Mỗi lần cron chỉ lấy ngần này thư, đủ để request ngắn hơn thời gian chờ của `curl` ở cPanel.
export const OUTBOX_BATCH_SIZE = 20;

// Cron chết giữa chừng thì thư được lấy lại sau thời gian này.
export const OUTBOX_LOCK_MINUTES = 2;

// Thư đã xong (đã gửi, hỏng hẳn, đã huỷ) giữ lại để tra cứu rồi dọn.
export const OUTBOX_RETENTION_DAYS = 30;

// Thư chờ quá lâu mà cron chưa gửi được (cron hỏng hay chưa cấu hình) thì bỏ, để link mời hết hạn không
// nằm lại trong DB.
export const OUTBOX_MAX_AGE_DAYS = 7;
