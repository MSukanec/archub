import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover-bg)] hover:text-[var(--button-primary-hover-text)] rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 [&_svg]:size-4",
        destructive:
          "bg-destructive text-[var(--destructive-text)] hover:bg-destructive/80 rounded-md px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 [&_svg]:size-4",
        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 [&_svg]:size-4",
        secondary:
          "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] border border-[var(--button-secondary-border)] hover:bg-[var(--button-secondary-hover-bg)] hover:text-[var(--button-secondary-hover-text)] hover:border-[var(--button-secondary-hover-border)] rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 [&_svg]:size-4",
        ghost:
          "bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)] rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 [&_svg]:size-4",
        "ghost-flat":
          "bg-transparent text-[var(--button-ghost-text)] hover:bg-transparent hover:text-[var(--button-ghost-hover-text)] rounded-lg px-4 py-2 [&_svg]:size-4",
        "ghost-search":
          "bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)] rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 [&_svg]:size-4 transition-all duration-300 overflow-hidden",
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
