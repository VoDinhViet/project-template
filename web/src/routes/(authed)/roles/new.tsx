import { createFileRoute, redirect } from '@tanstack/react-router'
import { permissionsQueryOptions } from '@/features/users/api'
import { CreateRolePage } from '@/features/users/pages/CreateRolePage'
import { RolePagePending } from '@/features/users/pages/RolePagePending'
import { hasPermission } from '@/lib/permission'

export const Route = createFileRoute('/(authed)/roles/new')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.currentUser, 'roles:create')) {
      throw redirect({ to: '/forbidden' })
    }
  },
  // Không chờ thì SSR dựng HTML khi chưa có danh mục quyền, còn client nhận dữ liệu ngay lúc
  // hydrate nên lệch HTML. Nuốt lỗi để trang tự báo lỗi thay vì màn lỗi chung của `(authed)`.
  loader: async ({ context }) => {
    await context.queryClient
      .query(permissionsQueryOptions())
      .catch(() => undefined)
  },
  pendingComponent: () => <RolePagePending title="Tạo vai trò" />,
  component: CreateRolePage,
})
