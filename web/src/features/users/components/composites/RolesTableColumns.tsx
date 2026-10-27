import { createColumnHelper } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import type { appTableFeatures } from '@/lib/table-features'
import type { Role } from '@/lib/types/role.type'
import { RoleActions } from './RoleActions'
import { RolePermissions } from './RolePermissions'

const roleColumnHelper = createColumnHelper<typeof appTableFeatures, Role>()

export const roleColumns = roleColumnHelper.columns([
  roleColumnHelper.display({
    id: 'role',
    header: 'Vai trò',
    cell: ({ row: { original: role } }) => (
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="truncate">{role.name}</span>
          {role.isSystem && (
            <Badge className="bg-violet-soft text-violet-ink">Toàn quyền</Badge>
          )}
          {role.isDefault && (
            <Badge className="bg-info-soft text-info-ink">Mặc định</Badge>
          )}
        </span>
        {role.description && (
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {role.description}
          </span>
        )}
      </div>
    ),
  }),
  roleColumnHelper.display({
    id: 'permissions',
    header: 'Quyền',
    cell: ({ row }) => <RolePermissions role={row.original} />,
  }),
  roleColumnHelper.accessor('userCount', {
    header: 'Người giữ',
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right text-sm font-semibold tabular-nums',
    },
  }),
  roleColumnHelper.display({
    id: 'actions',
    header: '',
    meta: { headerClassName: 'w-12', cellClassName: 'text-right' },
    cell: ({ row }) => <RoleActions role={row.original} />,
  }),
])
