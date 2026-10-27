// Đã chỉnh tay cho đồng bộ với `input.tsx` và `SelectTrigger` (người dùng yêu cầu); `shadcn add textarea` sẽ ghi đè, phải chỉnh lại.

import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-transparent bg-foreground/5 px-3 py-2 text-base text-foreground transition-[color,border-color,box-shadow] outline-none placeholder:text-muted-foreground hover:bg-foreground/8 focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
