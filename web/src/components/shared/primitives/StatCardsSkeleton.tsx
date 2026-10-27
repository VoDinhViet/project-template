import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type StatCardCount = 2 | 3 | 4 | 5

const statCardGridClasses: Record<StatCardCount, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 xl:grid-cols-4',
  5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
}

type StatCardsSkeletonProps = {
  cardCount?: StatCardCount
}

/** Cùng lưới và chiều cao (106px) với các thẻ thống kê thật (người dùng, vai trò). */
export function StatCardsSkeleton({ cardCount = 5 }: StatCardsSkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('grid grid-cols-1 gap-4', statCardGridClasses[cardCount])}
    >
      {Array.from({ length: cardCount }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-card"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="flex flex-col">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7.5 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  )
}
