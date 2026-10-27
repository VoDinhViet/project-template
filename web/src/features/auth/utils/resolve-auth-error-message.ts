import { GENERIC_ERROR_MESSAGE } from '@/lib/error-messages'

const FIREBASE_ERROR_PREFIX = 'auth/'
const POPUP_DISMISSED_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
])
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/popup-blocked':
    'Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.',
  'auth/network-request-failed': 'Không có kết nối mạng. Vui lòng thử lại.',
  // Project chưa bật chống dò email nên Firebase tách `user-not-found`/`wrong-password`; gộp chung một thông báo để không lộ email nào có tài khoản.
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/user-not-found': 'Email hoặc mật khẩu không đúng.',
  'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
  'auth/too-many-requests':
    'Bạn thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.',
  'auth/email-already-in-use':
    'Email này đã có tài khoản. Hãy đăng nhập, dùng "Quên mật khẩu" hoặc đăng nhập bằng Google.',
  'auth/weak-password': 'Mật khẩu quá yếu. Hãy dùng ít nhất 8 ký tự.',
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hoá.',
  'auth/operation-not-allowed':
    'Chưa bật đăng nhập bằng email/mật khẩu trên Firebase. Hãy liên hệ quản trị viên.',
  'auth/unauthorized-continue-uri':
    'Tên miền của trang web chưa được cho phép trên Firebase. Hãy liên hệ quản trị viên.',
  'auth/email-not-verified':
    'Email chưa được xác minh. Hãy mở email xác minh đã gửi cho bạn.',
}

function readErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return typeof error.code === 'string' ? error.code : undefined
  }
  return undefined
}

export function isEmailNotVerified(error: unknown): boolean {
  return readErrorCode(error) === 'auth/email-not-verified'
}

/** Project chưa bật chống dò email thì Firebase báo email chưa có tài khoản; vẫn phải trả lời trung tính. */
export function isUserNotFound(error: unknown): boolean {
  return readErrorCode(error) === 'auth/user-not-found'
}

/** Người dùng tự đóng popup Google thì không phải lỗi, không cần báo. */
export function isPopupDismissed(error: unknown): boolean {
  const code = readErrorCode(error)
  return code !== undefined && POPUP_DISMISSED_CODES.has(code)
}

/** Lỗi đăng nhập/đăng xuất: Firebase SDK báo tiếng Anh nên phải dịch. */
export function resolveAuthErrorMessage(error: unknown): string {
  const code = readErrorCode(error)
  if (code?.startsWith(FIREBASE_ERROR_PREFIX)) {
    return FIREBASE_ERROR_MESSAGES[code] ?? GENERIC_ERROR_MESSAGE
  }
  return error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE
}
