import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export const PageActionsSlotContext = createContext<HTMLElement | null>(null)

type PageActionsProps = {
  children: ReactNode
}

/**
 * Cho trang con (nằm trong `<Outlet />` của layout) đặt nút lên thanh tiêu đề của `PageShell` cha mà
 * vẫn giữ trạng thái ở trang con.
 *
 * Rules:
 * - Ô chứa chỉ có sau khi mount nên lúc SSR không render gì; nút hiện ra khi trang hydrate xong.
 */
export function PageActions({ children }: PageActionsProps) {
  const pageActionsSlot = useContext(PageActionsSlotContext)
  return pageActionsSlot ? createPortal(children, pageActionsSlot) : null
}
