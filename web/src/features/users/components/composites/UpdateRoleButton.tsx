import { Link, useRouteContext } from '@tanstack/react-router'
import { PenIcon } from '@solar-icons/react/linear'
import { ActionIconButton } from '@/components/shared/primitives/ActionIconButton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useHasPermission } from '@/hooks/use-has-permission'
import type { Role } from '@/lib/types/role.type'
import { canGrantRole } from '../../utils/grant'

type UpdateRoleButtonProps = {
  role: Role
}

/** Khớp `updateRole` của `api`: phải trao được vai trò, nên vai trò hệ thống không sửa được. */
export function UpdateRoleButton({ role }: UpdateRoleButtonProps) {
  const { currentUser } = useRouteContext({ from: '/(authed)' })
  const hasUpdatePermission = useHasPermission('roles:update')
  if (!hasUpdatePermission || !canGrantRole(currentUser, role)) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ActionIconButton
            nativeButton={false}
            render={<Link to="/roles/$roleId" params={{ roleId: role.id }} />}
            aria-label={`Sửa vai trò ${role.name}`}
          />
        }
      >
        <PenIcon />
      </TooltipTrigger>
      <TooltipContent>Sửa vai trò</TooltipContent>
    </Tooltip>
  )
}
