import type { Permission, RoleRef } from '@/lib/types/role.type'

export type CurrentUser = {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  // `null` khi chưa được mời vào hệ thống: chỉ xem và chấp nhận được lời mời.
  role: RoleRef | null
  // Admin được `api` trả đủ mọi mã (xem `hasPermission`).
  permissions: Permission[]
}

/** Tham chiếu gọn tới một người dùng, khớp `UserRefResDto` của `api`. */
export type UserRef = {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
}
