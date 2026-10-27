import { Skeleton } from '@/components/ui/skeleton'

const DEFAULT_ROW_COUNT = 8

type TableSkeletonProps = {
  columnWidths: string[]
  rowCount?: number
}

/**
 * Khung chờ của bảng `components/ui/table.tsx`: cùng chiều cao header (48px) và dòng (44px).
 *
 * Rules:
 * - Không vẽ khung viền, đường kẻ header và đường kẻ giữa các dòng của bảng thật, nên mỗi chỗ đó
 *   cộng thêm 1px (`p-px`, `h-12.25`, `h-11.25`); dòng cuối của bảng thật không có đường kẻ.
 * - `columnWidths` là class chiều rộng từng cột (`w-48`, `flex-1`), dùng chung cho header và dòng.
 */
export function TableSkeleton({
  columnWidths,
  rowCount = DEFAULT_ROW_COUNT,
}: TableSkeletonProps) {
  return (
    <div aria-hidden className="overflow-hidden rounded-md bg-card p-px">
      <div className="flex h-12.25 items-center gap-4 bg-secondary/40 px-4 pb-px">
        {columnWidths.map((columnWidth, columnIndex) => (
          <Skeleton key={columnIndex} className={`h-3 ${columnWidth}`} />
        ))}
      </div>
      {Array.from({ length: rowCount }, (_row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex h-11.25 items-center gap-4 px-4 pb-px last:h-11 last:pb-0"
        >
          {columnWidths.map((columnWidth, columnIndex) => (
            <Skeleton key={columnIndex} className={`h-5 ${columnWidth}`} />
          ))}
        </div>
      ))}
    </div>
  )
}
