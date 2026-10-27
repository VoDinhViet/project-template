import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { acceptInvitation } from '../api/server-functions/accept-invitation.api'

export function useAcceptInvitation() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const acceptInvitationFn = useServerFn(acceptInvitation)

  return useMutation({
    mutationFn: (token: string) => acceptInvitationFn({ data: { token } }),
    onSuccess: async () => {
      // Vai trò vừa nhận nằm trong người dùng hiện tại; guard `(authed)` đọc lại khi chuyển trang.
      await queryClient.invalidateQueries()
      toast.success('Đã tham gia hệ thống.')
      await router.navigate({ to: '/' })
    },
    onError: (error) => toast.error(error.message),
  })
}
