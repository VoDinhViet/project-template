import { DangerTriangleIcon } from '@solar-icons/react/bold'
import { CheckReadIcon, CloseCircleIcon } from '@solar-icons/react/linear'
import { useRouteContext } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { hasPermission } from '@/lib/permission'
import type { Permission } from '@/lib/types/role.type'
import { cn } from '@/lib/utils'
import { permissionsQueryOptions } from '../../api'
import { SENSITIVE_PERMISSIONS } from '../../constants/role.constant'
import { groupPermissionInfos } from '../../utils/group-permissions'
import { PermissionGroupsSkeleton } from './PermissionGroupsSkeleton'

type PermissionGroupsProps = {
  permissions: Permission[]
  onPermissionsChange: (permissions: Permission[]) => void
}

/** Khớp `ensureCanGrantPermissions` của `api`: chỉ tích được quyền mình đang có. */
export function PermissionGroups({
  permissions,
  onPermissionsChange,
}: PermissionGroupsProps) {
  const { currentUser } = useRouteContext({ from: '/(authed)' })
  const {
    data: permissionInfos = [],
    error,
    isPending,
  } = useQuery(permissionsQueryOptions())

  const togglePermission = (permission: Permission, isChecked: boolean) =>
    onPermissionsChange(
      isChecked
        ? [...permissions, permission]
        : permissions.filter(
            (selectedPermission) => selectedPermission !== permission,
          ),
    )

  const toggleGroup = (grantableCodes: Permission[], isAllSelected: boolean) =>
    onPermissionsChange(
      isAllSelected
        ? permissions.filter(
            (selectedPermission) =>
              !grantableCodes.includes(selectedPermission),
          )
        : [...new Set([...permissions, ...grantableCodes])],
    )

  return (
    <div className="flex flex-col gap-4">
      {!currentUser.role?.isSystem && (
        <p className="text-sm text-muted-foreground">
          Chỉ chọn được quyền bạn đang có.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
      {isPending ? (
        <PermissionGroupsSkeleton />
      ) : (
        // Cột chia theo bề rộng của chính khối này (không theo màn hình), vì cột tóm tắt chiếm chỗ bên phải.
        <div className="@container">
          <div className="grid items-start gap-4 @2xl:grid-cols-2">
            {[...groupPermissionInfos(permissionInfos)].map(
              ([groupName, groupInfos]) => {
                const grantableCodes = groupInfos
                  .map((permissionInfo) => permissionInfo.code)
                  .filter((code) => hasPermission(currentUser, code))
                const selectedCount = groupInfos.filter((permissionInfo) =>
                  permissions.includes(permissionInfo.code),
                ).length
                const isAllSelected =
                  grantableCodes.length > 0 &&
                  grantableCodes.every((code) => permissions.includes(code))
                return (
                  <section
                    key={groupName}
                    className="overflow-hidden rounded-lg bg-card shadow-card"
                  >
                    <div className="flex items-center gap-2.5 border-b px-4 py-2.5">
                      <h3 className="text-sm font-semibold">{groupName}</h3>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                          selectedCount === groupInfos.length
                            ? 'bg-primary text-primary-foreground'
                            : selectedCount > 0
                              ? 'bg-primary/10 text-primary'
                              : 'bg-secondary text-muted-foreground',
                        )}
                      >
                        {selectedCount}/{groupInfos.length}
                      </span>
                      {grantableCodes.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          aria-label={`${isAllSelected ? 'Bỏ chọn hết' : 'Chọn hết'} nhóm ${groupName}`}
                          onClick={() =>
                            toggleGroup(grantableCodes, isAllSelected)
                          }
                        >
                          {isAllSelected ? (
                            <CloseCircleIcon />
                          ) : (
                            <CheckReadIcon />
                          )}
                          {isAllSelected ? 'Bỏ chọn hết' : 'Chọn hết'}
                        </Button>
                      )}
                    </div>
                    <div className="divide-y">
                      {groupInfos.map((permissionInfo) => {
                        const canGrant = hasPermission(
                          currentUser,
                          permissionInfo.code,
                        )
                        const isChecked = permissions.includes(
                          permissionInfo.code,
                        )
                        return (
                          <label
                            key={permissionInfo.code}
                            className={cn(
                              'flex items-start gap-3 px-4 py-3 transition-colors',
                              canGrant
                                ? 'cursor-pointer hover:bg-muted/50'
                                : 'cursor-not-allowed',
                              isChecked && 'bg-primary/5',
                            )}
                          >
                            <Checkbox
                              className="mt-0.5 border-foreground/55"
                              checked={isChecked}
                              disabled={!canGrant}
                              onCheckedChange={(nextChecked) =>
                                togglePermission(
                                  permissionInfo.code,
                                  nextChecked,
                                )
                              }
                            />
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span
                                className={cn(
                                  'flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium',
                                  !canGrant && 'opacity-60',
                                )}
                              >
                                {permissionInfo.name}
                                {SENSITIVE_PERMISSIONS.includes(
                                  permissionInfo.code,
                                ) && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-ink">
                                    <DangerTriangleIcon className="size-3.5" />
                                    Nhạy cảm
                                  </span>
                                )}
                              </span>
                              <span
                                className={cn(
                                  'text-xs leading-normal text-muted-foreground',
                                  !canGrant && 'opacity-60',
                                )}
                              >
                                {permissionInfo.description}
                              </span>
                              {!canGrant && (
                                <span className="text-xs leading-normal text-muted-foreground">
                                  Bạn chưa có quyền này nên không trao được.
                                </span>
                              )}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </section>
                )
              },
            )}
          </div>
        </div>
      )}
    </div>
  )
}
