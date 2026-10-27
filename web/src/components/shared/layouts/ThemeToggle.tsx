import { MoonIcon, SunIcon } from '@solar-icons/react/bold'
import {
  MoonIcon as MoonLinearIcon,
  SunIcon as SunLinearIcon,
} from '@solar-icons/react/linear'
import { useTheme } from 'next-themes'

/**
 * Công tắc sáng/tối: núm trượt sang phải khi đang tối.
 *
 * Rules:
 * - Vị trí núm và icon đổi bằng biến thể CSS `dark:`, không đọc theme lúc render, nên không lệch khi hydrate.
 * - Vì vậy không đặt `aria-checked`; nhãn nút mô tả hành động thay cho trạng thái.
 * - `resolvedTheme` chỉ đọc lúc bấm để chế độ "theo hệ thống" cũng đổi đúng sang chiều ngược lại.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Chuyển giao diện sáng/tối"
      title="Chuyển giao diện sáng/tối"
      className="relative inline-flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full border bg-muted p-0.75 transition-colors outline-none motion-reduce:[&_*]:transition-none hover:bg-muted/80 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <SunLinearIcon className="absolute left-2 size-3.5 text-muted-foreground opacity-0 transition-opacity dark:opacity-100" />
      <MoonLinearIcon className="absolute right-2 size-3.5 text-muted-foreground opacity-100 transition-opacity dark:opacity-0" />
      <span className="relative flex size-7 items-center justify-center rounded-full bg-card shadow-sm transition-transform duration-300 ease-out dark:translate-x-7">
        <SunIcon className="size-4 text-warning-ink transition-all duration-300 dark:scale-0 dark:-rotate-90" />
        <MoonIcon className="absolute size-4 scale-0 rotate-90 text-violet-ink transition-all duration-300 dark:scale-100 dark:rotate-0" />
      </span>
    </button>
  )
}
