import { getRequestHeader, getRequestIP } from '@tanstack/react-start/server'
import axios from 'axios'
import { serverEnv } from './env.server'
import { clearSessionCookie, readSession, writeSession } from './session.server'
import type { RefreshedSession } from './session.server'

type ApiErrorDetail = {
  property: string
  code: string
  message: string
}

// Hợp đồng lỗi của `api` (`ErrorDto`); `errorCode` dạng `<domain>.error.<reason>` là khoá để ánh xạ
// sang thông báo tiếng Việt, `details` chỉ có ở lỗi validate theo từng trường.
export type ApiErrorResponse = {
  timestamp: string
  statusCode: number
  error: string
  errorCode?: string
  message: string
  details?: ApiErrorDetail[]
}

const INTERNAL_KEY_HEADER = 'X-Internal-Key'
const CLIENT_IP_HEADER = 'X-Client-IP'
// Chỉ hai mã này nghĩa là phiên không còn dùng được; 401 do lệch `X-Internal-Key` thì không được
// xoá cookie.
export const SESSION_REJECTED_ERROR_CODES = new Set([
  'auth.error.unauthenticated',
  'auth.error.account_disabled',
])
const REQUEST_TIMEOUT_MS = 10_000
// Gia hạn trước khi session cookie hết hạn một ngày, để request đang chạy không bị 401 giữa chừng.
const SESSION_REFRESH_BEFORE_MS = 24 * 60 * 60 * 1000

/**
 * IP của trình duyệt.
 *
 * Rules:
 * - Lấy phần tử **cuối** của `X-Forwarded-For`: phần tử đầu do trình duyệt tự ghi nên giả được, phần
 *   tử cuối do proxy của hosting thêm vào.
 * - Không có header đó (chạy dev, không qua proxy) thì dùng địa chỉ socket.
 */
function readClientIp(): string | undefined {
  const forwardedIps = getRequestHeader('x-forwarded-for')?.split(',')
  return forwardedIps?.at(-1)?.trim() || getRequestIP()
}

const apiClientConfig = {
  baseURL: serverEnv.API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    [INTERNAL_KEY_HEADER]: serverEnv.INTERNAL_API_KEY,
  },
}

// Không gắn interceptor: gia hạn đi qua `http` sẽ gọi lại chính interceptor gia hạn của nó.
const refreshClient = axios.create(apiClientConfig)

/**
 * Mọi server function gọi `api` qua instance này.
 *
 * Rules:
 * - Chỉ chạy phía server (`*.server.ts`); `X-Internal-Key` để `api` chấp nhận BFF.
 * - Session cookie gắn thành `Authorization: Bearer` ở đây một lần, không truyền tay ở từng nơi gọi.
 * - IP trình duyệt chuyển sang `api` qua `X-Client-IP` để `api` giới hạn tần suất.
 */
export const http = axios.create(apiClientConfig)

// Theo refresh token chứ không dùng một promise chung: module này dùng chung cho mọi người dùng.
const recentRefreshes = new Map<string, Promise<RefreshedSession>>()
// Các lời gọi `http` sau trong cùng request SSR vẫn đọc cookie cũ của request, nên giữ kết quả thêm
// một lúc để chúng dùng lại thay vì gia hạn lần nữa.
const REFRESH_REUSE_MS = 30_000

/**
 * Gộp các lần gia hạn của cùng một phiên trong một khoảng ngắn thành một lượt gọi `api`.
 *
 * Rules:
 * - Firebase có thể trả refresh token mới và tài liệu không hứa token cũ còn dùng được, nên lượt gọi
 *   thứ hai bằng token cũ có thể bị từ chối và làm mất phiên.
 * - Gia hạn lỗi thì bỏ khỏi map ngay để lần sau thử lại.
 */
function requestSessionRefresh(
  refreshToken: string,
  clientIp: string | undefined,
): Promise<RefreshedSession> {
  const recentRefresh = recentRefreshes.get(refreshToken)
  if (recentRefresh) {
    return recentRefresh
  }
  const refresh = refreshClient
    .post<RefreshedSession>(
      '/api/auth/session/refresh',
      { refreshToken },
      { headers: clientIp ? { [CLIENT_IP_HEADER]: clientIp } : undefined },
    )
    .then((response) => response.data)
  recentRefreshes.set(refreshToken, refresh)
  refresh.then(
    () =>
      setTimeout(() => recentRefreshes.delete(refreshToken), REFRESH_REUSE_MS),
    () => recentRefreshes.delete(refreshToken),
  )
  return refresh
}

/**
 * Trả session cookie dùng được cho request này, gia hạn trước nếu sắp hết hạn.
 *
 * Rules:
 * - Phiên ghi trước khi có gia hạn: dùng tới hết hạn rồi đăng nhập lại.
 * - `api` từ chối gia hạn (refresh token bị thu hồi, tài khoản bị khoá...) thì xoá cookie, trả
 *   `undefined` để request đi không Bearer và luồng đăng xuất có sẵn xử lý tiếp.
 * - Lỗi khác (mạng, `api` lỗi 5xx, sai `FIREBASE_API_KEY`...) thì log và dùng tiếp session cookie
 *   cũ: còn hạn thì request chạy bình thường, hết hạn thì `api` trả 401 và người dùng đăng nhập lại,
 *   không bị kẹt ở trang lỗi khi lỗi không tự hết.
 */
async function readFreshSessionCookie(
  clientIp: string | undefined,
): Promise<string | undefined> {
  const { sessionCookie, sessionCookieExpiresAt, refreshToken } =
    await readSession()
  // `writeSession` luôn ghi hai trường này cùng nhau; thiếu là phiên ghi trước khi có gia hạn.
  if (!refreshToken || !sessionCookieExpiresAt) {
    return sessionCookie
  }
  if (sessionCookieExpiresAt - Date.now() >= SESSION_REFRESH_BEFORE_MS) {
    return sessionCookie
  }
  try {
    const sessionTokens = await requestSessionRefresh(refreshToken, clientIp)
    await writeSession(sessionTokens)
    return sessionTokens.sessionCookie
  } catch (error) {
    if (
      axios.isAxiosError<ApiErrorResponse>(error) &&
      SESSION_REJECTED_ERROR_CODES.has(error.response?.data.errorCode ?? '')
    ) {
      await clearSessionCookie()
      return undefined
    }
    logHttpError(error, 'refreshSession')
    return sessionCookie
  }
}

http.interceptors.request.use(async (config) => {
  const clientIp = readClientIp()
  const sessionCookie = await readFreshSessionCookie(clientIp)
  if (sessionCookie) {
    config.headers.Authorization = `Bearer ${sessionCookie}`
  }
  if (clientIp) {
    config.headers[CLIENT_IP_HEADER] = clientIp
  }
  return config
})

// Phiên hết hạn hay bị thu hồi thì xoá cookie ngay tại đây; server function chỉ việc dịch lỗi như
// thường.
http.interceptors.response.use(undefined, async (error: unknown) => {
  if (
    axios.isAxiosError<ApiErrorResponse>(error) &&
    SESSION_REJECTED_ERROR_CODES.has(error.response?.data.errorCode ?? '')
  ) {
    await clearSessionCookie()
  }
  throw error
})

// Đường dẫn lời mời chứa token; log mẫu thay cho giá trị thật (xem backend/auth-security.md).
const INVITATION_TOKEN_PATH = /^\/api\/invitations\/[^/]+/

/**
 * Điểm ghi log lỗi duy nhất của server function; không ghi token hay response thô.
 *
 * Rules:
 * - Đây là nơi duy nhất được dùng `console.*` trong `web/src`.
 */

export function logHttpError(error: unknown, context: string): void {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    console.error(
      `[API Error] ${context}`,
      error instanceof Error ? error.message : String(error),
    )
    return
  }
  console.error(`[API Error] ${context}`, {
    code: error.code,
    errorCode: error.response?.data.errorCode,
    message: error.message,
    method: error.config?.method?.toUpperCase(),
    url: error.config?.url?.replace(
      INVITATION_TOKEN_PATH,
      '/api/invitations/:token',
    ),
    status: error.response?.status,
    responseMessage: error.response?.data.message,
    details: error.response?.data.details,
  })
}
