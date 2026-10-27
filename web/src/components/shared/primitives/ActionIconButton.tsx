import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ActionIconButtonProps = ComponentProps<typeof Button> & {
  tone?: 'default' | 'destructive'
}

/**
 * Nút icon thao tác trên dòng bảng: ô vuông 32px có viền nhạt; nút nguy hiểm chỉ đổi chữ đỏ, nền đỏ nhạt hiện khi rê chuột.
 *
 * Rules:
 * - Ghi đè `outline` (nền xám không viền) vì nút thao tác phải nhìn ra ngay là bấm được giữa các ô bảng.
 * - Icon bên trong dùng kiểu Linear (xem `frontend/forms-ui.md`).
 * - Ghép với phần tử khác (Link, trigger của menu) bằng prop `render`; nhớ đặt `aria-label`.
 */
export function ActionIconButton({
  tone = 'default',
  className,
  ...props
}: ActionIconButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn(
        tone === 'destructive'
          ? 'border-border bg-card text-destructive-ink hover:border-destructive/30 hover:bg-destructive-soft'
          : 'border-border bg-card text-foreground/75 hover:border-foreground/25 hover:bg-muted hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}
