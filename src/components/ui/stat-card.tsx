import { forwardRef, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const statCardVariants = cva(
  "p-4",
  {
    variants: {
      variant: {
        default: "",
        minimal: "",
      },
    },
    defaultVariants: {
      variant: "minimal",
    },
  }
)

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, variant, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(statCardVariants({ variant, className }))}
      {...props}
    />
  )
)
StatCard.displayName = "StatCard"

interface StatCardTitleProps {
  children: ReactNode
  className?: string
}

const StatCardTitle = ({ children, className }: StatCardTitleProps) => (
  <p className={cn("text-xs font-normal text-muted-foreground uppercase tracking-wide", className)}>
    {children}
  </p>
)

interface StatCardValueProps {
  children: ReactNode
  className?: string
}

const StatCardValue = ({ children, className }: StatCardValueProps) => (
  <div className={cn("text-5xl font-bold text-foreground tracking-tight leading-none mt-2", className)}>
    {children}
  </div>
)

interface StatCardMetaProps {
  children: ReactNode
  className?: string
}

const StatCardMeta = ({ children, className }: StatCardMetaProps) => (
  <p className={cn("text-sm text-muted-foreground mt-2", className)}>
    {children}
  </p>
)

interface StatCardContentProps {
  children: ReactNode
  className?: string
}

const StatCardContent = ({ children, className }: StatCardContentProps) => (
  <div className={cn("mt-4", className)}>
    {children}
  </div>
)

export { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardContent }
