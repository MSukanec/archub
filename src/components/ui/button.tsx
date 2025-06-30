import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-[var(--button-primary-text)] hover:bg-accent/80 rounded-md px-4 py-2",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-md px-4 py-2",
        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2",
        secondary:
          "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] border border-[var(--button-secondary-border)] hover:bg-[var(--button-secondary-hover-bg)] hover:text-[var(--button-secondary-hover-text)] hover:border-[var(--button-secondary-hover-border)] rounded-md px-4 py-2",
        ghost: "hover:text-accent rounded-md px-4 py-2 [&_svg]:hover:text-accent",
        link: "text-accent underline-offset-4 hover:underline px-4 py-2",
      },
      size: {
        default: "text-sm px-4 py-2",
        sm: "text-xs px-3 py-1.5",
        lg: "text-base px-6 py-3",
        icon: "h-9 w-9 p-0",
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
