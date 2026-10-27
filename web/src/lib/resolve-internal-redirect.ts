const DEFAULT_REDIRECT = '/'
const LAST_CONTROL_CHAR_CODE = 0x20

// Tab, CR, LF bị trình duyệt bỏ đi khi phân tích URL nên `/<TAB>/host` thành `//host`.
function hasUnsafeChar(redirect: string): boolean {
  return Array.from(redirect).some(
    (char) => char.charCodeAt(0) <= LAST_CONTROL_CHAR_CODE || char === '\\',
  )
}

/** Chỉ nhận đường dẫn nội bộ (`/x`), chặn `//host`, URL tuyệt đối và ký tự điều khiển để tránh open redirect. */
export function resolveInternalRedirect(redirect: string | undefined): string {
  if (
    !redirect?.startsWith('/') ||
    redirect.startsWith('//') ||
    hasUnsafeChar(redirect)
  ) {
    return DEFAULT_REDIRECT
  }
  return redirect
}
