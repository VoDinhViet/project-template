import { queryOptions } from '@tanstack/react-query'
import { getRoles } from '../server-functions/get-roles.api'

export const rolesQueryOptions = () =>
  queryOptions({
    queryKey: ['roles', 'list'],
    queryFn: () => getRoles(),
  })
