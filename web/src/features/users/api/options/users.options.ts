import { queryOptions } from '@tanstack/react-query'
import type { UsersQuery } from '../../schemas/users-search.schema'
import { getUsers } from '../server-functions/get-users.api'

export const usersQueryOptions = (query: UsersQuery) =>
  queryOptions({
    queryKey: ['users', 'list', query],
    queryFn: () => getUsers({ data: query }),
  })
