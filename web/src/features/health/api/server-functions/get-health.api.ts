import { createServerFn } from '@tanstack/react-start'
import axios from 'axios'
import { GENERIC_ERROR_MESSAGE } from '@/lib/error-messages'
import { http, logHttpError } from '@/server/http.server'
import type { Health } from '../../types/health.type'

const SERVER_ERROR_STATUS = 500

function resolveGetHealthErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return GENERIC_ERROR_MESSAGE
  }
  // Không có response nghĩa là mất kết nối, hết thời gian chờ hoặc lỗi DNS.
  if (!error.response) {
    return 'Không kết nối được tới máy chủ API.'
  }
  if (error.response.status >= SERVER_ERROR_STATUS) {
    return 'Máy chủ API đang gặp sự cố. Vui lòng thử lại sau.'
  }
  return GENERIC_ERROR_MESSAGE
}

export const getHealth = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Health> => {
    try {
      const response = await http.get<Health>('/api/health')
      return response.data
    } catch (error) {
      logHttpError(error, 'getHealth')
      throw new Error(resolveGetHealthErrorMessage(error))
    }
  },
)
