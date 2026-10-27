import { useRouteContext } from '@tanstack/react-router'
import { hasPermission } from '@/lib/permission'
import type { Permission } from '@/lib/types/role.type'

/** Chỉ để ẩn/hiện giao diện; quyền thật do `api` kiểm. */
export function useHasPermission(permission: Permission): boolean {
  const { currentUser } = useRouteContext({ from: '/(authed)' })
  return hasPermission(currentUser, permission)
}
