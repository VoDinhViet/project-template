import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { invitationTokenSchema } from '../../schemas/invitation.schema'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const acceptInvitation = createServerFn({ method: 'POST' })
  .validator(invitationTokenSchema)
  .handler(async ({ data }): Promise<void> => {
    try {
      await http.post(
        `/api/invitations/${encodeURIComponent(data.token)}/accept`,
      )
    } catch (error) {
      logHttpError(error, 'acceptInvitation')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
