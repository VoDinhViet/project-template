import { useQuery } from '@tanstack/react-query'
import {
  AltArrowDownIcon,
  DevicesIcon,
  Logout2Icon,
} from '@solar-icons/react/linear'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { currentUserQueryOptions, useSignOut } from '@/features/auth/api'
import { getInitials } from '@/lib/get-initials'

export function UserMenu() {
  // Đọc lại hồ sơ `(authed)` đã nạp sẵn trong `beforeLoad`, không gọi thêm `api`.
  const { data: currentUser } = useQuery(currentUserQueryOptions())
  const { mutate: signOut, isPending: isSigningOut } = useSignOut()

  if (!currentUser) {
    return null
  }

  const avatar = (
    <Avatar className="size-9">
      {currentUser.avatarUrl && (
        <AvatarImage
          src={currentUser.avatarUrl}
          alt=""
          // Ảnh Google từ chối request có `Referer` lạ.
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback className="bg-muted text-xs font-medium">
        {getInitials(currentUser.displayName)}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="h-auto gap-3 px-1.5 py-1"
            aria-label="Tài khoản người dùng"
          >
            {avatar}
            <span className="hidden min-w-0 text-left lg:block">
              <span className="block truncate text-sm leading-tight font-medium">
                {currentUser.displayName}
              </span>
              <span className="block truncate text-xs leading-tight text-muted-foreground">
                {currentUser.email}
              </span>
            </span>
            <AltArrowDownIcon className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-60">
        <div className="flex items-center gap-3 px-2 py-1.5">
          {avatar}
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-medium">
              {currentUser.displayName}
            </p>
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {currentUser.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onClick={() => signOut({ isAllDevices: true })}
        >
          <DevicesIcon />
          Đăng xuất mọi thiết bị
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onClick={() => signOut()}
        >
          <Logout2Icon />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
