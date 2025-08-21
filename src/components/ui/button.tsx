import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] hover:text-[var(--button-primary-hover-text)] rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 gap-2 text-sm font-medium [&_svg]:size-4",
        destructive:
          "bg-destructive text-[var(--destructive-text)] hover:bg-destructive/80 rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 gap-2 text-sm font-medium [&_svg]:size-4",
        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 gap-2 text-sm font-medium [&_svg]:size-4",
        secondary:
          "bg-[var(--button-secondary-bg)] text-[var(--button-ghost-text)] border border-[var(--menues-border)] hover:bg-[var(--button-secondary-hover-bg)] hover:text-[var(--button-ghost-hover-text)] hover:border-[var(--menues-border)] rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 gap-2 text-sm font-medium [&_svg]:size-4",
        ghost:
          "bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)] rounded-lg border border-[var(--menues-border)] [&_svg]:size-4",
        "ghost-flat":
          "bg-transparent text-[var(--button-ghost-text)] hover:bg-transparent hover:text-[var(--button-ghost-hover-text)] rounded-lg px-4 py-2 [&_svg]:size-4",
        "ghost-search":
          "bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)] rounded-lg px-4 py-2 border border-[var(--menues-border)] [&_svg]:size-4 transition-all duration-300 overflow-hidden",
        link: "text-accent underline-offset-4 hover:underline px-4 py-2",
      },
      size: {
        default: "text-sm px-4 py-3 md:py-2 min-h-[44px] md:min-h-auto gap-2",
        sm: "text-sm md:text-xs px-4 md:px-3 py-2.5 md:py-1.5 min-h-[40px] md:min-h-auto gap-2", 
        lg: "text-base px-6 py-4 md:py-3 min-h-[48px] md:min-h-auto gap-2",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-4 w-4 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
