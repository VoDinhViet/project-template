import type { Role } from '@/lib/types/role.type'
import { DeleteRoleButton } from './DeleteRoleButton'
import { UpdateRoleButton } from './UpdateRoleButton'

type RoleActionsProps = {
  role: Role
}

export function RoleActions({ role }: RoleActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      <UpdateRoleButton role={role} />
      <DeleteRoleButton role={role} />
    </div>
  )
}
