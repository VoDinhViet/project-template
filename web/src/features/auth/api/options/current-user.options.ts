import { queryOptions } from '@tanstack/react-query'
import { getCurrentUser } from '../server-functions/get-current-user.api'

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: ['auth', 'current-user'],
    queryFn: () => getCurrentUser(),
    // Guard `(authed)` chờ truy vấn này trước mỗi lần chuyển trang; `api` vẫn kiểm vai trò ở mọi
    // request, và đổi quyền đã invalidate qua `useRefreshUserAccess`.
    staleTime: 5 * 60 * 1000,
  })
