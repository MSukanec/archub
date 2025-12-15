import { forwardRef, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLocation } from 'wouter'
import type { HistoricalComparisonResult } from '@/lib/analytics'

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
    <div className={cn(
      "flex items-center gap-1.5 text-sm font-medium text-muted-foreground",
      "group-hover:underline transition-all",
      className
    )} {...props}>
      {children}
      {showArrow && (
        <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

interface StatCardValueProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const StatCardValue = ({ children, className, ...props }: StatCardValueProps) => (
  <div className={cn("text-2xl sm:text-4xl font-bold text-foreground tracking-tight leading-none mt-2", className)} {...props}>
    {children}
  </div>
)

interface StatCardMetaProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

const StatCardMeta = ({ children, className, ...props }: StatCardMetaProps) => (
  <p className={cn("text-[11px] text-muted-foreground mt-2", className)} {...props}>
    {children}
  </p>
)

interface StatCardSubValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

const StatCardSubValue = ({ children, className, ...props }: StatCardSubValueProps) => (
  <span className={cn("text-xs text-muted-foreground ml-2", className)} {...props}>
    {children}
  </span>
)

type TrendDirection = 'up' | 'down' | 'neutral'

interface StatCardTrendProps extends React.HTMLAttributes<HTMLDivElement> {
  direction: TrendDirection
  value?: string
}

const StatCardTrend = ({ direction, value, className, ...props }: StatCardTrendProps) => {
  const colorClass = direction === 'up' 
    ? 'text-red-600 dark:text-red-400' 
    : direction === 'down' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-muted-foreground'
  
  return (
    <div className={cn("flex items-center gap-1 text-xs mt-1", colorClass, className)} {...props}>
      {direction === 'up' && <span>↑</span>}
      {direction === 'down' && <span>↓</span>}
      {direction === 'neutral' && <span>→</span>}
      {value && <span>{value}</span>}
    </div>
  )
}

interface StatCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const StatCardContent = ({ children, className, ...props }: StatCardContentProps) => (
  <div className={cn("mt-4", className)} {...props}>
    {children}
  </div>
)

interface StatCardHistoricalComparisonProps extends React.HTMLAttributes<HTMLDivElement> {
  comparison: HistoricalComparisonResult | null
  label?: string
}

const StatCardHistoricalComparison = ({ comparison, label = 'vs promedio', className, ...props }: StatCardHistoricalComparisonProps) => {
  if (!comparison) return null

  const { direction, deltaPercent } = comparison
  
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus
  
  const colorClass = direction === 'up' 
    ? 'text-amber-600 dark:text-amber-400' 
    : direction === 'down' 
      ? 'text-blue-600 dark:text-blue-400' 
      : 'text-muted-foreground'

  const sign = deltaPercent > 0 ? '+' : ''
  
  return (
    <div className={cn("flex items-center gap-1 text-xs mt-0.5", colorClass, className)} {...props}>
      <Icon className="w-3 h-3" />
      <span>{sign}{deltaPercent}% {label}</span>
    </div>
  )
}

export { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardSubValue, StatCardTrend, StatCardContent, StatCardHistoricalComparison }
export type { TrendDirection }
