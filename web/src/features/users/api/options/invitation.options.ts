import { queryOptions } from '@tanstack/react-query'
import { getInvitation } from '../server-functions/get-invitation.api'

export const invitationQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ['invitations', 'detail', token],
    queryFn: () => getInvitation({ data: { token } }),
  })
