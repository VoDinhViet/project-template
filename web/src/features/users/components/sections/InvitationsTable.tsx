import { LetterIcon } from '@solar-icons/react/bold'
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
import type { PendingInvitation } from '../../types/invitation.type'
import { invitationColumns } from '../composites/InvitationsTableColumns'

type InvitationsTableProps = {
  invitations: PendingInvitation[]
  isPending: boolean
}

export function InvitationsTable({
  invitations,
  isPending,
}: InvitationsTableProps) {
  const table = useTable({
    data: invitations,
    columns: invitationColumns,
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
        {invitations.length === 0 && (
          <TableRow>
            <TableCell colSpan={invitationColumns.length} className="py-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-12 items-center justify-center rounded-lg bg-muted">
                  <LetterIcon
                    aria-hidden
                    className="size-6 text-muted-foreground"
                  />
                </span>
                <p className="text-sm font-semibold">
                  Không có lời mời nào đang chờ.
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
