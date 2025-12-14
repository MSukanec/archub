import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface DashboardCardProps {
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
  title,
  description,
  icon,
  actions,
  children,
  className,
  contentClassName,
  'data-testid': testId,
}: DashboardCardProps) {
  const hasHeader = title || description || icon || actions;

  return (
    <Card className={cn(className)} data-testid={testId}>
      {hasHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <div>
              {title && (
                <CardTitle className="text-base font-medium">{title}</CardTitle>
              )}
              {description && (
                <CardDescription className="text-sm">{description}</CardDescription>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
    </Card>
  );
}
