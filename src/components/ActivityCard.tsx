import { ReactNode } from 'react';
import { AppCard } from '@/components/shared/AppCard';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
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
  description?: string;
  items: ActivityItem[];
  emptyText?: string;
  emptyMessage?: string;
  onViewAll?: () => void;
  className?: string;
  'data-testid'?: string;
}
export function ActivityCard({
  title,
  titleIcon,
  description,
  items,
  emptyText,
  emptyMessage,
  onViewAll,
  className,
  'data-testid': testId,
}: ActivityCardProps) {
  const resolvedEmptyText = emptyText || emptyMessage || 'No hay actividad reciente';
  const viewAllAction = onViewAll ? (
    <Button variant="ghost" size="sm" onClick={onViewAll} className="h-7 px-2 text-xs">
      Ver todos
      <ChevronRight className="h-3 w-3 ml-1" />
    </Button>
  ) : undefined;
  
  return (
    <AppCard 
      title={title} 
      icon={titleIcon} 
      description={description}
      actions={viewAllAction}
      className={className} 
      data-testid={testId}
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{resolvedEmptyText}</p>
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
    </AppCard>
  );
}
