import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { LinkButton } from '@/components/shared/primitives/LinkButton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { forgotPasswordSchema } from '../../schemas/forgot-password.schema'
import type { ForgotPasswordSchema } from '../../schemas/forgot-password.schema'
import {
  isUserNotFound,
  resolveAuthErrorMessage,
} from '../../utils/resolve-auth-error-message'

const defaultValues: ForgotPasswordSchema = {
  email: '',
}

export function ForgotPasswordForm() {
  const [isSent, setIsSent] = useState(false)
  const { mutate: sendResetPasswordEmail, isPending } = useMutation({
    mutationFn: async (value: ForgotPasswordSchema): Promise<void> => {
      const { email } = forgotPasswordSchema.parse(value)
      // Firebase SDK chỉ chạy ở trình duyệt nên nạp động, tránh kéo vào bundle SSR.
      const firebase = await import('@/lib/firebase')
      try {
        await firebase.sendResetPasswordEmail(
          email,
          `${window.location.origin}/login`,
        )
      } catch (error) {
        // Không để lộ email nào đã có tài khoản.
        if (!isUserNotFound(error)) {
          throw error
        }
      }
    },
    onSuccess: () => setIsSent(true),
    onError: (error) => toast.error(resolveAuthErrorMessage(error)),
  })

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: forgotPasswordSchema },
    onSubmit: ({ value }) => sendResetPasswordEmail(value),
  })

  if (isSent) {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <AlertTitle>Hãy kiểm tra hộp thư</AlertTitle>
          <AlertDescription>
            Nếu email có tài khoản, bạn sẽ nhận được email đặt lại mật khẩu
            trong ít phút. Nhớ xem cả mục thư rác.
          </AlertDescription>
        </Alert>
        <LinkButton to="/login" variant="outline" size="lg" className="h-12">
          Quay lại đăng nhập
        </LinkButton>
      </div>
    )
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (form.state.isSubmitting || isPending) {
          return
        }
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field name="email">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="username"
                  className="h-12"
                  placeholder="ten@example.com"
                  value={field.state.value}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>
      </FieldGroup>
      <Button
        type="submit"
        size="lg"
        className="h-12 w-full text-base"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending && <Spinner className="size-5" aria-hidden="true" />}
        {isPending ? 'Đang gửi…' : 'Gửi email đặt lại mật khẩu'}
      </Button>
      <LinkButton to="/login" variant="ghost" size="lg" className="h-12">
        Quay lại đăng nhập
      </LinkButton>
    </form>
  )
}
