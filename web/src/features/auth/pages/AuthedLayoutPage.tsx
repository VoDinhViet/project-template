import { Outlet } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { AppSidebar } from '@/components/shared/layouts/AppSidebar'
import { AppTopbar } from '@/components/shared/layouts/AppTopbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getSidebarDefaultOpen } from '@/lib/sidebar-state'

export function AuthedLayoutPage() {
  return (
    <SidebarProvider
      defaultOpen={getSidebarDefaultOpen()}
      // `as`: biến CSS tuỳ biến không có trong kiểu `CSSProperties`. Thu gọn rộng 4rem để ô icon 40px
      // có đệm đều hai bên (mặc định 3rem chật hơn ô icon cộng đệm nên icon bị lệch).
      style={
        {
          '--sidebar-width': '16.25rem',
          '--sidebar-width-icon': '4rem',
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <div className="flex min-h-svh flex-col text-foreground">
          <AppTopbar />
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
