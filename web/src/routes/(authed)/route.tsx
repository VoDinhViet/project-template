import { createFileRoute, redirect } from '@tanstack/react-router'
import { currentUserQueryOptions } from '@/features/auth/api'
import { AuthedLayoutPage } from '@/features/auth/pages/AuthedLayoutPage'

const INVITATION_PATH_PREFIX = '/invitations/'

export const Route = createFileRoute('/(authed)')({
  /**
   * Guard đăng nhập duy nhất của ứng dụng (xem frontend/structure.md).
   *
   * Rules:
   * - Chưa có vai trò (chưa được mời) thì `api` từ chối mọi route trừ xem/chấp nhận lời mời, nên chỉ
   *   cho ở lại trang lời mời.
   */
  beforeLoad: async ({ context, location }) => {
    const currentUser = await context.queryClient.query(
      currentUserQueryOptions(),
    )
    if (!currentUser) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    if (
      !currentUser.role &&
      !location.pathname.startsWith(INVITATION_PATH_PREFIX)
    ) {
      throw redirect({ to: '/no-access' })
    }
    return { currentUser }
  },
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  component: AuthedLayoutPage,
})
