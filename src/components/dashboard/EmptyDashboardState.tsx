import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyDashboardStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function EmptyDashboardState({
  icon,
  title,
  description,
  action,
  className,
  'data-testid': testId,
}: EmptyDashboardStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
      data-testid={testId}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground">{icon}</div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
