import type { Permission } from '@/lib/types/role.type'

export type PermissionInfo = {
  code: Permission
  groupName: string
  name: string
  description: string
}
