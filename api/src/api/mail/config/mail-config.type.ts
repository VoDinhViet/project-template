export type MailConfig = {
  // Thiếu cả khoá lẫn người gửi thì tính năng gửi email tắt, không phải lỗi cấu hình.
  resend?: {
    apiKey: string;
    from: string;
  };
  // Khoá AES-256 (32 byte) mã hoá thư chờ gửi lại; thiếu thì không cất thư lỗi.
  outboxKey?: Buffer;
};
