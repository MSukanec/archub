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
  'data-testid'?: string;
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, variant, href, onCardClick, onClick, 'data-testid': testId, ...props }, ref) => {
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
        data-testid={testId}
        {...props}
      />
    );
  }
)
StatCard.displayName = "StatCard"

interface StatCardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  showArrow?: boolean
}

const StatCardTitle = ({ children, className, showArrow = true, ...props }: StatCardTitleProps) => {
  return (
    <div className="flex items-center justify-between gap-2" {...props}>
      <p className={cn("text-xs font-normal text-muted-foreground uppercase tracking-wide", className)}>
        {children}
      </p>
      {showArrow && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-muted-foreground">
          <span>Ver más</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}

interface StatCardValueProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const StatCardValue = ({ children, className, ...props }: StatCardValueProps) => (
  <div className={cn("text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-none mt-2", className)} {...props}>
    {children}
  </div>
)

interface StatCardMetaProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

const StatCardMeta = ({ children, className, ...props }: StatCardMetaProps) => (
  <p className={cn("text-sm text-muted-foreground mt-2", className)} {...props}>
    {children}
  </p>
)

interface StatCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const StatCardContent = ({ children, className, ...props }: StatCardContentProps) => (
  <div className={cn("mt-4", className)} {...props}>
    {children}
  </div>
)

export { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardContent }
