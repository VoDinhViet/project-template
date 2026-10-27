import { useHasPermission } from '@/hooks/use-has-permission'
import {
  ClockCircleIcon,
  LetterIcon,
  ShieldUserIcon,
  UsersGroupRoundedIcon,
} from '@solar-icons/react/bold'
import type { Icon } from '@solar-icons/react/lib/types'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import {
  invitationsQueryOptions,
  rolesQueryOptions,
  usersQueryOptions,
} from '../../api'

const numberFormatter = new Intl.NumberFormat('vi-VN')
const MS_PER_DAY = 24 * 60 * 60 * 1000
// Cùng ngưỡng với badge hạn trong `InvitationsTable`.
const EXPIRING_SOON_DAYS = 2

type UserStatCard = {
  label: string
  value: number | undefined
  unit: string
  hint: string
  icon: Icon
  iconClassName: string
}

type UserStatCardsProps = {
  canInvite: boolean
}

/** Số chưa tải xong hiện "–" để thẻ giữ nguyên kích thước, không nhảy bố cục. */
export function UserStatCards({ canInvite }: UserStatCardsProps) {
  // Danh sách chưa lọc trùng query key với tab đang mở khi không lọc, nên không gọi thừa.
  const { data: users } = useQuery(usersQueryOptions({}))
  const { data: invitations } = useQuery({
    ...invitationsQueryOptions({}),
    enabled: canInvite,
  })
  const canReadRoles = useHasPermission('roles:read')
  const { data: roles } = useQuery({
    ...rolesQueryOptions(),
    enabled: canReadRoles,
  })
  // Chỉ đếm trên trang lời mời đầu tiên; đủ dùng vì lời mời đang chờ thường ít hơn một trang.
  const expiringInvitationCount = invitations?.data.filter((invitation) => {
    const msLeft = Date.parse(invitation.expiresAt) - Date.now()
    return msLeft > 0 && msLeft <= EXPIRING_SOON_DAYS * MS_PER_DAY
  }).length
  const userStatCards: UserStatCard[] = [
    {
      label: 'Người dùng',
      value: users?.pagination.totalRecords,
      unit: 'người',
      hint: 'Không tính tài khoản quản trị hệ thống',
      icon: UsersGroupRoundedIcon,
      iconClassName: 'bg-violet-soft text-violet-ink',
    },
    ...(canInvite
      ? [
          {
            label: 'Lời mời đang chờ',
            value: invitations?.pagination.totalRecords,
            unit: 'lời mời',
            hint: 'Link mời có hạn 7 ngày',
            icon: LetterIcon,
            iconClassName: 'bg-info-soft text-info-ink',
          },
          {
            label: 'Sắp hết hạn',
            value: expiringInvitationCount,
            unit: 'lời mời',
            hint: 'Còn từ 2 ngày trở xuống, nên gửi lại',
            icon: ClockCircleIcon,
            iconClassName: 'bg-warning-soft text-warning-ink',
          },
        ]
      : []),
    {
      label: 'Vai trò',
      value: roles?.length,
      unit: 'vai trò',
      hint: 'Quyền gán theo vai trò toàn hệ thống',
      icon: ShieldUserIcon,
      iconClassName: 'bg-success-soft text-success-ink',
    },
  ]

  return (
    <section
      aria-label="Thống kê người dùng"
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2',
        canInvite ? 'xl:grid-cols-4' : 'xl:grid-cols-2',
      )}
    >
      {userStatCards.map((userStatCard) => (
        <div
          key={userStatCard.label}
          className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-card"
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                userStatCard.iconClassName,
              )}
            >
              <userStatCard.icon aria-hidden className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">
                {userStatCard.label}
              </p>
              <p className="flex items-baseline gap-1.5">
                <span className="text-2xl leading-tight font-semibold tabular-nums">
                  {userStatCard.value === undefined
                    ? '–'
                    : numberFormatter.format(userStatCard.value)}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {userStatCard.unit}
                </span>
              </p>
            </div>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {userStatCard.hint}
          </p>
        </div>
      ))}
    </section>
  )
}
