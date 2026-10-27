import type { Permission } from '@/lib/types/role.type'
import type { CurrentUser } from '@/lib/types/user.type'

/** Khớp `hasPermission` của `api`; admin đã được `api` trả đủ mọi mã nên không cần xét `isSystem`. */
export function hasPermission(
  currentUser: Pick<CurrentUser, 'permissions'>,
  permission: Permission,
): boolean {
  return currentUser.permissions.includes(permission)
}
