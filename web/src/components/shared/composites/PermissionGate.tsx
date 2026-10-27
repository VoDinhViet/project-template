import type { ReactNode } from 'react'
import { useHasPermission } from '@/hooks/use-has-permission'
import type { Permission } from '@/lib/types/role.type'

type PermissionGateProps = {
  permission: Permission
  children: ReactNode
}

/** Chỉ ẩn/hiện giao diện, quyền thật do `api` kiểm; cần giá trị quyền trong logic thì dùng `useHasPermission`. */
export function PermissionGate({ permission, children }: PermissionGateProps) {
  return useHasPermission(permission) ? children : null
}
