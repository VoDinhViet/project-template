import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { LinkButton } from '@/components/shared/primitives/LinkButton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FieldSeparator } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { invitationEmailQueryOptions } from '../api'
import { GoogleSignInButton } from '../components/composites/GoogleSignInButton'
import { RegisterForm } from '../components/composites/RegisterForm'
import type { InvitationEmailStatus } from '../types/invitation-email.type'

const unusableStatusMessages: Partial<Record<InvitationEmailStatus, string>> = {
  EXPIRED: 'Link mời đã hết hạn. Hãy nhờ người mời gửi link mới.',
  REVOKED: 'Lời mời đã bị thu hồi.',
  ACCEPTED: 'Lời mời này đã được sử dụng.',
}

export function RegisterPage() {
  const { token } = useParams({ from: '/(auth)/register/$token' })
  const { data: invitationEmail, error } = useQuery(
    invitationEmailQueryOptions(token),
  )
  const [isRegistered, setIsRegistered] = useState(false)
  const invitationPath = `/invitations/${token}`
  const unusableMessage = invitationEmail
    ? unusableStatusMessages[invitationEmail.status]
    : undefined

  return (
    <div>
      <div className="mb-9">
        <p className="mb-3.5 text-2xs font-bold tracking-wider text-primary uppercase">
          Lời mời tham gia
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Tạo tài khoản
        </h1>
        <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
          Tạo mật khẩu để đăng nhập bằng email được mời, hoặc dùng tài khoản
          Google có cùng email.
        </p>
      </div>
      {!invitationEmail && !error && <Skeleton className="h-64 w-full" />}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Không mở được lời mời</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {unusableMessage && (
        <Alert variant="destructive">
          <AlertTitle>Không đăng ký được</AlertTitle>
          <AlertDescription>{unusableMessage}</AlertDescription>
        </Alert>
      )}
      {invitationEmail?.email && isRegistered && (
        <div className="flex flex-col gap-4">
          <Alert>
            <AlertTitle>Hãy kiểm tra hộp thư</AlertTitle>
            <AlertDescription>
              Chúng tôi đã gửi email xác minh tới {invitationEmail.email}. Bấm
              link trong email rồi đăng nhập để nhận lời mời.
            </AlertDescription>
          </Alert>
          <LinkButton
            to="/login"
            search={{ redirect: invitationPath }}
            size="lg"
            className="h-12"
          >
            Đến trang đăng nhập
          </LinkButton>
        </div>
      )}
      {invitationEmail?.email && !isRegistered && (
        <div className="flex flex-col gap-6">
          <RegisterForm
            token={token}
            email={invitationEmail.email}
            onRegistered={() => setIsRegistered(true)}
          />
          <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
            hoặc
          </FieldSeparator>
          <GoogleSignInButton redirectTo={invitationPath} />
        </div>
      )}
    </div>
  )
}
