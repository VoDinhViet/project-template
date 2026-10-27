import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const MIN_SESSION_SECRET_LENGTH = 32

/**
 * Biến môi trường phía server, kiểm tra một lần khi module được nạp.
 *
 * Rules:
 * - Thiếu hoặc sai biến thì server dừng với danh sách biến lỗi, không đợi đến request đầu tiên.
 * - Chỉ import từ code phía server (`*.server.ts`, server function). Biến công khai `VITE_*` ở `@/lib/env`.
 * - Thêm biến mới thì thêm cả vào `.env.example`.
 */
export const serverEnv = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('production'),
    API_URL: z.url(),
    INTERNAL_API_KEY: z.string().min(1),
    SESSION_SECRET: z.string().min(MIN_SESSION_SECRET_LENGTH),
  },
  runtimeEnv: process.env,
  // `KEY=` trong .env là chưa điền, phải bị coi như thiếu.
  emptyStringAsUndefined: true,
})
