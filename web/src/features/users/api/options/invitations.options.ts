import { queryOptions } from '@tanstack/react-query'
import type { InvitationsQuery } from '../../schemas/users-search.schema'
import { getInvitations } from '../server-functions/get-invitations.api'

export const invitationsQueryOptions = (query: InvitationsQuery) =>
  queryOptions({
    queryKey: ['invitations', 'list', query],
    queryFn: () => getInvitations({ data: query }),
  })
