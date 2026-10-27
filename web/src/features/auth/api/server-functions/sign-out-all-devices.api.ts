import { createServerFn } from '@tanstack/react-start'
import { http, logHttpError } from '@/server/http.server'
import { clearSessionCookie } from '@/server/session.server'

const SIGN_OUT_ALL_DEVICES_ERROR_MESSAGE =
  'Không đăng xuất được các thiết bị khác. Vui lòng thử lại.'

export const signOutAllDevices = createServerFn({ method: 'POST' }).handler(
  async (): Promise<void> => {
    try {
      await http.post('/api/auth/logout-all')
    } catch (error) {
      // Phiên ở thiết bị khác vẫn còn hiệu lực nên phải báo, không im lặng coi như xong.
      logHttpError(error, 'signOutAllDevices')
      throw new Error(SIGN_OUT_ALL_DEVICES_ERROR_MESSAGE)
    } finally {
      await clearSessionCookie()
    }
  },
)
