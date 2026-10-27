import { hasPermission } from '@/lib/permission'
import type { Role } from '@/lib/types/role.type'
import type { CurrentUser } from '@/lib/types/user.type'

/**
 * Khớp `ensureCanGrantRole` của `api`.
 *
 * Rules:
 * - Vai trò hệ thống là của admin hệ thống duy nhất: không ai trao hay tước được.
 * - Vai trò khác chỉ trao/tước được khi mình có mọi quyền của nó (admin có đủ mã nên luôn được).
 * - Chỉ để ẩn/hiện nút; quyền thật do `api` kiểm (xem backend/auth-security.md).
 */
export function canGrantRole(
  currentUser: Pick<CurrentUser, 'permissions'>,
  role: Pick<Role, 'isSystem' | 'permissions'>,
): boolean {
  if (role.isSystem) {
    return false
  }
  return role.permissions.every((permission) =>
    hasPermission(currentUser, permission),
  )
}
