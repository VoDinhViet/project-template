import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { userIdSchema } from '../../schemas/user.schema'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const removeUser = createServerFn({ method: 'POST' })
  .validator(userIdSchema)
  .handler(async ({ data }): Promise<void> => {
    try {
      await http.delete(`/api/users/${data.userId}`)
    } catch (error) {
      logHttpError(error, 'removeUser')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
