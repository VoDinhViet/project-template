import { UserRoundedIcon } from '@solar-icons/react/linear'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/get-initials'

type User = {
  displayName: string
  avatarUrl: string | null
}

type UserAvatarProps = {
  /** `null` hoặc `undefined` là chưa có ai, hiện vòng nét đứt. */
  user: User | null | undefined
  size?: 'sm' | 'default' | 'lg'
  emptyLabel?: string
}

export function UserAvatar({
  user,
  size = 'default',
  emptyLabel = 'Chưa giao',
}: UserAvatarProps) {
  if (!user) {
    return (
      <Avatar size={size} title={emptyLabel}>
        <AvatarFallback className="border border-dashed border-muted-foreground/50 bg-transparent">
          <UserRoundedIcon className="size-3.5" aria-hidden />
          <span className="sr-only">{emptyLabel}</span>
        </AvatarFallback>
      </Avatar>
    )
  }
  return (
    <Avatar size={size} title={user.displayName}>
      {user.avatarUrl && (
        <AvatarImage src={user.avatarUrl} alt={user.displayName} />
      )}
      <AvatarFallback className="bg-violet-soft font-semibold text-violet-ink">
        {getInitials(user.displayName)}
      </AvatarFallback>
    </Avatar>
  )
}
