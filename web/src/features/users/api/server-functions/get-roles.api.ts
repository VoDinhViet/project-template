import { createServerFn } from '@tanstack/react-start'
import type { Role } from '@/lib/types/role.type'
import { http, logHttpError } from '@/server/http.server'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const getRoles = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Role[]> => {
    try {
      const response = await http.get<Role[]>('/api/roles')
      return response.data
    } catch (error) {
      logHttpError(error, 'getRoles')
      throw new Error(resolveUserErrorMessage(error))
    }
  },
)
