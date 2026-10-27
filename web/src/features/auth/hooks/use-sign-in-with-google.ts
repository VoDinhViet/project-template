import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { createSession } from '../api/server-functions/create-session.api'
import {
  isPopupDismissed,
  resolveAuthErrorMessage,
} from '../utils/resolve-auth-error-message'

export function useSignInWithGoogle(redirectTo: string) {
  const createSessionFn = useServerFn(createSession)
  const queryClient = useQueryClient()
  const router = useRouter()

  // Nạp sẵn Firebase SDK khi trang mở: đợi tới lúc bấm mới tải thì trình duyệt có thể coi popup
  // không còn do người dùng mở và chặn. Lỗi tải ở đây bỏ qua vì lúc bấm sẽ nạp lại và báo lỗi thật.
  useEffect(() => {
    import('@/lib/firebase').catch(() => undefined)
  }, [])

  return useMutation({
    mutationFn: async (): Promise<void> => {
      // Firebase SDK chỉ chạy ở trình duyệt nên nạp động, tránh kéo vào bundle SSR.
      const { signInWithGoogle } = await import('@/lib/firebase')
      const firebaseTokens = await signInWithGoogle()
      await createSessionFn({ data: firebaseTokens })
    },
    onSuccess: async () => {
      queryClient.clear()
      await router.navigate({ href: redirectTo })
    },
    onError: (error) => {
      // Người dùng tự đóng popup thì không phải lỗi.
      if (isPopupDismissed(error)) {
        return
      }
      toast.error(resolveAuthErrorMessage(error))
    },
  })
}
