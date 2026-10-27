import { queryOptions } from '@tanstack/react-query'
import { getHealth } from '../server-functions/get-health.api'

export const healthQueryOptions = () =>
  queryOptions({
    queryKey: ['health', 'status'],
    queryFn: () => getHealth(),
  })
