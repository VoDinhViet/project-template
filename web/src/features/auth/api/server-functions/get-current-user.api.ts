import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import axios from 'axios'
import { GENERIC_ERROR_MESSAGE } from '@/lib/error-messages'
import {
  SESSION_REJECTED_ERROR_CODES,
  http,
  logHttpError,
} from '@/server/http.server'
import type { ApiErrorResponse } from '@/server/http.server'
import { readSession } from '@/server/session.server'
import type { CurrentUser } from '@/lib/types/user.type'

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentUser | null> => {
    // Kết quả theo từng người dùng nên không được cache ở trình duyệt hay proxy.
    setResponseHeader('Cache-Control', 'private, no-store')
    const { sessionCookie } = await readSession()
    if (!sessionCookie) {
      return null
    }
    try {
      const response = await http.get<CurrentUser>('/api/users/me')
      return response.data
    } catch (error) {
      // Cookie đã bị xoá ở interceptor của `http`; trả `null` để guard đưa về trang đăng nhập.
      if (
        axios.isAxiosError<ApiErrorResponse>(error) &&
        SESSION_REJECTED_ERROR_CODES.has(error.response?.data.errorCode ?? '')
      ) {
        return null
      }
      logHttpError(error, 'getCurrentUser')
      throw new Error(GENERIC_ERROR_MESSAGE)
    }
  },
)
