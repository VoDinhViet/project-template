// Khớp enum `Permission` của `api`; là mảng để Zod validate được ở server function.
export const PERMISSIONS = [
  'users:read',
  'users:invite',
  'users:remove',
  'users:assign_role',
  'roles:read',
  'roles:create',
  'roles:update',
  'roles:delete',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export type RoleRef = {
  id: string
  name: string
  isSystem: boolean
}

export type Role = RoleRef & {
  isDefault: boolean
  description: string | null
  permissions: Permission[]
  userCount: number
}
