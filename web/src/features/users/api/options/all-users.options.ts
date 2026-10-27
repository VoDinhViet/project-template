import { queryOptions } from '@tanstack/react-query'
import { aggregatePages } from '@/lib/aggregate-pages'
import { MAX_PAGE_LIMIT } from '@/lib/constants'
import { getUsers } from '../server-functions/get-users.api'

/** Mọi người dùng, lấy hết các trang: ô chọn người và tra tên theo id ở nhiều feature cần đủ. */
export const allUsersQueryOptions = () =>
  queryOptions({
    queryKey: ['users', 'all-users'],
    queryFn: () =>
      aggregatePages((page) =>
        getUsers({ data: { page, limit: MAX_PAGE_LIMIT } }),
      ),
  })
