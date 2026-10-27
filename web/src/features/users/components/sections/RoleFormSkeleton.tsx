import { Skeleton } from '@/components/ui/skeleton'
import { PermissionGroupsSkeleton } from '../composites/PermissionGroupsSkeleton'

const SUMMARY_ROW_SKELETON_COUNT = 6

/**
 * Khung chờ của `RoleForm`: cùng vỏ card và kích thước thật để trang không nhảy khi dữ liệu về.
 *
 * Rules:
 * - Khung chờ không vẽ đường kẻ `border-b`/`border-t` của `RoleForm` và `RoleSummary`, nên phía có
 *   đường kẻ cộng thêm 1px padding (`pb-3.25`, `pt-4.25`).
 * - `h-4.75` là dòng nhãn `text-sm leading-snug` (19px), `h-16` là `min-h-16` của ô mô tả.
 */
export function RoleFormSkeleton() {
  return (
    <div
      aria-busy
      className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <span role="status" className="sr-only">
        Đang tải vai trò…
      </span>
      <div className="flex flex-col gap-4">
        <section
          aria-hidden
          className="overflow-hidden rounded-lg bg-card shadow-card"
        >
          <div className="px-4 pt-3 pb-3.25 sm:px-5">
            <Skeleton className="h-6 w-36" />
          </div>
          <div className="flex flex-col gap-5 p-4 sm:p-5">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4.75 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4.75 w-12" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </section>
        <div aria-hidden className="flex flex-col gap-0.5 pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </div>
        <PermissionGroupsSkeleton />
      </div>
      <aside
        aria-hidden
        className="flex flex-col overflow-hidden rounded-lg bg-card shadow-card"
      >
        <div className="flex flex-col gap-2.5 px-4 pt-3 pb-3.25 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <div className="flex flex-col p-2 sm:p-3">
          {Array.from(
            { length: SUMMARY_ROW_SKELETON_COUNT },
            (_summaryRow, rowIndex) => (
              <div key={rowIndex} className="px-2 py-2">
                <Skeleton className="h-5 w-full" />
              </div>
            ),
          )}
        </div>
        <div className="flex flex-col gap-2 bg-muted/40 px-4 pt-4.25 pb-4 sm:px-5">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </aside>
    </div>
  )
}
