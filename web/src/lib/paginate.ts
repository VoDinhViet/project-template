import { DEFAULT_PAGE_LIMIT } from '@/lib/constants'
import type { OffsetPaginated } from '@/lib/types/pagination.type'

/** Cắt trang phía client cho dữ liệu giả; trang vượt quá thì kẹp về trang cuối. */
export function paginate<TItem>(
  items: TItem[],
  page = 1,
  limit = DEFAULT_PAGE_LIMIT,
): OffsetPaginated<TItem> {
  const totalPages = Math.max(1, Math.ceil(items.length / limit))
  const currentPage = Math.min(page, totalPages)
  return {
    data: items.slice((currentPage - 1) * limit, currentPage * limit),
    pagination: {
      limit,
      currentPage,
      previousPage: currentPage > 1 ? currentPage - 1 : undefined,
      nextPage: currentPage < totalPages ? currentPage + 1 : undefined,
      totalRecords: items.length,
      totalPages,
    },
  }
}
