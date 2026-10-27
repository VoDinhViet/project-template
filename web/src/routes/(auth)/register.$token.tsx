import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  currentUserQueryOptions,
  invitationEmailQueryOptions,
} from '@/features/auth/api'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'

export const Route = createFileRoute('/(auth)/register/$token')({
  // Đã đăng nhập thì sang thẳng trang chấp nhận lời mời, không cần tạo tài khoản mới.
  beforeLoad: async ({ context, params }) => {
    const currentUser = await context.queryClient.query(
      currentUserQueryOptions(),
    )
    if (currentUser) {
      throw redirect({
        href: `/invitations/${encodeURIComponent(params.token)}`,
      })
    }
  },
  // Nuốt lỗi để trang tự hiện "link không hợp lệ" thay vì màn lỗi chung.
  loader: async ({ context, params }) => {
    await context.queryClient
      .query(invitationEmailQueryOptions(params.token))
      .catch(() => undefined)
  },
  component: RegisterPage,
})
