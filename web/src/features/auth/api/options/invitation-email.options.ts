import { queryOptions } from '@tanstack/react-query'
import { getInvitationEmail } from '../server-functions/get-invitation-email.api'

export const invitationEmailQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ['auth', 'invitation-email', token],
    queryFn: () => getInvitationEmail({ data: { token } }),
    // Link sai là lỗi cố định, thử lại chỉ làm trang chờ lâu mới báo lỗi.
    retry: false,
  })
