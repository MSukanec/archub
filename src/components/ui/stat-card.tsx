import { forwardRef, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowRight } from 'lucide-react'
import { useLocation } from 'wouter'

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
    VariantProps<typeof statCardVariants> {
  href?: string;
  onCardClick?: () => void;
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, variant, href, onCardClick, onClick, ...props }, ref) => {
    const [, navigate] = useLocation();
    const isClickable = !!(href || onCardClick || onClick);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (href) {
        navigate(href);
      } else if (onCardClick) {
        onCardClick();
      } else if (onClick) {
        onClick(e);
      }
    };

    return (
      <Card
        ref={ref}
        className={cn(
          statCardVariants({ variant }),
          isClickable && "relative group cursor-pointer hover:shadow-md transition-shadow",
          className
        )}
        onClick={isClickable ? handleClick : undefined}
        {...props}
      />
    );
  }
)
StatCard.displayName = "StatCard"

interface StatCardTitleProps {
  children: ReactNode
  className?: string
  showArrow?: boolean
}

const StatCardTitle = ({ children, className, showArrow = true }: StatCardTitleProps) => {
  // Determinar si el padre es clickeable mirando si tiene la clase 'group'
  const parentIsClickable = showArrow;

  return (
    <div className="flex items-center gap-2">
      <p className={cn("text-xs font-normal text-muted-foreground uppercase tracking-wide", className)}>
        {children}
      </p>
      {parentIsClickable && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

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
