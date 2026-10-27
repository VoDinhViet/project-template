import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { invitationTokenSchema } from '../../schemas/invitation.schema'
import type { Invitation } from '../../types/invitation.type'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const getInvitation = createServerFn({ method: 'GET' })
  .validator(invitationTokenSchema)
  .handler(async ({ data }): Promise<Invitation> => {
    try {
      const response = await http.get<Invitation>(
        `/api/invitations/${encodeURIComponent(data.token)}`,
      )
      return response.data
    } catch (error) {
      logHttpError(error, 'getInvitation')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
