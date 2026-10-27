import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
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
import { createSession } from '../../api/server-functions/create-session.api'
import { signInSchema } from '../../schemas/sign-in.schema'
import type { SignInSchema } from '../../schemas/sign-in.schema'
import {
  isEmailNotVerified,
  resolveAuthErrorMessage,
} from '../../utils/resolve-auth-error-message'

type PasswordSignInFormProps = {
  redirectTo: string
}

const defaultValues: SignInSchema = {
  email: '',
  password: '',
}

export function PasswordSignInForm({ redirectTo }: PasswordSignInFormProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const createSessionFn = useServerFn(createSession)
  const {
    mutate: signIn,
    isPending: isSigningIn,
    error: signInError,
    variables: signInValues,
  } = useMutation({
    mutationFn: async (value: SignInSchema): Promise<void> => {
      const { email, password } = signInSchema.parse(value)
      // Firebase SDK chỉ chạy ở trình duyệt nên nạp động, tránh kéo vào bundle SSR.
      const { signInWithPassword } = await import('@/lib/firebase')
      const firebaseTokens = await signInWithPassword(email, password)
      await createSessionFn({ data: firebaseTokens })
    },
    onSuccess: async () => {
      queryClient.clear()
      await router.navigate({ href: redirectTo })
    },
    // Chưa xác minh email thì báo ngay trong form kèm nút gửi lại, không dùng toast.
    onError: (error) => {
      if (!isEmailNotVerified(error)) {
        toast.error(resolveAuthErrorMessage(error))
      }
    },
  })
  const { mutate: resendVerification, isPending: isResending } = useMutation({
    mutationFn: async (value: SignInSchema): Promise<void> => {
      const { email, password } = signInSchema.parse(value)
      const { resendVerificationEmail } = await import('@/lib/firebase')
      await resendVerificationEmail(
        email,
        password,
        `${window.location.origin}/login?redirect=${encodeURIComponent(redirectTo)}`,
      )
    },
    onSuccess: () =>
      toast.success('Đã gửi lại email xác minh. Hãy kiểm tra hộp thư.'),
    onError: (error) => toast.error(resolveAuthErrorMessage(error)),
  })

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: signInSchema },
    onSubmit: ({ value }) => signIn(value),
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (form.state.isSubmitting || isSigningIn) {
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
        <form.Field name="password">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0
            return (
              <Field data-invalid={isInvalid}>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor={field.name}>Mật khẩu</FieldLabel>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="current-password"
                  className="h-12"
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
      {isEmailNotVerified(signInError) && (
        <Alert>
          <AlertTitle>Email chưa được xác minh</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2">
            Hãy mở email xác minh Firebase đã gửi khi bạn tạo tài khoản, rồi
            đăng nhập lại.
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isResending || !signInValues}
              onClick={() => signInValues && resendVerification(signInValues)}
            >
              {isResending && <Spinner aria-hidden="true" />}
              Gửi lại email xác minh
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Button
        type="submit"
        size="lg"
        className="h-12 w-full text-base"
        disabled={isSigningIn}
        aria-busy={isSigningIn}
      >
        {isSigningIn && <Spinner className="size-5" aria-hidden="true" />}
        {isSigningIn ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </Button>
    </form>
  )
}
