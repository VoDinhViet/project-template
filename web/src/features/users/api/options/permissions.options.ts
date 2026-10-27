import { queryOptions } from '@tanstack/react-query'
import { getPermissions } from '../server-functions/get-permissions.api'

// Danh mục quyền nằm trong code của `api`, chỉ đổi khi deploy.
export const permissionsQueryOptions = () =>
  queryOptions({
    queryKey: ['permissions', 'list'],
    queryFn: () => getPermissions(),
    staleTime: 15 * 60 * 1000,
  })
