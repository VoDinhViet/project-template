import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { PaginationBar } from '@/components/shared/composites/PaginationBar'
import { SearchInput } from '@/components/shared/composites/SearchInput'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableSkeleton } from '@/components/shared/primitives/TableSkeleton'
import { useHasPermission } from '@/hooks/use-has-permission'
import { rolesQueryOptions, usersQueryOptions } from '../../api'
import { UsersTable } from './UsersTable'

const ALL_ROLES = 'ALL'

export function UsersPanel() {
  const { page, q, roleId } = useSearch({ from: '/(authed)/users' })
  const navigate = useNavigate({ from: '/users' })
  const {
    data: users,
    isFetching,
    error,
  } = useQuery({
    ...usersQueryOptions({ page, q, roleId }),
    placeholderData: keepPreviousData,
  })
  const canReadRoles = useHasPermission('roles:read')
  const { data: roles = [] } = useQuery({
    ...rolesQueryOptions(),
    enabled: canReadRoles,
  })
  const roleFilterOptions = [
    { value: ALL_ROLES, label: 'Tất cả vai trò' },
    // Admin hệ thống không hiện trong danh sách nên lọc theo vai trò hệ thống luôn rỗng.
    ...roles
      .filter((role) => !role.isSystem)
      .map((role) => ({ value: role.id, label: role.name })),
  ]

  const handleSearch = useCallback(
    (keyword: string) =>
      navigate({
        search: (previous) => ({
          ...previous,
          q: keyword || undefined,
          page: undefined,
        }),
        replace: true,
      }),
    [navigate],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={q ?? ''}
          label="Tìm người dùng"
          placeholder="Tìm theo tên hoặc email…"
          onSearch={handleSearch}
        />
        <Select
          items={roleFilterOptions}
          value={roleId ?? ALL_ROLES}
          onValueChange={(value) =>
            navigate({
              search: (previous) => ({
                ...previous,
                roleId: value === ALL_ROLES ? undefined : (value ?? undefined),
                page: undefined,
              }),
            })
          }
        >
          <SelectTrigger className="w-48" aria-label="Lọc theo vai trò">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {users && (
          <p className="ml-auto text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {users.pagination.totalRecords}
            </span>{' '}
            người dùng{(q || roleId) && ' khớp bộ lọc'}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
      {!users && !error && (
        <TableSkeleton
          columnWidths={['flex-1', 'w-32', 'w-24', 'w-28', 'w-8']}
        />
      )}
      {users && (
        <>
          <UsersTable users={users.data} isPending={isFetching} />
          <PaginationBar
            pagination={users.pagination}
            isPending={isFetching}
            onPageChange={(nextPage) =>
              navigate({
                search: (previous) => ({ ...previous, page: nextPage }),
              })
            }
          />
        </>
      )}
    </div>
  )
}
