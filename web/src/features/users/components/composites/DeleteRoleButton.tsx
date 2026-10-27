import { useRouteContext } from '@tanstack/react-router'
import { TrashBinMinimalisticIcon } from '@solar-icons/react/linear'
import { useState } from 'react'
import { ActionIconButton } from '@/components/shared/primitives/ActionIconButton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useHasPermission } from '@/hooks/use-has-permission'
import type { Role } from '@/lib/types/role.type'
import { canGrantRole } from '../../utils/grant'
import { DeleteRoleDialog } from './DeleteRoleDialog'

type DeleteRoleButtonProps = {
  role: Role
}

/** Khớp `deleteRole` của `api`: phải trao được vai trò (nên không xoá được vai trò hệ thống). */
export function DeleteRoleButton({ role }: DeleteRoleButtonProps) {
  const { currentUser } = useRouteContext({ from: '/(authed)' })
  const hasDeletePermission = useHasPermission('roles:delete')
  const [isOpen, setIsOpen] = useState(false)
  if (!hasDeletePermission || !canGrantRole(currentUser, role)) {
    return null
  }
  // `api` chặn xoá vai trò còn người giữ (`ensureRoleNotInUse`).
  const isInUse = role.userCount > 0

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <ActionIconButton
              tone="destructive"
              aria-label={`Xoá vai trò ${role.name}`}
              disabled={isInUse}
              // Nút bị khoá vẫn phải nhận hover để tooltip giải thích lý do.
              focusableWhenDisabled
              onClick={() => setIsOpen(true)}
            />
          }
        >
          <TrashBinMinimalisticIcon />
        </TooltipTrigger>
        <TooltipContent>
          {isInUse ? 'Còn người giữ, chưa xoá được' : 'Xoá vai trò'}
        </TooltipContent>
      </Tooltip>
      <DeleteRoleDialog role={role} isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
