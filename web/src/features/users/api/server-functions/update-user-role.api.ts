import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { updateUserRoleSchema } from '../../schemas/user.schema'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const updateUserRole = createServerFn({ method: 'POST' })
  .validator(updateUserRoleSchema)
  .handler(async ({ data }): Promise<void> => {
    try {
      await http.patch(`/api/users/${data.userId}`, { roleId: data.roleId })
    } catch (error) {
      logHttpError(error, 'updateUserRole')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
