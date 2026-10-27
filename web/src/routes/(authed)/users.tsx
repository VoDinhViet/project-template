import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  invitationsQueryOptions,
  permissionsQueryOptions,
  rolesQueryOptions,
  usersQueryOptions,
} from '@/features/users/api'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { UsersPagePending } from '@/features/users/pages/UsersPagePending'
import { usersSearchSchema } from '@/features/users/schemas/users-search.schema'
import { hasPermission } from '@/lib/permission'

export const Route = createFileRoute('/(authed)/users')({
  validateSearch: usersSearchSchema,
  // `GET /users` mở cho mọi người có vai trò (để chọn người); `users:read` chỉ mở trang quản lý này.
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.currentUser, 'users:read')) {
      throw redirect({ to: '/forbidden' })
    }
  },
  // Chờ các truy vấn của thẻ thống kê và số trên tab (chạy song song, chỉ gọi cái người xem được) vì
  // không chờ thì SSR dựng HTML khi chưa có dữ liệu, còn client nhận dữ liệu lúc hydrate nên lệch HTML.
  // Không đặt `loaderDeps` theo bộ lọc: `keepPreviousData` đã xử lý mượt.
  loader: async ({ context }) => {
    const { currentUser, queryClient } = context
    await Promise.all([
      queryClient.query(usersQueryOptions({})).catch(() => undefined),
      hasPermission(currentUser, 'users:invite') &&
        queryClient.query(invitationsQueryOptions({})).catch(() => undefined),
      hasPermission(currentUser, 'roles:read') &&
        queryClient.query(rolesQueryOptions()).catch(() => undefined),
      // Cột "Quyền" của tab Vai trò lấy tên và nhóm từ danh mục này.
      hasPermission(currentUser, 'roles:read') &&
        queryClient.query(permissionsQueryOptions()).catch(() => undefined),
    ])
  },
  pendingComponent: UsersPagePending,
  component: UsersPage,
})
