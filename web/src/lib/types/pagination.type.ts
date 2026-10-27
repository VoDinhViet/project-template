export type OffsetPagination = {
  limit: number
  currentPage: number
  nextPage?: number
  previousPage?: number
  totalRecords: number
  totalPages: number
}

export type OffsetPaginated<TItem> = {
  data: TItem[]
  pagination: OffsetPagination
}
