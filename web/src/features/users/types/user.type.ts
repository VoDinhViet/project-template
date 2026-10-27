import type { RoleRef } from '@/lib/types/role.type'

export type User = {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  role: RoleRef
  createdAt: string
}
