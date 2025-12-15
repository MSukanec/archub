import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { DashboardCardHeader } from './internal/DashboardCardHeader';
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

const variantStyles: Record<InsightVariant, { borderVar: string; icon: LucideIcon; iconClass: string }> = {
  info: {
    borderVar: 'var(--info-neutral)',
    icon: Info,
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    borderVar: 'var(--warning)',
    icon: AlertTriangle,
    iconClass: 'text-yellow-600 dark:text-yellow-400',
  },
  success: {
    borderVar: 'var(--success)',
    icon: CheckCircle2,
    iconClass: 'text-green-600 dark:text-green-400',
  },
  danger: {
    borderVar: 'var(--destructive)',
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
        <DashboardCardHeader
          icon={titleIcon}
          title={title}
        />
      )}
      <ul className="space-y-3">
        {items.map((item, index) => {
          const variant = item.variant || 'info';
          const styles = variantStyles[variant];
          const IconComponent = styles.icon;

          return (
            <li
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border"
              style={{ borderColor: styles.borderVar }}
              data-testid={`${testId}-item-${index}`}
            >
              <div className="mt-0.5">
                {item.icon || <IconComponent className={cn('h-4 w-4', styles.iconClass)} />}
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
