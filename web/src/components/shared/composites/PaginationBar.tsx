import { AltArrowLeftIcon, AltArrowRightIcon } from '@solar-icons/react/linear'
import { Button } from '@/components/ui/button'
import type { OffsetPagination } from '@/lib/types/pagination.type'

type PaginationBarProps = {
  pagination: OffsetPagination
  isPending: boolean
  onPageChange: (page: number) => void
}

export function PaginationBar({
  pagination,
  isPending,
  onPageChange,
}: PaginationBarProps) {
  const { currentPage, totalPages, totalRecords, previousPage, nextPage } =
    pagination

  return (
    <nav
      aria-label="Phân trang"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-muted-foreground">
        Tổng{' '}
        <span className="font-semibold text-foreground tabular-nums">
          {totalRecords}
        </span>{' '}
        bản ghi
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending || previousPage === undefined}
          onClick={() => previousPage && onPageChange(previousPage)}
        >
          <AltArrowLeftIcon />
          Trước
        </Button>
        <span className="min-w-24 text-center text-sm font-semibold tabular-nums">
          Trang {currentPage}/{Math.max(totalPages, 1)}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || nextPage === undefined}
          onClick={() => nextPage && onPageChange(nextPage)}
        >
          Sau
          <AltArrowRightIcon />
        </Button>
      </div>
    </nav>
  )
}
