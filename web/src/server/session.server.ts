import { getCookie, setCookie } from '@tanstack/react-start/server'
import { getIronSession } from 'iron-session'
import type { CookieJar, SessionOptions } from 'iron-session'
import { serverEnv } from './env.server'

const SESSION_COOKIE_NAME = 'qlda_session'
// Mỗi lần gia hạn ghi lại cookie với hạn này: bỏ quá 30 ngày không vào thì phải đăng nhập lại.
const SESSION_IDLE_TIMEOUT_SECONDS = 30 * 24 * 60 * 60

// Dữ liệu được iron-session mã hoá và ký trong cookie; trình duyệt không đọc hay sửa được.
type SessionData = {
  // Session cookie do Firebase cấp qua `api`, dùng làm Bearer khi gọi lại `api`.
  sessionCookie?: string
  sessionCookieExpiresAt?: number
  // Refresh token Firebase để `api` cấp session cookie mới khi cái cũ sắp hết hạn.
  refreshToken?: string
}

// Khớp `RefreshedSessionResDto` của `api`; Firebase có thể trả refresh token mới nên luôn lưu cái
// nhận được.
export type RefreshedSession = {
  sessionCookie: string
  expiresInMs: number
  refreshToken: string
}

const requestCookieJar: CookieJar = {
  read: (name) => getCookie(name),
  write: (name, value, options) => setCookie(name, value, options),
}

// `ttl` nằm trong chính nội dung đã ký nên không kéo dài được bằng cách sửa cookie; cookie bị sao
// chép mà vẫn được dùng thì tự gia hạn tiếp, chỉ `signOutAllDevices` chặn được.
const sessionOptions: SessionOptions = {
  cookieName: SESSION_COOKIE_NAME,
  password: serverEnv.SESSION_SECRET,
  ttl: SESSION_IDLE_TIMEOUT_SECONDS,
  // Session cookie Firebase chứa claim `picture`; URL ảnh Google có thể dài hơn 1KB, đẩy cookie qua
  // trần 4096 byte của trình duyệt nên phải tách thành nhiều cookie.
  chunk: true,
  cookieOptions: {
    httpOnly: true,
    // Dev chạy http://localhost nên chỉ bật `Secure` ở production.
    secure: serverEnv.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
}

export function readSession(): Promise<SessionData> {
  return getIronSession<SessionData>(requestCookieJar, sessionOptions)
}

export async function writeSession({
  sessionCookie,
  expiresInMs,
  refreshToken,
}: RefreshedSession): Promise<void> {
  const session = await getIronSession<SessionData>(
    requestCookieJar,
    sessionOptions,
  )
  session.sessionCookie = sessionCookie
  session.sessionCookieExpiresAt = Date.now() + expiresInMs
  session.refreshToken = refreshToken
  await session.save()
}

export async function clearSessionCookie(): Promise<void> {
  const session = await getIronSession<SessionData>(
    requestCookieJar,
    sessionOptions,
  )
  session.destroy()
}
