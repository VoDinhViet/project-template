import { UsersGroupRoundedIcon } from '@solar-icons/react/bold'
import { flexRender, useTable } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { appTableFeatures } from '@/lib/table-features'
import { cn } from '@/lib/utils'
import type { User } from '../../types/user.type'
import { userColumns } from '../composites/UsersTableColumns'

type UsersTableProps = {
  users: User[]
  isPending: boolean
}

export function UsersTable({ users, isPending }: UsersTableProps) {
  const table = useTable({
    data: users,
    columns: userColumns,
    features: appTableFeatures,
  })

  return (
    <Table className={cn(isPending && 'opacity-60')}>
      <TableHeader>
        <TableRow>
          {table.getFlatHeaders().map((header) => (
            <TableHead
              key={header.id}
              className={header.column.columnDef.meta?.headerClassName}
            >
              {!header.isPlaceholder &&
                flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 && (
          <TableRow>
            <TableCell colSpan={userColumns.length} className="py-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-12 items-center justify-center rounded-lg bg-muted">
                  <UsersGroupRoundedIcon
                    aria-hidden
                    className="size-6 text-muted-foreground"
                  />
                </span>
                <p className="text-sm font-semibold">
                  Không có người dùng nào khớp bộ lọc.
                </p>
              </div>
            </TableCell>
          </TableRow>
        )}
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={cell.column.columnDef.meta?.cellClassName}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
