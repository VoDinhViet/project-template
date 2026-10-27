import { LetterIcon } from '@solar-icons/react/bold'
import { createColumnHelper } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format-date'
import type { appTableFeatures } from '@/lib/table-features'
import type { PendingInvitation } from '../../types/invitation.type'
import { InvitationActions } from './InvitationActions'

const MS_PER_DAY = 24 * 60 * 60 * 1000
// Còn từ chừng này ngày trở xuống thì nhắc người mời gửi lại link.
const EXPIRING_SOON_DAYS = 2

const invitationColumnHelper = createColumnHelper<
  typeof appTableFeatures,
  PendingInvitation
>()

export const invitationColumns = invitationColumnHelper.columns([
  invitationColumnHelper.accessor('email', {
    header: 'Email',
    cell: ({ getValue }) => (
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <LetterIcon aria-hidden className="size-4.5 text-muted-foreground" />
        </span>
        <span className="truncate font-semibold">{getValue()}</span>
      </div>
    ),
  }),
  invitationColumnHelper.accessor('role', {
    header: 'Vai trò',
    cell: ({ getValue }) => (
      <Badge className="bg-neutral-soft text-neutral-ink">
        {getValue().name}
      </Badge>
    ),
  }),
  invitationColumnHelper.accessor('invitedByName', {
    header: 'Người mời',
    meta: { cellClassName: 'text-muted-foreground' },
    cell: ({ getValue }) => getValue() ?? '—',
  }),
  invitationColumnHelper.accessor('createdAt', {
    header: 'Ngày gửi',
    meta: { cellClassName: 'text-muted-foreground tabular-nums' },
    cell: ({ getValue }) => formatDate(getValue()),
  }),
  invitationColumnHelper.accessor('expiresAt', {
    header: 'Hạn',
    cell: ({ getValue }) => {
      const daysLeft = Math.ceil(
        (new Date(getValue()).getTime() - Date.now()) / MS_PER_DAY,
      )
      if (daysLeft <= 0) {
        return (
          <Badge className="bg-destructive-soft text-destructive-ink">
            Đã hết hạn
          </Badge>
        )
      }
      return (
        <Badge
          className={
            daysLeft <= EXPIRING_SOON_DAYS
              ? 'bg-warning-soft text-warning-ink'
              : 'bg-muted text-muted-foreground'
          }
        >
          Còn {daysLeft} ngày
        </Badge>
      )
    },
  }),
  invitationColumnHelper.display({
    id: 'actions',
    header: '',
    meta: { headerClassName: 'w-12', cellClassName: 'text-right' },
    cell: ({ row }) => <InvitationActions invitation={row.original} />,
  }),
])
