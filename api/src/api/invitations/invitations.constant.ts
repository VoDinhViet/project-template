export const INVITATION_TTL_DAYS = 7;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Giới hạn mỗi lần mời để một request không giữ transaction quá lâu.
export const MAX_INVITATION_EMAILS = 20;

// Số email gợi ý tối đa khi nhập ô mời; đủ để chọn nhanh mà không phải phân trang.
export const MAX_INVITATION_SUGGESTIONS = 8;

export enum InvitationStatus {
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  ACCEPTED = 'ACCEPTED',
}

export enum InvitationResultStatus {
  INVITED = 'INVITED',
  ALREADY_HAS_ACCESS = 'ALREADY_HAS_ACCESS',
}

export enum InvitationEmailStatus {
  SENT = 'SENT',
  // Gửi ngay lỗi, thư đã được cất để cron tự gửi lại.
  QUEUED = 'QUEUED',
  FAILED = 'FAILED',
  NOT_REQUESTED = 'NOT_REQUESTED',
  DISABLED = 'DISABLED',
}
