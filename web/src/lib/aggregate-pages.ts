import type { OffsetPaginated } from '@/lib/types/pagination.type'

/** Lấy hết các trang của một danh sách `api`: trang đầu cho biết tổng số trang, các trang còn lại lấy song song. */
export async function aggregatePages<TItem>(
  fetchPage: (page: number) => Promise<OffsetPaginated<TItem>>,
): Promise<TItem[]> {
  const firstPage = await fetchPage(1)
  const remainingPages = await Promise.all(
    Array.from(
      { length: Math.max(firstPage.pagination.totalPages - 1, 0) },
      (_, index) => fetchPage(index + 2),
    ),
  )
  return [firstPage, ...remainingPages].flatMap((page) => page.data)
}
