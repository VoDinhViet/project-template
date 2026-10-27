import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { PaginationBar } from '@/components/shared/composites/PaginationBar'
import { SearchInput } from '@/components/shared/composites/SearchInput'
import { TableSkeleton } from '@/components/shared/primitives/TableSkeleton'
import { invitationsQueryOptions } from '../../api'
import { InvitationsTable } from './InvitationsTable'

export function InvitationsPanel() {
  const { page, q } = useSearch({ from: '/(authed)/users' })
  const navigate = useNavigate({ from: '/users' })
  const {
    data: invitations,
    isFetching,
    error,
  } = useQuery({
    ...invitationsQueryOptions({ page, q }),
    placeholderData: keepPreviousData,
  })

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
          label="Tìm lời mời"
          placeholder="Tìm theo email…"
          onSearch={handleSearch}
        />
        <p className="ml-auto text-xs text-muted-foreground">
          Link mời có hạn 7 ngày, hết hạn thì gửi lại link mới.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
      {!invitations && !error && (
        <TableSkeleton
          columnWidths={['flex-1', 'w-32', 'w-24', 'w-28', 'w-8']}
          rowCount={5}
        />
      )}
      {invitations && (
        <>
          <InvitationsTable
            invitations={invitations.data}
            isPending={isFetching}
          />
          <PaginationBar
            pagination={invitations.pagination}
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
