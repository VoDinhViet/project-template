import { useRouteContext } from '@tanstack/react-router'
import {
  MenuDotsIcon,
  ShieldUserIcon,
  UserCrossRoundedIcon,
} from '@solar-icons/react/linear'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ActionIconButton } from '@/components/shared/primitives/ActionIconButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useHasPermission } from '@/hooks/use-has-permission'
import { rolesQueryOptions } from '../../api'
import { useUpdateUserRole } from '../../hooks/use-update-user-role'
import type { User } from '../../types/user.type'
import { canGrantRole } from '../../utils/grant'
import { RemoveUserDialog } from './RemoveUserDialog'

type UserActionsProps = {
  user: User
}

/** Khớp luật ở `api`: phải tước được vai trò hiện tại mới đổi hay gỡ được người này. */
export function UserActions({ user }: UserActionsProps) {
  const { currentUser } = useRouteContext({ from: '/(authed)' })
  const canAssignRole = useHasPermission('users:assign_role')
  const canRemoveUser = useHasPermission('users:remove')
  const canReadRoles = useHasPermission('roles:read')
  const { data: roles = [] } = useQuery({
    ...rolesQueryOptions(),
    enabled: canReadRoles,
  })
  const [isRemoveOpen, setIsRemoveOpen] = useState(false)
  const { mutate: updateUserRole, isPending } = useUpdateUserRole()
  // `user.role` chỉ là tham chiếu gọn, phải tìm vai trò đầy đủ (kèm quyền) trong danh sách.
  const currentRole = roles.find((role) => role.id === user.role.id)
  const canManageCurrentRole =
    currentRole !== undefined && canGrantRole(currentUser, currentRole)
  const assignableRoles = roles.filter((role) =>
    canGrantRole(currentUser, role),
  )
  const canChangeRole = canManageCurrentRole && canAssignRole
  const canRemove = canManageCurrentRole && canRemoveUser
  if (!canChangeRole && !canRemove) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <ActionIconButton aria-label={`Thao tác với ${user.displayName}`} />
          }
        >
          <MenuDotsIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canChangeRole && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={isPending}>
                <ShieldUserIcon className="text-violet-ink" />
                Đổi vai trò
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={user.role.id}
                  onValueChange={(roleId: string) => {
                    if (roleId !== user.role.id) {
                      updateUserRole({ userId: user.id, roleId })
                    }
                  }}
                >
                  {assignableRoles.map((role) => (
                    <DropdownMenuRadioItem key={role.id} value={role.id}>
                      {role.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {canRemove && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setIsRemoveOpen(true)}
            >
              <UserCrossRoundedIcon />
              Gỡ khỏi hệ thống
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <RemoveUserDialog
        user={user}
        isOpen={isRemoveOpen}
        onOpenChange={setIsRemoveOpen}
      />
    </>
  )
}
