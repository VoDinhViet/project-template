import { AddCircleIcon } from '@solar-icons/react/linear'
import { useQuery } from '@tanstack/react-query'
import { PermissionGate } from '@/components/shared/composites/PermissionGate'
import { LinkButton } from '@/components/shared/primitives/LinkButton'
import { TableSkeleton } from '@/components/shared/primitives/TableSkeleton'
import { rolesQueryOptions } from '../../api'
import { RolesTable } from './RolesTable'

export function RolesPanel() {
  const { data: roles, isFetching, error } = useQuery(rolesQueryOptions())

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {roles && (
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {roles.length}
            </span>{' '}
            vai trò
          </p>
        )}
        <PermissionGate permission="roles:create">
          <div className="ml-auto">
            <LinkButton to="/roles/new">
              <AddCircleIcon />
              Tạo vai trò
            </LinkButton>
          </div>
        </PermissionGate>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
      {!roles && !error && (
        <TableSkeleton
          columnWidths={['w-40', 'flex-1', 'w-24', 'w-8']}
          rowCount={4}
        />
      )}
      {roles && <RolesTable roles={roles} isPending={isFetching} />}
    </div>
  )
}
