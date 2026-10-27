import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Nhập email.')
    .pipe(z.email('Email không hợp lệ.')),
})

export type ForgotPasswordSchema = z.input<typeof forgotPasswordSchema>
