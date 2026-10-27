import { HamburgerMenuIcon } from '@solar-icons/react/linear'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'

export function AppTopbar() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-20 flex h-17.5 shrink-0 items-center gap-3 bg-card shadow-card pl-2 text-card-foreground sm:gap-4 sm:pl-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label="Mở hoặc thu gọn thanh điều hướng"
      >
        <HamburgerMenuIcon className="size-5" />
      </Button>
      <div className="ml-auto flex h-full shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <div className="flex h-full items-center px-1 sm:px-3">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
