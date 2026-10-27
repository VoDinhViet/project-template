import { useMutation } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { updateUserRole } from '../api/server-functions/update-user-role.api'
import type { UpdateUserRoleSchema } from '../schemas/user.schema'
import { useRefreshUserAccess } from './use-refresh-user-access'

export function useUpdateUserRole() {
  const refreshUserAccess = useRefreshUserAccess()
  const updateUserRoleFn = useServerFn(updateUserRole)

  return useMutation({
    mutationFn: (value: UpdateUserRoleSchema) =>
      updateUserRoleFn({ data: value }),
    onSuccess: async () => {
      await refreshUserAccess()
      toast.success('Đã đổi vai trò.')
    },
    onError: (error) => toast.error(error.message),
  })
}
