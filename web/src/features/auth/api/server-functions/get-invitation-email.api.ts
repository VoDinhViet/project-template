import { createServerFn } from '@tanstack/react-start'
import axios from 'axios'
import { GENERIC_ERROR_MESSAGE } from '@/lib/error-messages'
import { http, logHttpError } from '@/server/http.server'
import type { ApiErrorResponse } from '@/server/http.server'
import { invitationEmailTokenSchema } from '../../schemas/invitation-email.schema'
import type { InvitationEmail } from '../../types/invitation-email.type'

function resolveInvitationEmailErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return GENERIC_ERROR_MESSAGE
  }

  switch (error.response?.data.errorCode) {
    case 'invitation.error.not_found':
      return 'Link mời không hợp lệ.'
    case 'common.error.too_many_requests':
      return 'Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.'
    default:
      return GENERIC_ERROR_MESSAGE
  }
}

export const getInvitationEmail = createServerFn({ method: 'GET' })
  .validator(invitationEmailTokenSchema)
  .handler(async ({ data }): Promise<InvitationEmail> => {
    try {
      const response = await http.get<InvitationEmail>(
        `/api/invitations/${encodeURIComponent(data.token)}/email`,
      )
      return response.data
    } catch (error) {
      logHttpError(error, 'getInvitationEmail')
      throw new Error(resolveInvitationEmailErrorMessage(error))
    }
  })
