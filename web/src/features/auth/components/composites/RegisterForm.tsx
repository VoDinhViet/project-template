import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  MIN_PASSWORD_LENGTH,
  registerSchema,
} from '../../schemas/register.schema'
import type { RegisterSchema } from '../../schemas/register.schema'
import { resolveAuthErrorMessage } from '../../utils/resolve-auth-error-message'

type RegisterFormProps = {
  token: string
  email: string
  onRegistered: () => void
}

const defaultValues: RegisterSchema = {
  displayName: '',
  password: '',
}

export function RegisterForm({
  token,
  email,
  onRegistered,
}: RegisterFormProps) {
  const { mutate: register, isPending } = useMutation({
    mutationFn: async (value: RegisterSchema): Promise<void> => {
      const { displayName, password } = registerSchema.parse(value)
      // Firebase SDK chỉ chạy ở trình duyệt nên nạp động, tránh kéo vào bundle SSR.
      const { registerWithPassword } = await import('@/lib/firebase')
      await registerWithPassword({
        email,
        password,
        displayName,
        continueUrl: `${window.location.origin}/login?redirect=${encodeURIComponent(`/invitations/${token}`)}`,
      })
    },
    onSuccess: onRegistered,
    onError: (error) => toast.error(resolveAuthErrorMessage(error)),
  })

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: registerSchema },
    onSubmit: ({ value }) => register(value),
  })

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
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            className="h-12"
            value={email}
            readOnly
            disabled
          />
        </Field>
        <form.Field name="displayName">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Họ và tên</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="name"
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
        <form.Field name="password">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Mật khẩu</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="new-password"
                  className="h-12"
                  value={field.state.value}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldDescription>
                  Ít nhất {MIN_PASSWORD_LENGTH} ký tự.
                </FieldDescription>
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
        {isPending ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
      </Button>
    </form>
  )
}
