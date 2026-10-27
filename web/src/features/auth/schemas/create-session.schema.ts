import { z } from 'zod'

// Khớp giới hạn của `CreateSessionReqDto` và `RefreshSessionReqDto` bên `api`.
const MAX_TOKEN_LENGTH = 4096

export const createSessionSchema = z.object({
  idToken: z.string().min(1).max(MAX_TOKEN_LENGTH),
  // Không gửi sang `api` lúc đăng nhập; BFF cất lại để gia hạn phiên.
  refreshToken: z.string().min(1).max(MAX_TOKEN_LENGTH),
})
