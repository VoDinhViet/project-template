import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { signOutAllDevices } from '../api/server-functions/sign-out-all-devices.api'
import { signOut } from '../api/server-functions/sign-out.api'
import { resolveAuthErrorMessage } from '../utils/resolve-auth-error-message'

type SignOutVariables = { isAllDevices: boolean } | void

/** `redirectTo` để đăng nhập lại xong quay về đúng trang, ví dụ link mời khi sai tài khoản. */
export function useSignOut(redirectTo?: string) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const signOutFn = useServerFn(signOut)
  const signOutAllDevicesFn = useServerFn(signOutAllDevices)

  return useMutation({
    mutationFn: (variables: SignOutVariables) =>
      variables?.isAllDevices ? signOutAllDevicesFn() : signOutFn(),
    // Cả hai server function luôn xoá cookie (kể cả khi lỗi), nên luôn phải làm mới trạng thái
    // đăng nhập.
    onSettled: async () => {
      queryClient.clear()
      await router.invalidate()
    },
    onSuccess: async () => {
      await router.navigate({ to: '/login', search: { redirect: redirectTo } })
    },
    onError: (error) => {
      toast.error(resolveAuthErrorMessage(error))
    },
  })
}
