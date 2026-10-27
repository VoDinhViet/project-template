import { ForgotPasswordForm } from '../components/composites/ForgotPasswordForm'

export function ForgotPasswordPage() {
  return (
    <div>
      <div className="mb-9">
        <p className="mb-3.5 text-2xs font-bold tracking-wider text-primary uppercase">
          Cổng xác thực
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Quên mật khẩu
        </h1>
        <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
          Nhập email đăng nhập, chúng tôi sẽ gửi link để bạn đặt mật khẩu mới.
          Tài khoản chỉ đăng nhập bằng Google thì không cần mật khẩu.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  )
}
