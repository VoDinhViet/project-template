export const API_PREFIX = 'api';
export const HEALTH_PATH = 'health';
export const SWAGGER_PATH = 'api-docs';
export const INTERNAL_KEY_SCHEME = 'internal-key';
export const INTERNAL_KEY_HEADER = 'X-Internal-Key';
export const CLIENT_IP_HEADER = 'X-Client-IP';
export const CRON_SECRET_HEADER = 'X-Cron-Secret';

// Firebase cho phép session cookie từ 5 phút tới 14 ngày.
export const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 100;
// Chặn `offset` quá lớn làm MySQL báo lỗi hoặc quét cả bảng.
export const MAX_PAGE_NUMBER = 1000;
export const MAX_SEARCH_KEYWORD_LENGTH = 100;

export const THROTTLE_TTL_MS = 60 * 1000;
// Một màn hình lấy đủ mọi trang (mỗi trang tối đa 100 dòng) và có polling nên cần dư dả.
export const USER_THROTTLE_LIMIT = 600;
// Cao hơn hạn mức theo người dùng vì nhiều người có thể chung một IP (văn phòng, CLB).
export const IP_THROTTLE_LIMIT = 1200;
export const CREATE_SESSION_THROTTLE_LIMIT = 30;
// Mỗi lần mời có thể gửi tới 20 email từ tên miền của đơn vị, nên chặn chặt hơn mức chung.
export const CREATE_INVITATIONS_THROTTLE_LIMIT = 10;

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}
