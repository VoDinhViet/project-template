const relativeTimeFormatter = new Intl.RelativeTimeFormat('vi-VN', {
  numeric: 'auto',
})

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

/** "5 phút trước", "hôm qua", "3 ngày trước"... */
export function formatRelativeTime(isoDate: string, now: number): string {
  // `now` từ `useNow` đứng yên suốt trang, nên việc vừa làm có thể muộn hơn nó vài giây; không hiện "sau x phút".
  const elapsedMs = Math.min(Date.parse(isoDate) - now, 0)
  if (Math.abs(elapsedMs) < MS_PER_HOUR) {
    return relativeTimeFormatter.format(
      Math.round(elapsedMs / MS_PER_MINUTE),
      'minute',
    )
  }
  if (Math.abs(elapsedMs) < MS_PER_DAY) {
    return relativeTimeFormatter.format(
      Math.round(elapsedMs / MS_PER_HOUR),
      'hour',
    )
  }
  return relativeTimeFormatter.format(Math.round(elapsedMs / MS_PER_DAY), 'day')
}
