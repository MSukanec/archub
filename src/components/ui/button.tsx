import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] border border-[var(--button-primary-border)] hover:bg-[var(--button-primary-hover-bg)] hover:text-[var(--button-primary-hover-text)] disabled:bg-[var(--button-primary-disabled-bg)] disabled:text-[var(--button-primary-disabled-text)]",
        destructive:
          "bg-[var(--destructive)] text-[var(--destructive-text)] hover:bg-[var(--destructive)]/90",
        outline:
          "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] border border-[var(--button-secondary-border)] hover:bg-[var(--button-secondary-hover-bg)] hover:text-[var(--button-secondary-hover-text)] hover:border-[var(--button-secondary-hover-border)]",
        secondary:
          "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] border border-[var(--button-secondary-border)] hover:bg-[var(--button-secondary-hover-bg)] hover:text-[var(--button-secondary-hover-text)]",
        ghost: "bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)] border-[var(--button-ghost-border)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-[var(--radius-md)]",
        sm: "h-9 px-3 rounded-[var(--radius-md)]",
        lg: "h-11 px-8 rounded-[var(--radius-md)]",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
