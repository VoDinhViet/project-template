import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { invitationIdSchema } from '../../schemas/invitation.schema'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const revokeInvitation = createServerFn({ method: 'POST' })
  .validator(invitationIdSchema)
  .handler(async ({ data }): Promise<void> => {
    try {
      await http.delete(`/api/invitations/${data.invitationId}`)
    } catch (error) {
      logHttpError(error, 'revokeInvitation')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
