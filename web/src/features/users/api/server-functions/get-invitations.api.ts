import { createServerFn } from '@tanstack/react-start'
import { DEFAULT_PAGE_LIMIT } from '@/lib/constants'
import type { OffsetPaginated } from '@/lib/types/pagination.type'
import { http, logHttpError } from '@/server/http.server'
import { invitationsQuerySchema } from '../../schemas/users-search.schema'
import type { PendingInvitation } from '../../types/invitation.type'
import { resolveUserErrorMessage } from './resolve-user-error-message.server'

export const getInvitations = createServerFn({ method: 'GET' })
  .validator(invitationsQuerySchema)
  .handler(async ({ data }): Promise<OffsetPaginated<PendingInvitation>> => {
    try {
      const response = await http.get<OffsetPaginated<PendingInvitation>>(
        '/api/invitations',
        {
          params: {
            page: data.page,
            limit: DEFAULT_PAGE_LIMIT,
            q: data.q || undefined,
          },
        },
      )
      return response.data
    } catch (error) {
      logHttpError(error, 'getInvitations')
      throw new Error(resolveUserErrorMessage(error))
    }
  })
