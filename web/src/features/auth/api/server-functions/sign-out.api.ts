import { createServerFn } from '@tanstack/react-start'
import { clearSessionCookie } from '@/server/session.server'

// Session cookie và refresh token của Firebase không thu hồi riêng từng thiết bị được, nên đăng xuất
// một thiết bị chỉ xoá cookie; cookie đã bị sao chép vẫn tự gia hạn được, phải dùng `signOutAllDevices`.
export const signOut = createServerFn({ method: 'POST' }).handler(
  async (): Promise<void> => {
    await clearSessionCookie()
  },
)
