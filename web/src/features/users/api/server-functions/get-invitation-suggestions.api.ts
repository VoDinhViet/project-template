import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { invitationSuggestionsQuerySchema } from '../../schemas/invitation.schema'
import type { InvitationSuggestion } from '../../types/invitation.type'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const getInvitationSuggestions = createServerFn({ method: 'GET' })
  .validator(invitationSuggestionsQuerySchema)
  .handler(async ({ data }): Promise<InvitationSuggestion[]> => {
    try {
      const response = await http.get<InvitationSuggestion[]>(
        '/api/invitations/suggestions',
        { params: { q: data.q || undefined } },
      )
      return response.data
    } catch (error) {
      logHttpError(error, 'getInvitationSuggestions')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
