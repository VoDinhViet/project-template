import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { createInvitations } from '../api/server-functions/create-invitations.api'
import type { CreateInvitationsSchema } from '../schemas/invitation.schema'

export function useCreateInvitations() {
  const queryClient = useQueryClient()
  const createInvitationsFn = useServerFn(createInvitations)

  return useMutation({
    mutationFn: (value: CreateInvitationsSchema) =>
      createInvitationsFn({ data: value }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: (error) => toast.error(error.message),
  })
}
