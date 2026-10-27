import { infiniteQueryOptions } from '@tanstack/react-query'
import { USER_PAGE_LIMIT } from '@/lib/constants'
import { getUsers } from '../server-functions/get-users.api'

/** Ô chọn người dùng: tìm phía server theo `q`, mỗi lần lấy thêm một trang. */
export const usersInfiniteQueryOptions = (q: string | undefined) =>
  infiniteQueryOptions({
    queryKey: ['users', 'infinite', q],
    queryFn: ({ pageParam }) =>
      getUsers({ data: { q, page: pageParam, limit: USER_PAGE_LIMIT } }),
    initialPageParam: 1,
    getNextPageParam: (userPage) => userPage.pagination.nextPage,
    select: (infiniteData) =>
      infiniteData.pages.flatMap((userPage) => userPage.data),
  })
