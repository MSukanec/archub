import { forwardRef, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLocation } from 'wouter'
import type { HistoricalComparisonResult } from '@/lib/analytics'

export interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  href?: string;
  onCardClick?: () => void;
  'data-testid'?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  interactive?: boolean;
}

const AppCard = forwardRef<HTMLDivElement, AppCardProps>(
  ({ 
    className, 
    href, 
    onCardClick, 
    onClick, 
    'data-testid': testId,
    title,
    description,
    icon,
    actions,
    interactive,
    children,
    ...props 
  }, ref) => {
    const [, navigate] = useLocation();
    const isClickable = !!(href || onCardClick || onClick || interactive);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (href) {
        navigate(href);
      } else if (onCardClick) {
        onCardClick();
      } else if (onClick) {
        onClick(e);
      }
    };

    const hasHeader = !!(title || icon);

    return (
      <Card
        ref={ref}
        className={cn(
          "p-4",
          isClickable && "relative group cursor-pointer hover:shadow-md transition-shadow",
          className
        )}
        onClick={isClickable ? handleClick : undefined}
        data-testid={testId}
        {...props}
      >
        {hasHeader && (
          <AppCardHeader
            icon={icon}
            title={title || ''}
            description={description}
            actions={actions}
          />
        )}
        {children}
      </Card>
    );
  }
)
AppCard.displayName = "AppCard"

interface AppCardHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

const AppCardHeader = ({
  icon,
  title,
  description,
  actions,
  className,
}: AppCardHeaderProps) => {
  return (
    <div className={cn('flex items-center justify-between pb-3', className)}>
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface AppCardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  showArrow?: boolean
}

const AppCardTitle = ({ children, className, showArrow = true, ...props }: AppCardTitleProps) => {
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

interface AppCardValueProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const AppCardValue = ({ children, className, ...props }: AppCardValueProps) => (
  <div className={cn("text-2xl sm:text-4xl font-bold text-foreground tracking-tight leading-none mt-2", className)} {...props}>
    {children}
  </div>
)

interface AppCardMetaProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

const AppCardMeta = ({ children, className, ...props }: AppCardMetaProps) => (
  <p className={cn("text-xs text-muted-foreground", className)} {...props}>
    {children}
  </p>
)

interface AppCardSubValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

const AppCardSubValue = ({ children, className, ...props }: AppCardSubValueProps) => (
  <span className={cn("text-xs text-muted-foreground ml-2", className)} {...props}>
    {children}
  </span>
)

export type TrendDirection = 'up' | 'down' | 'neutral'

interface AppCardTrendProps extends React.HTMLAttributes<HTMLDivElement> {
  direction: TrendDirection
  value?: string
  invertColors?: boolean
}

const AppCardTrend = ({ direction, value, invertColors = false, className, ...props }: AppCardTrendProps) => {
  const getColor = () => {
    if (invertColors) {
      return direction === 'up' 
        ? { color: 'var(--negative)' }
        : direction === 'down' 
          ? { color: 'var(--positive)' }
          : { color: 'var(--neutral)' }
    }
    return direction === 'up' 
      ? { color: 'var(--positive)' }
      : direction === 'down' 
        ? { color: 'var(--negative)' }
        : { color: 'var(--neutral)' }
  }
  
  return (
    <div className={cn("flex items-center gap-1 text-xs", className)} style={getColor()} {...props}>
      {direction === 'up' && <span>↑</span>}
      {direction === 'down' && <span>↓</span>}
      {direction === 'neutral' && <span>→</span>}
      {value && <span>{value}</span>}
    </div>
  )
}

interface AppCardMetaContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const AppCardMetaContainer = ({ children, className, ...props }: AppCardMetaContainerProps) => (
  <div className={cn("mt-2 min-h-[40px] flex flex-col justify-start gap-0.5", className)} {...props}>
    {children}
  </div>
)

interface AppCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const AppCardContent = ({ children, className, ...props }: AppCardContentProps) => (
  <div className={cn("", className)} {...props}>
    {children}
  </div>
)

interface AppCardHistoricalComparisonProps extends React.HTMLAttributes<HTMLDivElement> {
  comparison: HistoricalComparisonResult | null
  label?: string
}

const AppCardHistoricalComparison = ({ comparison, label = 'vs promedio', className, ...props }: AppCardHistoricalComparisonProps) => {
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
    <div className={cn("flex items-center gap-1 text-xs", colorClass, className)} {...props}>
      <Icon className="w-3 h-3" />
      <span>{sign}{deltaPercent}% {label}</span>
    </div>
  )
}

export { 
  AppCard, 
  AppCardHeader,
  AppCardTitle, 
  AppCardValue, 
  AppCardMeta, 
  AppCardMetaContainer, 
  AppCardSubValue, 
  AppCardTrend, 
  AppCardContent, 
  AppCardHistoricalComparison,
}

// Legacy aliases for backward compatibility
export {
  AppCard as StatCard,
  AppCardTitle as StatCardTitle,
  AppCardValue as StatCardValue,
  AppCardMeta as StatCardMeta,
  AppCardMetaContainer as StatCardMetaContainer,
  AppCardContent as StatCardContent,
  AppCardSubValue as StatCardSubValue,
  AppCardTrend as StatCardTrend,
  AppCardHistoricalComparison as StatCardHistoricalComparison,
  AppCard as DashboardCard,
}
export type { AppCardProps as StatCardProps }
