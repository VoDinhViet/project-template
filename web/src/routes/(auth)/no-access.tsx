import { createFileRoute, redirect } from '@tanstack/react-router'
import { currentUserQueryOptions } from '@/features/auth/api'
import { NoAccessPage } from '@/features/auth/pages/NoAccessPage'

export const Route = createFileRoute('/(auth)/no-access')({
  beforeLoad: async ({ context }) => {
    const currentUser = await context.queryClient.query(
      currentUserQueryOptions(),
    )
    if (!currentUser) {
      throw redirect({ to: '/login' })
    }
    if (currentUser.role) {
      throw redirect({ to: '/' })
    }
    return { currentUser }
  },
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  component: NoAccessPage,
})
