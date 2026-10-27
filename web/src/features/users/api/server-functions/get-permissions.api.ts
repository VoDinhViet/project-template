import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import type { PermissionInfo } from '../../types/permission.type'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const getPermissions = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PermissionInfo[]> => {
    try {
      const response = await http.get<PermissionInfo[]>('/api/permissions')
      return response.data
    } catch (error) {
      logHttpError(error, 'getPermissions')
      throw new Error(resolveUserErrorMessage(error))
    }
  },
)
