import { queryOptions } from '@tanstack/react-query'
import type { InvitationSuggestionsQuery } from '../../schemas/invitation.schema'
import { getInvitationSuggestions } from '../server-functions/get-invitation-suggestions.api'

export const invitationSuggestionsQueryOptions = (
  query: InvitationSuggestionsQuery,
) =>
  queryOptions({
    queryKey: ['invitations', 'suggestions', query],
    queryFn: () => getInvitationSuggestions({ data: query }),
  })
