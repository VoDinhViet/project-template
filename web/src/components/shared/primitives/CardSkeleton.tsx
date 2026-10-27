import { Skeleton } from '@/components/ui/skeleton'

const DEFAULT_LINE_COUNT = 3
const LINE_WIDTHS = ['w-full', 'w-5/6', 'w-2/3']

type CardSkeletonProps = {
  hasHeader?: boolean
  lineCount?: number
}

/**
 * Vỏ card của khung chờ: cùng `rounded-lg bg-card shadow-card` với card thật.
 *
 * Rules:
 * - Không vẽ đường kẻ `border-b` của header card thật, nên header cộng thêm 1px padding (`pb-3.25`).
 */
export function CardSkeleton({
  hasHeader = false,
  lineCount = DEFAULT_LINE_COUNT,
}: CardSkeletonProps) {
  return (
    <section
      aria-hidden
      className="overflow-hidden rounded-lg bg-card shadow-card"
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-3.25 sm:px-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
      )}
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        {Array.from({ length: lineCount }, (_line, lineIndex) => (
          <Skeleton
            key={lineIndex}
            className={`h-4.5 ${LINE_WIDTHS[lineIndex % LINE_WIDTHS.length]}`}
          />
        ))}
      </div>
    </section>
  )
}
