import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { AppCardHeader } from '@/components/shared/AppCard';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string | number;
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
  badge?: ReactNode;
}

export interface ActivityCardProps {
  title?: string;
  titleIcon?: ReactNode;
  items: ActivityItem[];
  emptyText?: string;
  className?: string;
  'data-testid'?: string;
}

export function ActivityCard({
  title,
  titleIcon,
  items,
  emptyText = 'No hay actividad reciente',
  className,
  'data-testid': testId,
}: ActivityCardProps) {
  return (
    <Card className={cn('p-4', className)} data-testid={testId}>
      {title && (
        <AppCardHeader
          icon={titleIcon}
          title={title}
        />
      )}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0"
              data-testid={`${testId}-item-${index}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {item.rightContent}
                {item.badge}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
