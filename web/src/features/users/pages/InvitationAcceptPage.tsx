import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockCircleIcon,
  DangerTriangleIcon,
  LetterIcon,
  ShieldUserIcon,
} from '@solar-icons/react/bold'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouteContext } from '@tanstack/react-router'
import { PageShell } from '@/components/shared/layouts/PageShell'
import { AppLogo } from '@/components/shared/primitives/AppLogo'
import { LinkButton } from '@/components/shared/primitives/LinkButton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSignOut } from '@/features/auth/api'
import { formatDate } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import { invitationQueryOptions } from '../api'
import { useAcceptInvitation } from '../hooks/use-accept-invitation'
import type { Invitation, InvitationStatus } from '../types/invitation.type'

const unusableStatusMessages: Partial<Record<InvitationStatus, string>> = {
  EXPIRED: 'Link mời đã hết hạn. Hãy nhờ người mời gửi link mới.',
  REVOKED: 'Lời mời đã bị thu hồi.',
  ACCEPTED: 'Lời mời này đã được sử dụng.',
}

export function InvitationAcceptPage() {
  const { token } = useParams({ from: '/(authed)/invitations/$token' })
  const { data: invitation, error } = useQuery(invitationQueryOptions(token))

  return (
    <PageShell title="Lời mời tham gia" bodyClassName="items-center">
      <div className="flex w-full max-w-md flex-col rounded-lg bg-card shadow-card">
        {error && (
          <div className="p-4 sm:p-5">
            <InvitationMessage
              message={error.message}
              linkLabel="Về trang chủ"
            />
          </div>
        )}
        {invitation && (
          <InvitationDetails token={token} invitation={invitation} />
        )}
      </div>
    </PageShell>
  )
}

type InvitationDetailsProps = {
  token: string
  invitation: Invitation
}

function InvitationDetails({ token, invitation }: InvitationDetailsProps) {
  const inviterName = invitation.invitedByName ?? 'Quản trị viên'
  // Người đã có vai trò giữ vai trò hiện có khi chấp nhận (xem `acceptInvitation` của `api`).
  const roleFields = invitation.hasAccess
    ? []
    : [
        {
          label: 'Vai trò của bạn',
          value: invitation.role.name,
          icon: ShieldUserIcon,
          tileClassName: 'bg-violet-soft text-violet-ink',
        },
      ]
  const invitationFields = [
    ...roleFields,
    {
      label: 'Email được mời',
      value: invitation.email,
      icon: LetterIcon,
      tileClassName: 'bg-info-soft text-info-ink',
    },
    {
      label: 'Hết hạn',
      value: formatDate(invitation.expiresAt),
      icon: ClockCircleIcon,
      tileClassName: 'bg-warning-soft text-warning-ink',
    },
  ]

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-t-lg bg-sidebar px-4 py-6 text-center sm:px-5">
        <AppLogo className="size-12 text-sidebar-accent-foreground" />
        <div className="flex flex-col gap-1">
          <p className="text-2xs font-bold tracking-wider text-sidebar-foreground uppercase">
            Smart Things
          </p>
          <h2 className="text-xl font-bold text-sidebar-accent-foreground">
            Bạn được mời tham gia
          </h2>
        </div>
        <p className="flex items-center gap-2 rounded-full bg-sidebar-accent py-1 pr-3 pl-1 text-sm text-sidebar-accent-foreground">
          <Avatar className="size-6">
            <AvatarFallback className="bg-violet-ink text-2xs font-bold text-card">
              {inviterName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>
            <strong>{inviterName}</strong> đã mời bạn
          </span>
        </p>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <ul className="flex flex-col gap-3">
          {invitationFields.map(
            ({ label, value, icon: Icon, tileClassName }) => (
              <li key={label} className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-md',
                    tileClassName,
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="truncate text-sm font-semibold">
                    {value}
                  </span>
                </div>
              </li>
            ),
          )}
        </ul>
        <InvitationAction token={token} invitation={invitation} />
      </div>
    </>
  )
}

function InvitationAction({ token, invitation }: InvitationDetailsProps) {
  const { currentUser } = useRouteContext({ from: '/(authed)' })
  const { mutate: acceptInvitation, isPending: isAccepting } =
    useAcceptInvitation()
  const { mutate: signOut, isPending: isSigningOut } = useSignOut(
    `/invitations/${token}`,
  )
  const unusableMessage = unusableStatusMessages[invitation.status]

  if (invitation.hasAccess) {
    return (
      <div className="flex flex-col gap-3 border-t pt-4">
        <p className="flex items-start gap-2 rounded-md bg-success-soft p-3 text-xs text-success-ink">
          <CheckCircleIcon className="mt-0.5 size-4 shrink-0" />
          Tài khoản {currentUser.email} đã có quyền vào hệ thống, không cần xác
          nhận lời mời này.
        </p>
        <LinkButton to="/" variant="outline">
          Vào trang chủ
        </LinkButton>
      </div>
    )
  }
  if (unusableMessage) {
    return (
      <InvitationMessage message={unusableMessage} linkLabel="Về trang chủ" />
    )
  }
  if (!invitation.isEmailMatched) {
    return (
      <div className="flex flex-col gap-3 border-t pt-4">
        <p className="flex items-start gap-2 rounded-md bg-warning-soft p-3 text-xs text-warning-ink">
          <DangerTriangleIcon className="mt-0.5 size-4 shrink-0" />
          Lời mời gửi cho {invitation.email}, nhưng bạn đang đăng nhập bằng{' '}
          {currentUser.email}. Hãy đăng xuất rồi đăng nhập đúng email được mời.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isSigningOut}
          onClick={() => signOut()}
        >
          Đăng xuất và đổi tài khoản
        </Button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <p className="flex items-center gap-2 text-xs text-success-ink">
        <CheckCircleIcon className="size-4 shrink-0" />
        Đang đăng nhập bằng {currentUser.email}, đúng email được mời.
      </p>
      <Button
        type="button"
        size="lg"
        disabled={isAccepting}
        onClick={() => acceptInvitation(token)}
      >
        Xác nhận tham gia
        <ArrowRightIcon data-icon="inline-end" className="size-4" />
      </Button>
    </div>
  )
}

type InvitationMessageProps = {
  message: string
  linkLabel?: string
}

function InvitationMessage({ message, linkLabel }: InvitationMessageProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-md bg-destructive-soft p-3 text-xs text-destructive-ink">
        {message}
      </p>
      {linkLabel && (
        <LinkButton to="/" variant="outline">
          {linkLabel}
        </LinkButton>
      )}
    </div>
  )
}
