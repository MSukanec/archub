import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Info, AlertTriangle, CheckCircle2, XCircle, LucideIcon } from 'lucide-react';

type InsightVariant = 'info' | 'warning' | 'success' | 'danger';

export interface InsightItem {
  icon?: ReactNode;
  title: string;
  description?: string;
  variant?: InsightVariant;
}

export interface InsightCardProps {
  title?: string;
  titleIcon?: ReactNode;
  items: InsightItem[];
  className?: string;
  'data-testid'?: string;
}

const variantStyles: Record<InsightVariant, { bg: string; icon: LucideIcon; iconClass: string }> = {
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: Info,
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: AlertTriangle,
    iconClass: 'text-yellow-600 dark:text-yellow-400',
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircle2,
    iconClass: 'text-green-600 dark:text-green-400',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: XCircle,
    iconClass: 'text-red-600 dark:text-red-400',
  },
};

export function InsightCard({
  title,
  titleIcon,
  items,
  className,
  'data-testid': testId,
}: InsightCardProps) {
  if (items.length === 0) return null;

  return (
    <Card className={cn('p-4', className)} data-testid={testId}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {titleIcon}
          <h3 className="text-base font-medium">{title}</h3>
        </div>
      )}
      <ul className="space-y-3">
        {items.map((item, index) => {
          const variant = item.variant || 'info';
          const styles = variantStyles[variant];
          const IconComponent = styles.icon;

          return (
            <li
              key={index}
              className="flex items-start gap-3"
              data-testid={`${testId}-item-${index}`}
            >
              <div className={cn('mt-0.5 p-1 rounded-full', styles.bg)}>
                {item.icon || <IconComponent className={cn('h-3 w-3', styles.iconClass)} />}
              </div>
              <div className="flex-1">
                <span className="text-sm text-muted-foreground">{item.title}</span>
                {item.description && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{item.description}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
