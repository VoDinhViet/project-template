// Đã chỉnh tay bo góc vừa phải (`rounded-md`) theo yêu cầu người dùng; `shadcn add badge` sẽ ghi đè, phải chỉnh lại.
// Nhãn nền đặc kiểu Jira (người dùng chọn 2026-10-24): nhãn truyền cặp `bg-X-soft text-X-ink` tự đổi
// thành nền `X-ink`, chữ `text-card` (trắng ở chế độ sáng, tối ở chế độ tối vì ink bản tối là màu sáng).
// Nhãn xám (`neutral`) giữ nền nhạt như nhãn To Do của Jira. Khung cảnh báo, vùng tô nhấn không dùng
// `Badge` nên vẫn nền nhạt.

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3! [&.bg-success-soft]:bg-success-ink [&.bg-success-soft]:text-card [&.bg-warning-soft]:bg-warning-ink [&.bg-warning-soft]:text-card [&.bg-info-soft]:bg-info-ink [&.bg-info-soft]:text-card [&.bg-destructive-soft]:bg-destructive-ink [&.bg-destructive-soft]:text-card [&.bg-violet-soft]:bg-violet-ink [&.bg-violet-soft]:text-card",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
