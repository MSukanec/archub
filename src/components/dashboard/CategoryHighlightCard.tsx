import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CategoryHighlightCardProps {
  title: string;
  titleIcon?: ReactNode;
  mainValue: string;
  highlightValue: string;
  highlightLabel: string;
  description?: string;
  className?: string;
  'data-testid'?: string;
}

export function CategoryHighlightCard({
  title,
  titleIcon,
  mainValue,
  highlightValue,
  highlightLabel,
  description,
  className,
  'data-testid': testId,
}: CategoryHighlightCardProps) {
  return (
    <Card className={cn('p-4', className)} data-testid={testId}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {titleIcon && <div className="text-muted-foreground">{titleIcon}</div>}
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
      </div>
      
      <div className="mb-3">
        <h4 className="text-2xl sm:text-3xl font-bold text-foreground leading-none mb-2">
          {mainValue}
        </h4>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold text-foreground">{highlightValue}</span>
          <span className="text-xs text-muted-foreground">{highlightLabel}</span>
        </div>
      </div>

      {description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </Card>
  );
}
