import {
  createLink,
  useLocation,
  useRouteContext,
} from '@tanstack/react-router'
import { PulseIcon, UsersGroupRoundedIcon } from '@solar-icons/react/bold'
import {
  UsersGroupRoundedIcon as UsersGroupRoundedLinearIcon,
  PulseIcon as PulseLinearIcon,
} from '@solar-icons/react/linear'
import type { Icon } from '@solar-icons/react/lib/types'
import { useEffect } from 'react'
import type { ComponentProps } from 'react'
import { AppLogo } from '@/components/shared/primitives/AppLogo'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { hasPermission } from '@/lib/permission'
import type { Permission } from '@/lib/types/role.type'
import { cn } from '@/lib/utils'

// Render thành thẻ `<a>` thật (mở tab mới, chuột giữa vẫn chạy) thay vì `<button>` mặc định. Kiểu menu
// Hyper: mục đang chọn không tô nền, chỉ đổi chữ sang trắng và icon sang Bold. Khi thu gọn, mỗi mục là
// ô vuông 40px căn giữa (ghi đè `size-8!` của shadcn, quá nhỏ so với logo).
function SidebarMenuAnchor({
  className,
  ...props
}: ComponentProps<typeof SidebarMenuButton>) {
  return (
    <SidebarMenuButton
      render={<a />}
      className={cn(
        'h-9 gap-3 px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-transparent hover:text-sidebar-accent-foreground active:bg-sidebar-accent data-active:bg-transparent data-active:font-semibold data-active:text-sidebar-accent-foreground group-data-[collapsible=icon]:data-active:bg-sidebar-accent [&_svg]:size-4.5 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&_svg]:size-5 group-data-[collapsible=icon]:[&>span:last-child]:hidden',
        className,
      )}
      {...props}
    />
  )
}

const SidebarMenuLink = createLink(SidebarMenuAnchor)

type MenuItem = {
  label: string
  to: '/users' | '/health'
  // Mục đang chọn dùng icon Bold, còn lại Linear (xem frontend/forms-ui.md).
  icon: Icon
  inactiveIcon: Icon
  /** Class màu icon, luôn hiện kể cả khi không chọn; token ở `--sidebar-icon-*` trong `styles.css`. */
  iconClassName: string
  /** Nhánh URL nằm ngoài `to` nhưng thuộc mục này, nên cũng làm sáng mục này. */
  relatedPath?: string
  /** Ẩn mục khi thiếu quyền; route cũng chặn ở `beforeLoad` bằng cùng mã. */
  permission?: Permission
}

type MenuGroup = {
  label: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Điều hướng',
    items: [
      {
        label: 'Người dùng',
        to: '/users',
        relatedPath: '/roles',
        iconClassName: 'text-sidebar-icon-violet',
        permission: 'users:read',
        icon: UsersGroupRoundedIcon,
        inactiveIcon: UsersGroupRoundedLinearIcon,
      },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      {
        label: 'Tình trạng hệ thống',
        to: '/health',
        iconClassName: 'text-sidebar-icon-teal',
        icon: PulseIcon,
        inactiveIcon: PulseLinearIcon,
      },
    ],
  },
]

function isPathWithin(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`)
}

function isMenuItemActive(menuItem: MenuItem, pathname: string): boolean {
  if (menuItem.relatedPath && isPathWithin(pathname, menuItem.relatedPath)) {
    return true
  }
  return isPathWithin(pathname, menuItem.to)
}

function SidebarBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuLink
          to="/"
          tooltip="Smart Things"
          // Khi thu gọn chỉ còn icon, link cần tên riêng cho trình đọc màn hình.
          aria-label="Smart Things"
          // Giữ bố cục dọc của logo gốc (hình trên, chữ dưới); thu gọn thì phần chữ (span cuối) bị ẩn.
          className="h-auto flex-col justify-center gap-2 px-3 py-0 text-sidebar-accent-foreground hover:bg-transparent hover:text-sidebar-accent-foreground"
        >
          <AppLogo className="size-16! shrink-0 group-data-[collapsible=icon]:size-8!" />
          <span className="flex flex-col items-center text-center">
            <span className="text-lg leading-none font-extrabold tracking-tight uppercase">
              Smart Things
            </span>
            <span className="mt-1.5 text-2xs leading-none font-medium tracking-widest text-sidebar-foreground uppercase">
              Success Together
            </span>
          </span>
        </SidebarMenuLink>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar() {
  const { pathname } = useLocation()
  const { currentUser } = useRouteContext({ from: '/(authed)' })
  const { setOpenMobile } = useSidebar()

  // Trên mobile sidebar là sheet nằm đè lên trang và `SidebarProvider` sống qua các lần điều hướng,
  // nên phải tự đóng sheet khi đổi trang.
  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="shrink-0 justify-center px-3 py-4 group-data-[collapsible=icon]:h-17.5 group-data-[collapsible=icon]:py-0">
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent className="gap-3 px-3 pt-1 pb-4">
        {menuGroups.map((menuGroup) => (
          <SidebarGroup key={menuGroup.label} className="gap-0.5 p-0">
            <SidebarGroupLabel className="h-8 truncate px-3 pt-2 text-2xs font-bold tracking-wider text-sidebar-foreground uppercase">
              {menuGroup.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {menuGroup.items
                  .filter(
                    (menuItem) =>
                      !menuItem.permission ||
                      hasPermission(currentUser, menuItem.permission),
                  )
                  .map((menuItem) => {
                    const isActive = isMenuItemActive(menuItem, pathname)
                    const MenuIcon = isActive
                      ? menuItem.icon
                      : menuItem.inactiveIcon
                    return (
                      <SidebarMenuItem key={menuItem.to}>
                        <SidebarMenuLink
                          to={menuItem.to}
                          // `exact` để router chỉ gắn `aria-current` đúng trang đang mở; mục đang mở tự tính
                          // ở `isMenuItemActive` (gồm cả `relatedPath`).
                          activeOptions={{ exact: true, includeSearch: false }}
                          isActive={isActive}
                          aria-current={isActive ? 'page' : undefined}
                          tooltip={menuItem.label}
                        >
                          <MenuIcon className={menuItem.iconClassName} />
                          <span className="min-w-0 truncate">
                            {menuItem.label}
                          </span>
                        </SidebarMenuLink>
                      </SidebarMenuItem>
                    )
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
