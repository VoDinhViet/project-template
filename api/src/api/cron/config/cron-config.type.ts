export type CronConfig = {
  // Thiếu thì route cron trả 404: tính năng tắt, không phải lỗi cấu hình.
  secret?: string;
};
