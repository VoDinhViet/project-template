import { useRouteContext } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format-date'
import type { appTableFeatures } from '@/lib/table-features'
import type { User } from '../../types/user.type'
import { UserActions } from './UserActions'

const userColumnHelper = createColumnHelper<typeof appTableFeatures, User>()

export const userColumns = userColumnHelper.columns([
  userColumnHelper.display({
    id: 'user',
    header: 'Người dùng',
    cell: ({ row: { original: user } }) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          {user.avatarUrl && (
            <AvatarImage
              src={user.avatarUrl}
              alt=""
              // Ảnh Google từ chối request có `Referer` lạ.
              referrerPolicy="no-referrer"
            />
          )}
          <AvatarFallback className="bg-violet-ink text-xs font-bold text-card">
            {user.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="truncate">{user.displayName}</span>
            <CurrentUserBadge userId={user.id} />
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </div>
      </div>
    ),
  }),
  userColumnHelper.accessor('role', {
    header: 'Vai trò',
    cell: ({ getValue }) => {
      const role = getValue()
      return (
        <Badge
          className={
            role.isSystem
              ? 'bg-violet-soft text-violet-ink'
              : 'bg-secondary font-semibold text-foreground'
          }
        >
          {role.name}
        </Badge>
      )
    },
  }),
  userColumnHelper.accessor('createdAt', {
    header: 'Tham gia',
    meta: { cellClassName: 'text-foreground/80 tabular-nums' },
    cell: ({ getValue }) => formatDate(getValue()),
  }),
  userColumnHelper.display({
    id: 'actions',
    header: '',
    meta: { headerClassName: 'w-12', cellClassName: 'text-right' },
    cell: ({ row }) => <UserActions user={row.original} />,
  }),
])

type CurrentUserBadgeProps = {
  userId: string
}

/** Cột là hằng cấp module nên ô tự đọc người dùng hiện tại từ context thay vì nhận qua props. */
function CurrentUserBadge({ userId }: CurrentUserBadgeProps) {
  const { currentUser } = useRouteContext({ from: '/(authed)' })
  if (userId !== currentUser.id) {
    return null
  }
  return <Badge className="bg-info-soft text-info-ink">Bạn</Badge>
}
