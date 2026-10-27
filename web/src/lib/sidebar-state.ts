import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

const SIDEBAR_COOKIE_NAME = 'sidebar_state'

// `SidebarProvider` của shadcn ghi cookie mỗi lần thu/mở nhưng không đọc lại, nên tải lại trang
// sidebar tự mở ra. Đọc cùng một cookie ở cả server và client để SSR và hydrate khớp nhau.
export const getSidebarDefaultOpen = createIsomorphicFn()
  .server((): boolean => getCookie(SIDEBAR_COOKIE_NAME) !== 'false')
  .client((): boolean => {
    const sidebarCookie = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
    return sidebarCookie?.split('=')[1] !== 'false'
  })
