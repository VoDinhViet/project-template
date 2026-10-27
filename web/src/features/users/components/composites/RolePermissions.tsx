import { CheckCircleIcon, DangerTriangleIcon } from '@solar-icons/react/bold'
import { useQuery } from '@tanstack/react-query'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Role } from '@/lib/types/role.type'
import { cn } from '@/lib/utils'
import { permissionsQueryOptions } from '../../api'
import {
  SENSITIVE_PERMISSIONS,
  defaultPermissionGroupStyle,
  permissionGroupStyles,
} from '../../constants/role.constant'
import { groupPermissionInfos } from '../../utils/group-permissions'

type RolePermissionsProps = {
  role: Role
}

/**
 * Tóm tắt quyền của vai trò gọn một khối: tổng số kèm thanh tỉ lệ, cảnh báo quyền nhạy cảm, rồi mỗi
 * nhóm có quyền là một thẻ nhỏ (icon màu + số quyền). Bấm thẻ mở popover có tên nhóm và từng quyền
 * kèm mô tả; dùng popover (bấm) thay vì tooltip (rê chuột) để màn cảm ứng cũng xem được.
 *
 * Rules:
 * - `role.permissions` chỉ có mã; tên, mô tả và nhóm lấy từ danh mục `GET /permissions` (đã cache).
 */
export function RolePermissions({ role }: RolePermissionsProps) {
  const { data: permissionInfos = [] } = useQuery(permissionsQueryOptions())
  if (role.isSystem) {
    // Cột Tên đã có nhãn "Toàn quyền" nên ô này để trống.
    return null
  }
  if (role.permissions.length === 0) {
    // Vai trò không có mã quyền nào vẫn vào được hệ thống và dùng các route không gắn `@Permissions`.
    return (
      <span className="text-xs text-muted-foreground">
        Chỉ vào hệ thống, chưa có quyền quản lý
      </span>
    )
  }

  const sensitiveCount = role.permissions.filter((permission) =>
    SENSITIVE_PERMISSIONS.includes(permission),
  ).length
  const ratio =
    permissionInfos.length > 0
      ? role.permissions.length / permissionInfos.length
      : 0

  return (
    <div className="flex flex-col gap-2.5 py-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm text-muted-foreground tabular-nums">
          <span className="text-base font-bold text-foreground">
            {role.permissions.length}
          </span>
          {permissionInfos.length > 0 && ` / ${permissionInfos.length}`} quyền
        </span>
        <span
          aria-hidden
          className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"
        >
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${ratio * 100}%` }}
          />
        </span>
        {sensitiveCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-ink">
            <DangerTriangleIcon className="size-3.5" />
            {sensitiveCount} nhạy cảm
          </span>
        )}
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {[...groupPermissionInfos(permissionInfos)].map(
          ([groupName, groupInfos]) => {
            const grantedInfos = groupInfos.filter((permissionInfo) =>
              role.permissions.includes(permissionInfo.code),
            )
            if (grantedInfos.length === 0) {
              return null
            }
            const { icon: GroupIcon, tileClassName } =
              permissionGroupStyles[groupName] ?? defaultPermissionGroupStyle
            const isFullGroup = grantedInfos.length === groupInfos.length
            return (
              <li key={groupName}>
                <Popover>
                  <PopoverTrigger
                    aria-label={`Xem quyền nhóm ${groupName} của vai trò ${role.name}`}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-1 rounded-md py-0.5 pr-1.5 pl-0.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                      isFullGroup
                        ? 'bg-primary/10 text-primary hover:bg-primary/15'
                        : 'bg-muted text-foreground hover:bg-foreground/10',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'flex size-5 items-center justify-center rounded',
                        tileClassName,
                      )}
                    >
                      <GroupIcon className="size-3" />
                    </span>
                    <span className="tabular-nums">
                      {grantedInfos.length}/{groupInfos.length}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 gap-3 p-3">
                    <PopoverHeader className="flex-row items-center gap-2.5">
                      <span
                        aria-hidden
                        className={cn(
                          'flex size-8 items-center justify-center rounded-md',
                          tileClassName,
                        )}
                      >
                        <GroupIcon className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <PopoverTitle>{groupName}</PopoverTitle>
                        <p className="text-xs text-muted-foreground">
                          {role.name} có {grantedInfos.length}/
                          {groupInfos.length} quyền
                        </p>
                      </div>
                    </PopoverHeader>
                    <ul className="flex flex-col gap-2">
                      {groupInfos.map((permissionInfo) => {
                        const isGranted = role.permissions.includes(
                          permissionInfo.code,
                        )
                        const isSensitive = SENSITIVE_PERMISSIONS.includes(
                          permissionInfo.code,
                        )
                        return (
                          <li
                            key={permissionInfo.code}
                            className={cn(
                              'flex items-start gap-2',
                              !isGranted && 'opacity-50',
                            )}
                          >
                            {isGranted ? (
                              isSensitive ? (
                                <DangerTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning-ink" />
                              ) : (
                                <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-success-ink" />
                              )
                            ) : (
                              <span
                                aria-hidden
                                className="mt-0.75 size-3.5 shrink-0 rounded-full border border-foreground/30"
                              />
                            )}
                            <div className="flex min-w-0 flex-col">
                              <span className="text-xs font-semibold">
                                {permissionInfo.name}
                                {isSensitive && (
                                  <span className="ml-1.5 font-medium text-warning-ink">
                                    Nhạy cảm
                                  </span>
                                )}
                                {!isGranted && (
                                  <span className="ml-1.5 font-normal text-muted-foreground">
                                    Chưa có
                                  </span>
                                )}
                              </span>
                              <span className="text-xs leading-normal text-muted-foreground">
                                {permissionInfo.description}
                              </span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </PopoverContent>
                </Popover>
              </li>
            )
          },
        )}
      </ul>
    </div>
  )
}
