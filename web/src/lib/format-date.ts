const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
})

/** Ngày giờ lưu UTC, hiển thị theo múi giờ Việt Nam. */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}
