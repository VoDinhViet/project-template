import { DangerTriangleIcon } from '@solar-icons/react/bold'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Permission } from '@/lib/types/role.type'
import { cn } from '@/lib/utils'
import { permissionsQueryOptions } from '../../api'
import { SENSITIVE_PERMISSIONS } from '../../constants/role.constant'
import { groupPermissionInfos } from '../../utils/group-permissions'

const SUMMARY_ROW_SKELETON_COUNT = 6

type RoleSummaryProps = {
  permissions: Permission[]
  children: ReactNode
}

export function RoleSummary({ permissions, children }: RoleSummaryProps) {
  const { data: permissionInfos = [], isPending } = useQuery(
    permissionsQueryOptions(),
  )

  const selectedSensitiveInfos = permissionInfos.filter(
    (permissionInfo) =>
      permissions.includes(permissionInfo.code) &&
      SENSITIVE_PERMISSIONS.includes(permissionInfo.code),
  )

  return (
    <aside className="flex flex-col overflow-hidden rounded-lg bg-card shadow-card lg:sticky lg:top-22 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto">
      <div className="flex flex-col gap-2.5 border-b px-4 py-3 sm:px-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">Tóm tắt</h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            <span className="text-lg font-bold text-foreground">
              {permissions.length}
            </span>
            {permissionInfos.length > 0 && ` / ${permissionInfos.length}`} quyền
          </p>
        </div>
        <div
          aria-hidden
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{
              width: `${permissionInfos.length > 0 ? (permissions.length / permissionInfos.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
      <ul className="flex flex-col p-2 sm:p-3">
        {isPending &&
          Array.from(
            { length: SUMMARY_ROW_SKELETON_COUNT },
            (_summaryRow, rowIndex) => (
              <li key={rowIndex} aria-hidden className="px-2 py-2">
                <Skeleton className="h-5 w-full" />
              </li>
            ),
          )}
        {[...groupPermissionInfos(permissionInfos)].map(
          ([groupName, groupInfos]) => {
            const selectedCount = groupInfos.filter((permissionInfo) =>
              permissions.includes(permissionInfo.code),
            ).length
            return (
              <li
                key={groupName}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm"
              >
                <span
                  className={cn(
                    'flex-1 truncate',
                    selectedCount > 0
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {groupName}
                </span>
                {/* Mỗi quyền một đoạn: nhìn là biết nhóm nào đã chọn những gì; số bên cạnh là bản chữ. */}
                <span aria-hidden className="flex gap-0.5">
                  {groupInfos.map((permissionInfo) => (
                    <span
                      key={permissionInfo.code}
                      className={cn(
                        'h-1.5 w-2.5 rounded-full transition-colors',
                        permissions.includes(permissionInfo.code)
                          ? 'bg-primary'
                          : 'bg-muted',
                      )}
                    />
                  ))}
                </span>
                <span
                  className={cn(
                    'w-7 text-right text-xs tabular-nums',
                    selectedCount > 0
                      ? 'font-semibold text-primary'
                      : 'text-muted-foreground',
                  )}
                >
                  {selectedCount}/{groupInfos.length}
                </span>
              </li>
            )
          },
        )}
      </ul>
      {/* Vùng báo luôn có trong DOM: trình đọc màn hình không đọc vùng vừa được chèn kèm nội dung. */}
      <div role="status" className="empty:hidden">
        {selectedSensitiveInfos.length > 0 && (
          <div className="mx-4 mb-4 flex flex-col gap-1 rounded-md bg-warning-soft p-3 text-xs text-warning-ink sm:mx-5">
            <p className="flex items-center gap-1.5 font-semibold">
              <DangerTriangleIcon className="size-3.5" />
              Có quyền nhạy cảm
            </p>
            <p>
              {selectedSensitiveInfos
                .map((permissionInfo) => permissionInfo.name)
                .join(', ')}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t bg-muted/40 px-4 py-4 sm:px-5">
        {permissions.length === 0 && (
          <p className="text-xs leading-normal text-muted-foreground">
            Chưa chọn quyền nào: người giữ vai trò chỉ vào được hệ thống, chưa
            quản lý được gì.
          </p>
        )}
        {children}
      </div>
    </aside>
  )
}
