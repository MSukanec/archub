import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardCardHeader } from './internal/DashboardCardHeader';
import { cn } from '@/lib/utils';

export interface DashboardCardProps {
  id?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  'data-testid'?: string;
}

export function DashboardCard({
  id,
  title,
  description,
  icon,
  actions,
  children,
  className,
  contentClassName,
  'data-testid': testId,
}: DashboardCardProps) {
  const hasHeader = title || icon;

  return (
    <Card id={id} className={cn('p-4', className)} data-testid={testId}>
      {hasHeader && (
        <DashboardCardHeader
          icon={icon}
          title={title || ''}
          description={description}
          actions={actions}
        />
      )}
      <div className={cn(contentClassName)}>{children}</div>
    </Card>
  );
}
