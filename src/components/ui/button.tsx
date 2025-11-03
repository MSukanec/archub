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
          "bg-accent text-accent-foreground hover:bg-[var(--accent-hover)] rounded-lg px-3 py-1.5 md:py-1.5 py-3 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 gap-2 text-sm font-medium [&_svg]:size-4",
        destructive:
          "bg-destructive text-[var(--destructive-text)] hover:bg-destructive/80 rounded-lg px-3 py-1.5 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 gap-2 text-sm font-medium [&_svg]:size-4",
        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 gap-2 text-sm font-medium [&_svg]:size-4",
        secondary:
          "bg-[var(--button-secondary-bg)] text-[var(--button-ghost-text)] border border-[var(--main-sidebar-border)] hover:bg-[var(--button-secondary-hover-bg)] hover:text-[var(--button-ghost-hover-text)] hover:border-[var(--main-sidebar-border)] rounded-lg px-3 py-1.5 md:py-1.5 py-3 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 gap-2 text-sm font-medium [&_svg]:size-4",
        ghost:
          "bg-transparent text-[var(--button-ghost-hover-text)] hover:bg-transparent hover:text-[var(--button-ghost-hover-text)] rounded-lg px-2 py-2 [&_svg]:size-5",
        link: "text-accent underline-offset-4 hover:underline px-2 py-1",
      },
      size: {
        default: "text-sm gap-2",
        sm: "text-xs gap-1.5", 
        lg: "text-base gap-3",
        icon: "h-8 w-8 p-0 [&_svg]:size-5",
        "icon-sm": "h-6 w-6 p-0",
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