import { CrownMinimalisticIcon, ShieldUserIcon } from '@solar-icons/react/bold'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { rolesQueryOptions } from '../../api'

const ROLE_SKELETON_COUNT = 4

const roleIconClasses = [
  'text-info-ink',
  'text-success-ink',
  'text-warning-ink',
]

export function RoleBreakdown() {
  const { data: roles, error } = useQuery(rolesQueryOptions())

  return (
    <aside className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-2">
        <ShieldUserIcon aria-hidden className="size-6 text-violet-ink" />
        <h2 className="text-base font-semibold">Vai trò</h2>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
      {!roles && !error && (
        <div aria-hidden className="flex flex-col gap-2">
          {Array.from({ length: ROLE_SKELETON_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      )}
      {roles && (
        <ul className="flex flex-col gap-3">
          {roles.map((role, index) => {
            const RoleIcon = role.isSystem
              ? CrownMinimalisticIcon
              : ShieldUserIcon
            return (
              <li key={role.id} className="flex items-center gap-3">
                <RoleIcon
                  aria-hidden
                  className={cn(
                    'size-6 shrink-0',
                    role.isSystem
                      ? 'text-violet-ink'
                      : roleIconClasses[index % roleIconClasses.length],
                  )}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="truncate">{role.name}</span>
                    {role.isSystem && (
                      <Badge className="bg-violet-soft text-violet-ink">
                        Toàn quyền
                      </Badge>
                    )}
                  </span>
                  {role.description && (
                    <span className="line-clamp-1 text-xs text-foreground/70">
                      {role.description}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-base font-bold tabular-nums">
                  {role.userCount}
                  <span className="sr-only"> người dùng</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
