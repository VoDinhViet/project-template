import { z } from 'zod'

// Firebase chỉ đòi 6 ký tự; 8 là mức tối thiểu của dự án.
export const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Nhập họ và tên.')
    .max(100, 'Họ và tên quá dài.'),
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`,
    )
    .max(MAX_PASSWORD_LENGTH, 'Mật khẩu quá dài.'),
})

export type RegisterSchema = z.input<typeof registerSchema>
