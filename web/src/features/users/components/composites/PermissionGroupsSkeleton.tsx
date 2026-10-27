import { Skeleton } from '@/components/ui/skeleton'

const GROUP_SKELETON_COUNT = 6
// Độ dài chữ khác nhau giữa các dòng cho giống nội dung thật; số dòng bằng nhau để chiều cao đoán được.
const NAME_WIDTHS = ['w-2/5', 'w-1/3', 'w-1/2']
const DESCRIPTION_WIDTHS = ['w-4/5', 'w-3/5', 'w-2/3']

/**
 * Cùng vỏ, lưới và chiều cao với `PermissionGroups` để trang không nhảy khi dữ liệu về.
 *
 * Rules:
 * - Khung chờ không vẽ `border-b` của tiêu đề nhóm, nên `pb-2.75` là `py-2.5` cộng 1px đường kẻ.
 * - `h-4.5` là dòng mô tả `text-xs leading-normal` (18px), `h-5` là dòng tên `text-sm` (20px).
 */
export function PermissionGroupsSkeleton() {
  return (
    <div aria-hidden className="@container">
      <div className="grid items-start gap-4 @2xl:grid-cols-2">
        {Array.from({ length: GROUP_SKELETON_COUNT }, (_group, groupIndex) => (
          <section
            key={groupIndex}
            className="overflow-hidden rounded-lg bg-card shadow-card"
          >
            <div className="flex items-center gap-2.5 px-4 pt-2.5 pb-2.75">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-10 rounded-full" />
              <Skeleton className="ml-auto h-8 w-24" />
            </div>
            {NAME_WIDTHS.map((nameWidth, rowIndex) => (
              <div key={nameWidth} className="flex items-start gap-3 px-4 py-3">
                <Skeleton className="mt-0.5 size-4 rounded-[4px]" />
                <div className="flex flex-1 flex-col gap-0.5">
                  <Skeleton className={`h-5 ${nameWidth}`} />
                  <div className="flex h-4.5 items-center">
                    <Skeleton
                      className={`h-3 ${DESCRIPTION_WIDTHS[rowIndex]}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
