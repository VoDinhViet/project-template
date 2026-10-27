import { ShieldUserIcon } from '@solar-icons/react/bold'
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
import type { Role } from '@/lib/types/role.type'
import { roleColumns } from '../composites/RolesTableColumns'

type RolesTableProps = {
  roles: Role[]
  isPending: boolean
}

export function RolesTable({ roles, isPending }: RolesTableProps) {
  const table = useTable({
    data: roles,
    columns: roleColumns,
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
        {roles.length === 0 && (
          <TableRow>
            <TableCell colSpan={roleColumns.length} className="py-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-12 items-center justify-center rounded-lg bg-muted">
                  <ShieldUserIcon
                    aria-hidden
                    className="size-6 text-muted-foreground"
                  />
                </span>
                <p className="text-sm font-semibold">Chưa có vai trò nào.</p>
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
