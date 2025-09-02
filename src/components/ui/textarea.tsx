import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full text-sm md:text-xs leading-tight py-3 md:py-2 px-4 md:px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 placeholder:text-[var(--input-placeholder)] resize-none min-h-[120px] md:min-h-[100px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive aria-[invalid=true]:ring-1",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
