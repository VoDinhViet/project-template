import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { invitationIdSchema } from '../../schemas/invitation.schema'
import type { InvitationToken } from '../../types/invitation.type'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const regenerateInvitation = createServerFn({ method: 'POST' })
  .validator(invitationIdSchema)
  .handler(async ({ data }): Promise<InvitationToken> => {
    try {
      const response = await http.post<InvitationToken>(
        `/api/invitations/${data.invitationId}/regenerate`,
      )
      return response.data
    } catch (error) {
      logHttpError(error, 'regenerateInvitation')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
