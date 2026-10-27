export class OffsetPaginationDto {
  limit: number;
  currentPage: number;
  nextPage?: number;
  previousPage?: number;
  totalRecords: number;
  totalPages: number;
}

export class OffsetPaginatedDto<TItem> {
  data: TItem[];
  pagination: OffsetPaginationDto;

  constructor(
    items: TItem[],
    totalRecords: number,
    limit: number,
    currentPage: number,
  ) {
    const totalPages = Math.ceil(totalRecords / limit);
    this.data = items;
    this.pagination = {
      limit,
      currentPage,
      nextPage: currentPage < totalPages ? currentPage + 1 : undefined,
      previousPage: currentPage > 1 ? currentPage - 1 : undefined,
      totalRecords,
      totalPages,
    };
  }
}
