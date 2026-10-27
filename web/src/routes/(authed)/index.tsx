import { createFileRoute, redirect } from '@tanstack/react-router'
import { hasPermission } from '@/lib/permission'

// `/users` đòi `users:read` và `/forbidden` lại trỏ về `/`, nên người thiếu quyền phải rơi sang `/health`.
export const Route = createFileRoute('/(authed)/')({
  beforeLoad: ({ context }) => {
    throw redirect({
      to: hasPermission(context.currentUser, 'users:read')
        ? '/users'
        : '/health',
    })
  },
})
