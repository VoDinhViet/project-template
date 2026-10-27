import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { createRoleSchema } from '../../schemas/role.schema'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const createRole = createServerFn({ method: 'POST' })
  .validator(createRoleSchema)
  .handler(async ({ data }): Promise<void> => {
    try {
      await http.post('/api/roles', data)
    } catch (error) {
      logHttpError(error, 'createRole')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
