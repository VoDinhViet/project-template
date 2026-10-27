import { createServerFn } from '@tanstack/react-start'
import { DEFAULT_PAGE_LIMIT } from '@/lib/constants'
import type { OffsetPaginated } from '@/lib/types/pagination.type'
import { http, logHttpError } from '@/server/http.server'
import { usersQuerySchema } from '../../schemas/users-search.schema'
import type { User } from '../../types/user.type'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const getUsers = createServerFn({ method: 'GET' })
  .validator(usersQuerySchema)
  .handler(async ({ data }): Promise<OffsetPaginated<User>> => {
    try {
      const response = await http.get<OffsetPaginated<User>>('/api/users', {
        params: {
          page: data.page,
          limit: data.limit ?? DEFAULT_PAGE_LIMIT,
          q: data.q || undefined,
          roleId: data.roleId,
        },
      })
      return response.data
    } catch (error) {
      logHttpError(error, 'getUsers')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
