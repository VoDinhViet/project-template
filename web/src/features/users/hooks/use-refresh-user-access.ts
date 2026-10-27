import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

/**
 * Đổi hay gỡ vai trò có thể rơi vào chính mình, nên phải đọc lại cả người dùng hiện tại.
 *
 * Rules:
 * - Quyền trên trang lấy từ context của `(authed)`, chỉ đổi khi `router.invalidate()` chạy lại guard.
 * - Tự gỡ mình thì guard chuyển sang `/no-access`.
 */
export function useRefreshUserAccess() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return async () => {
    await queryClient.invalidateQueries({ queryKey: ['users'] })
    await queryClient.invalidateQueries({ queryKey: ['roles'] })
    await queryClient.invalidateQueries({ queryKey: ['auth', 'current-user'] })
    await router.invalidate()
  }
}
