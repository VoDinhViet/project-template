export type Session = {
  // Session cookie do Firebase cấp qua `api`, BFF lưu vào cookie httpOnly của chính nó.
  sessionCookie: string
  expiresInMs: number
}
