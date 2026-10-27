import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { revokeInvitation } from '../api/server-functions/revoke-invitation.api'
import type { InvitationIdSchema } from '../schemas/invitation.schema'

export function useRevokeInvitation() {
  const queryClient = useQueryClient()
  const revokeInvitationFn = useServerFn(revokeInvitation)

  return useMutation({
    mutationFn: (value: InvitationIdSchema) =>
      revokeInvitationFn({ data: value }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast.success('Đã thu hồi lời mời.')
    },
    onError: (error) => toast.error(error.message),
  })
}
