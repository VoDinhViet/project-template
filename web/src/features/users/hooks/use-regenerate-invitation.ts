import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { regenerateInvitation } from '../api/server-functions/regenerate-invitation.api'
import type { InvitationIdSchema } from '../schemas/invitation.schema'

export function useRegenerateInvitation() {
  const queryClient = useQueryClient()
  const regenerateInvitationFn = useServerFn(regenerateInvitation)

  return useMutation({
    mutationFn: (value: InvitationIdSchema) =>
      regenerateInvitationFn({ data: value }),
    onSuccess: async () => {
      // Hạn của lời mời đổi theo link mới.
      await queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: (error) => toast.error(error.message),
  })
}
