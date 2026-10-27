import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

/**
 * Biến môi trường công khai (tiền tố `VITE_`), được Vite nhúng vào bundle lúc build.
 *
 * Rules:
 * - Không đặt secret ở đây: mọi giá trị đều nằm trong JavaScript gửi tới trình duyệt.
 * - Biến server (`API_URL`, `SESSION_SECRET`...) ở `@/server/env.server`.
 */
export const clientEnv = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_FIREBASE_API_KEY: z.string().min(1),
    VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    VITE_FIREBASE_PROJECT_ID: z.string().min(1),
    VITE_FIREBASE_APP_ID: z.string().min(1),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
})
