import { useState } from 'react'

const MS_PER_MINUTE = 60 * 1000

/**
 * Mốc "bây giờ" cố định trong suốt vòng đời trang, làm tròn xuống phút.
 *
 * Rules:
 * - Server và trình duyệt render cách nhau vài giây; làm tròn để "x phút trước", quá hạn, sắp hạn ra cùng chữ
 *   khi hydrate, tránh trang nháy đổi chữ ngay sau khi hiện.
 */
export function useNow(): number {
  const [now] = useState(
    () => Math.floor(Date.now() / MS_PER_MINUTE) * MS_PER_MINUTE,
  )
  return now
}
