/** Tên tiếng Việt: lấy chữ đầu của hai từ cuối ("Nguyễn Minh Anh" → "MA"), vì tên gọi nằm ở cuối. */
export function getInitials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}
