import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { updateRoleSchema } from '../../schemas/role.schema'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const updateRole = createServerFn({ method: 'POST' })
  .validator(updateRoleSchema)
  .handler(async ({ data: { roleId, ...roleChanges } }): Promise<void> => {
    try {
      await http.patch(`/api/roles/${roleId}`, roleChanges)
    } catch (error) {
      logHttpError(error, 'updateRole')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
