import { createServerFn } from '@tanstack/react-start'
import axios from 'axios'
import { GENERIC_ERROR_MESSAGE } from '@/lib/error-messages'
import { http, logHttpError } from '@/server/http.server'
import type { ApiErrorResponse } from '@/server/http.server'
import { writeSession } from '@/server/session.server'
import { createSessionSchema } from '../../schemas/create-session.schema'
import type { Session } from '../../types/session.type'

function resolveCreateSessionErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return GENERIC_ERROR_MESSAGE
  }

  switch (error.response?.data.errorCode) {
    case 'common.error.too_many_requests':
      return 'Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.'
    case 'auth.error.unauthenticated':
      return 'Phiên đăng nhập không hợp lệ. Vui lòng thử lại.'
    case 'auth.error.account_disabled':
      return 'Tài khoản này đã bị vô hiệu hoá.'
    case 'auth.error.email_not_verified':
      return 'Email chưa được xác minh. Hãy mở email xác minh đã gửi cho bạn.'
    case 'auth.error.provider_not_allowed':
      return 'Chỉ hỗ trợ đăng nhập bằng Google hoặc email/mật khẩu.'
    case 'auth.error.email_in_use':
      return 'Email này đã gắn với một tài khoản khác.'
    default:
      return GENERIC_ERROR_MESSAGE
  }
}

export const createSession = createServerFn({ method: 'POST' })
  .validator(createSessionSchema)
  .handler(async ({ data }): Promise<void> => {
    try {
      const response = await http.post<Session>('/api/auth/session', {
        idToken: data.idToken,
      })
      await writeSession({
        ...response.data,
        refreshToken: data.refreshToken,
      })
    } catch (error) {
      logHttpError(error, 'createSession')
      throw new Error(resolveCreateSessionErrorMessage(error))
    }
  })
