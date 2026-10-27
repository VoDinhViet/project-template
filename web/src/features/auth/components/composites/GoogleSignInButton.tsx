import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useSignInWithGoogle } from '../../hooks/use-sign-in-with-google'
import { GoogleLogo } from '../primitives/GoogleLogo'

type GoogleSignInButtonProps = {
  redirectTo: string
}

/**
 * Nút theo hướng dẫn thương hiệu "Sign in with Google".
 *
 * Rules:
 * - Logo "G" bốn màu đứng bên trái chữ, không đổi màu; nền, viền, chữ dùng token `google-button-*`.
 * - Chữ dùng đúng bản dịch của Google: "Đăng nhập bằng Google".
 */
export function GoogleSignInButton({ redirectTo }: GoogleSignInButtonProps) {
  const { mutate: signIn, isPending } = useSignInWithGoogle(redirectTo)

  return (
    <Button
      type="button"
      size="lg"
      className="h-12 w-full gap-3 rounded-md border-google-button-border bg-google-button text-base font-medium text-google-button-foreground hover:bg-[color-mix(in_oklch,var(--google-button),var(--google-button-foreground)_8%)]"
      disabled={isPending}
      aria-busy={isPending}
      onClick={() => signIn()}
    >
      {isPending ? (
        <Spinner className="size-5" aria-hidden="true" />
      ) : (
        <GoogleLogo className="size-5" />
      )}
      {isPending ? 'Đang đăng nhập…' : 'Đăng nhập bằng Google'}
    </Button>
  )
}
