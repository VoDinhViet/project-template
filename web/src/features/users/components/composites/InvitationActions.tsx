import { useRouteContext } from '@tanstack/react-router'
import {
  CloseCircleIcon,
  MenuDotsIcon,
  RefreshIcon,
} from '@solar-icons/react/linear'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { InvitationLinkList } from '@/components/shared/composites/InvitationLinkList'
import { ActionIconButton } from '@/components/shared/primitives/ActionIconButton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useHasPermission } from '@/hooks/use-has-permission'
import { buildInvitationLink } from '@/lib/invitation'
import { rolesQueryOptions } from '../../api'
import { useRegenerateInvitation } from '../../hooks/use-regenerate-invitation'
import { useRevokeInvitation } from '../../hooks/use-revoke-invitation'
import type { PendingInvitation } from '../../types/invitation.type'
import { canGrantRole } from '../../utils/grant'

type InvitationActionsProps = {
  invitation: PendingInvitation
}

/** Khớp `regenerateInvitation`/`revokeInvitation` của `api`: phải trao được vai trò của lời mời. */
export function InvitationActions({ invitation }: InvitationActionsProps) {
  const { currentUser } = useRouteContext({ from: '/(authed)' })
  const canReadRoles = useHasPermission('roles:read')
  const { data: roles = [] } = useQuery({
    ...rolesQueryOptions(),
    enabled: canReadRoles,
  })
  const [regeneratedLink, setRegeneratedLink] = useState<string | null>(null)
  const [isRevokeOpen, setIsRevokeOpen] = useState(false)
  const { mutate: regenerateInvitation, isPending: isRegenerating } =
    useRegenerateInvitation()
  const { mutate: revokeInvitation, isPending: isRevoking } =
    useRevokeInvitation()
  // `invitation.role` chỉ là tham chiếu gọn, phải tìm vai trò đầy đủ (kèm quyền) trong danh sách.
  const invitationRole = roles.find((role) => role.id === invitation.role.id)
  if (!invitationRole || !canGrantRole(currentUser, invitationRole)) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <ActionIconButton
              aria-label={`Thao tác với lời mời ${invitation.email}`}
            />
          }
        >
          <MenuDotsIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={isRegenerating}
            onClick={() =>
              regenerateInvitation(
                { invitationId: invitation.id },
                {
                  onSuccess: ({ token }) =>
                    setRegeneratedLink(buildInvitationLink(token)),
                },
              )
            }
          >
            <RefreshIcon className="text-info-ink" />
            Tạo link mới
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setIsRevokeOpen(true)}
          >
            <CloseCircleIcon />
            Thu hồi
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={regeneratedLink !== null}
        onOpenChange={(nextOpen) => !nextOpen && setRegeneratedLink(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link mời mới</DialogTitle>
            <DialogDescription>
              Link cũ đã hết hiệu lực. Link này chỉ hiện một lần.
            </DialogDescription>
          </DialogHeader>
          {regeneratedLink && (
            <InvitationLinkList
              invitationLinks={[
                { email: invitation.email, link: regeneratedLink },
              ]}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRevokeOpen} onOpenChange={setIsRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thu hồi lời mời</DialogTitle>
            <DialogDescription>
              Link đã gửi cho {invitation.email} sẽ không dùng được nữa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={isRevoking}
              onClick={() =>
                revokeInvitation(
                  { invitationId: invitation.id },
                  { onSuccess: () => setIsRevokeOpen(false) },
                )
              }
            >
              Thu hồi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
