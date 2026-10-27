import { z } from 'zod'

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Nhập email.')
    .pipe(z.email('Email không hợp lệ.')),
  password: z.string().min(1, 'Nhập mật khẩu.'),
})

export type SignInSchema = z.input<typeof signInSchema>
