import axios from 'axios'
import {
  GENERIC_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from '@/lib/error-messages'
import type { ApiErrorResponse } from '@/server/http.server'

const NOT_FOUND_STATUS = 404

/** Dịch lỗi của các thao tác thành viên/vai trò/lời mời sang thông báo tiếng Việt cho UI. */
export function resolveUserErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return GENERIC_ERROR_MESSAGE
  }

  switch (error.response?.data.errorCode) {
    case 'auth.error.unauthenticated':
    case 'auth.error.account_disabled':
      return SESSION_EXPIRED_MESSAGE
    case 'role.error.not_found':
      return 'Vai trò không còn tồn tại. Tải lại trang để xem danh sách mới.'
    case 'role.error.in_use':
      return 'Vai trò đang có người giữ hoặc lời mời đang chờ nên chưa xoá được.'
    case 'role.error.name_exists':
      return 'Tên vai trò đã được dùng. Chọn tên khác.'
    case 'role.error.default_locked':
      return 'Đây là vai trò mặc định. Đặt vai trò khác làm mặc định trước khi xoá.'
    case 'common.error.too_many_requests':
      return 'Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.'
    case 'common.error.concurrent_update':
      return 'Dữ liệu vừa được người khác thay đổi cùng lúc. Vui lòng thử lại.'
    case 'role.error.system_role_locked':
      return 'Vai trò hệ thống chỉ dành cho admin: không sửa, không xoá, không trao hay tước được.'
    case 'invitation.error.not_found':
      return 'Link mời không hợp lệ hoặc đã được thay bằng link mới.'
    case 'invitation.error.expired':
      return 'Link mời đã hết hạn. Hãy nhờ người mời gửi link mới.'
    case 'invitation.error.revoked':
      return 'Lời mời đã bị thu hồi.'
    case 'invitation.error.already_accepted':
      return 'Lời mời này đã được sử dụng.'
    case 'invitation.error.email_mismatch':
      return 'Bạn đang đăng nhập bằng email khác với email được mời.'
    case 'auth.error.forbidden':
      return 'Bạn không có quyền thực hiện thao tác này.'
    case 'auth.error.no_access':
      return 'Bạn chưa được mời vào hệ thống.'
    case 'common.validation.empty_update_payload':
      return 'Không có thay đổi nào để lưu.'
    default:
      return error.response?.status === NOT_FOUND_STATUS
        ? 'Không tìm thấy dữ liệu.'
        : GENERIC_ERROR_MESSAGE
  }
}
