// Đã chỉnh tay cho đồng bộ với `SelectTrigger`, kiểu ô nhập nền xám không viền của Jira (đang nhập thì nền trắng,
// viền xanh và vòng focus 2px; người dùng yêu cầu); `shadcn add input` sẽ ghi đè, phải chỉnh lại.
// Giữ `text-base` dưới `md`: iOS tự phóng to trang khi ô nhập có chữ nhỏ hơn 16px.

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-transparent bg-foreground/5 px-3 py-1.5 text-base text-foreground transition-[color,background-color,border-color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:bg-foreground/8 focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25 md:text-sm [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-search-cancel-button]:cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

export { Input }
