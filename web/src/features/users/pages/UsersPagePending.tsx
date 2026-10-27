import { PermissionGate } from '@/components/shared/composites/PermissionGate'
import { PageShell } from '@/components/shared/layouts/PageShell'
import { StatCardsSkeleton } from '@/components/shared/primitives/StatCardsSkeleton'
import { TableSkeleton } from '@/components/shared/primitives/TableSkeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { useHasPermission } from '@/hooks/use-has-permission'

const ROLE_BREAKDOWN_ROW_COUNT = 5

/**
 * Trang chờ của `/users`: cùng khung với `UsersPage` (thẻ thống kê, thẻ tab + bảng, cột tóm tắt vai trò).
 *
 * Rules:
 * - Hàng tab không vẽ đường kẻ `border-b` của `UsersTabs`, nên cao 49px (`h-12.25`).
 * - Số tab và cột vai trò theo quyền như trang thật, để không nhảy bố cục khi dữ liệu về.
 */
export function UsersPagePending() {
  const canInvite = useHasPermission('users:invite')
  const canReadRoles = useHasPermission('roles:read')
  const tabCount = 1 + Number(canInvite) + Number(canReadRoles)

  return (
    <PageShell
      title="Người dùng"
      actions={
        canInvite &&
        canReadRoles && <Skeleton aria-hidden className="h-9 w-36.5" />
      }
    >
      <div aria-busy className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          Đang tải người dùng…
        </span>
        <StatCardsSkeleton cardCount={canInvite ? 4 : 2} />
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section
            aria-hidden
            className="overflow-hidden rounded-lg bg-card shadow-card"
          >
            <div className="flex h-12.25 items-center gap-6 px-4 sm:px-5">
              {Array.from({ length: tabCount }, (_tab, tabIndex) => (
                <Skeleton key={tabIndex} className="h-5 w-28" />
              ))}
            </div>
            <div className="flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-9 w-44" />
              </div>
              <TableSkeleton
                columnWidths={['flex-1', 'w-32', 'w-24', 'w-28', 'w-8']}
              />
            </div>
          </section>
          <PermissionGate permission="roles:read">
            <aside
              aria-hidden
              className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-card sm:p-5"
            >
              <Skeleton className="h-8 w-full" />
              <div className="flex flex-col gap-0.75">
                {Array.from(
                  { length: ROLE_BREAKDOWN_ROW_COUNT },
                  (_role, roleIndex) => (
                    <Skeleton key={roleIndex} className="h-7 w-full" />
                  ),
                )}
              </div>
            </aside>
          </PermissionGate>
        </div>
      </div>
    </PageShell>
  )
}
