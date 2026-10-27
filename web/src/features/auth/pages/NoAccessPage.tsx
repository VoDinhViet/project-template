import { useRouteContext } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useSignOut } from '../hooks/use-sign-out'

export function NoAccessPage() {
  const { currentUser } = useRouteContext({ from: '/(auth)/no-access' })
  const { mutate: signOut, isPending } = useSignOut()

  return (
    <div>
      <div className="mb-9">
        <p className="mb-3.5 text-2xs font-bold tracking-wider text-primary uppercase">
          Chưa có quyền truy cập
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Bạn chưa được mời vào hệ thống
        </h1>
        <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
          Tài khoản {currentUser.email} chưa có vai trò. Hãy nhờ quản trị viên
          gửi link mời tới đúng email này, hoặc đăng nhập bằng tài khoản khác.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => signOut()}
      >
        Đăng xuất và đổi tài khoản
      </Button>
    </div>
  )
}
