import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DashboardCardHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function DashboardCardHeader({
  icon,
  title,
  description,
  actions,
  className,
}: DashboardCardHeaderProps) {
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
