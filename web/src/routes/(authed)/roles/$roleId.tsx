import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  permissionsQueryOptions,
  rolesQueryOptions,
} from '@/features/users/api'
import { RolePagePending } from '@/features/users/pages/RolePagePending'
import { UpdateRolePage } from '@/features/users/pages/UpdateRolePage'
import { hasPermission } from '@/lib/permission'

export const Route = createFileRoute('/(authed)/roles/$roleId')({
  // Lấy vai trò từ danh sách (`GET /roles`, cần `roles:read`) nên sửa vai trò cần cả hai mã.
  beforeLoad: ({ context }) => {
    if (
      !hasPermission(context.currentUser, 'roles:update') ||
      !hasPermission(context.currentUser, 'roles:read')
    ) {
      throw redirect({ to: '/forbidden' })
    }
  },
  // Chờ cả hai trong một đợt request: form chỉ mount sau khi có vai trò, nên chờ riêng thì danh mục
  // quyền tải nối đuôi; không chờ thì HTML SSR lệch với client lúc hydrate.
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.query(rolesQueryOptions()).catch(() => undefined),
      context.queryClient
        .query(permissionsQueryOptions())
        .catch(() => undefined),
    ])
  },
  pendingComponent: () => <RolePagePending title="Sửa vai trò" />,
  component: UpdateRolePage,
})
