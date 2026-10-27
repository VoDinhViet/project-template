import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { createInvitationsSchema } from '../../schemas/invitation.schema'
import type { InvitationResult } from '@/lib/types/invitation.type'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const createInvitations = createServerFn({ method: 'POST' })
  .validator(createInvitationsSchema)
  .handler(async ({ data }): Promise<InvitationResult[]> => {
    try {
      const response = await http.post<InvitationResult[]>(
        '/api/invitations',
        data,
      )
      return response.data
    } catch (error) {
      logHttpError(error, 'createInvitations')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
