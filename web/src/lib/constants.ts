export const DEFAULT_PAGE_LIMIT = 10
export const SEARCH_DEBOUNCE_MS = 300
// Trần `limit` của `PageOptionsDto` ở `api`; ô chọn và bảng tra tên lấy một lần tối đa chừng này.
export const MAX_PAGE_LIMIT = 100
// Trần `MAX_SEARCH_KEYWORD_LENGTH` của `api`; dài hơn thì `api` trả 422.
export const MAX_SEARCH_KEYWORD_LENGTH = 100
// Số người mỗi trang của ô chọn user; ô chọn tìm phía server và lấy thêm khi cần, không tải hết.
export const USER_PAGE_LIMIT = 20
