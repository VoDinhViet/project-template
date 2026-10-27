import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { roleIdSchema } from '../../schemas/role.schema'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const deleteRole = createServerFn({ method: 'POST' })
  .validator(roleIdSchema)
  .handler(async ({ data }): Promise<void> => {
    try {
      await http.delete(`/api/roles/${data.roleId}`)
    } catch (error) {
      logHttpError(error, 'deleteRole')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
