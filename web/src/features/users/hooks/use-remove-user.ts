import { useMutation } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { removeUser } from '../api/server-functions/remove-user.api'
import type { UserIdSchema } from '../schemas/user.schema'
import { useRefreshUserAccess } from './use-refresh-user-access'

export function useRemoveUser() {
  const refreshUserAccess = useRefreshUserAccess()
  const removeUserFn = useServerFn(removeUser)

  return useMutation({
    mutationFn: (value: UserIdSchema) => removeUserFn({ data: value }),
    onSuccess: async () => {
      await refreshUserAccess()
      toast.success('Đã gỡ thành viên.')
    },
    onError: (error) => toast.error(error.message),
  })
}
