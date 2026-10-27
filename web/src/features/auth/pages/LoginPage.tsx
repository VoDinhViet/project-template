import { Link, useSearch } from '@tanstack/react-router'
import { FieldGroup, FieldSeparator } from '@/components/ui/field'
import { resolveInternalRedirect } from '@/lib/resolve-internal-redirect'
import { GoogleSignInButton } from '../components/composites/GoogleSignInButton'
import { PasswordSignInForm } from '../components/composites/PasswordSignInForm'

const INVITATION_PATH_PATTERN = /^\/invitations\/([\w-]+)$/

export function LoginPage() {
  const { redirect } = useSearch({ from: '/(auth)/login' })
  const redirectTo = resolveInternalRedirect(redirect)
  // Người đi từ link mời mà chưa có tài khoản thì được tạo tài khoản bằng email được mời.
  const invitationToken = INVITATION_PATH_PATTERN.exec(redirectTo)?.[1]

  return (
    <div>
      <div className="mb-9">
        <p className="mb-3.5 text-2xs font-bold tracking-wider text-primary uppercase">
          Cổng xác thực
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Chào mừng trở lại
        </h1>
        <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
          Đăng nhập bằng email hoặc tài khoản Google để truy cập hệ thống quản
          lý dự án.
        </p>
      </div>
      <FieldGroup>
        <PasswordSignInForm redirectTo={redirectTo} />
        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
          hoặc
        </FieldSeparator>
        <GoogleSignInButton redirectTo={redirectTo} />
      </FieldGroup>
      {invitationToken && (
        <p className="mt-6 text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link
            to="/register/$token"
            params={{ token: invitationToken }}
            className="font-medium text-primary hover:underline"
          >
            Tạo tài khoản bằng email được mời
          </Link>
        </p>
      )}
    </div>
  )
}
