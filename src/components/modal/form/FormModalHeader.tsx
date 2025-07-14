import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormModalHeaderProps {
  title?: string;
  icon?: ReactNode;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  className?: string;
}

export function FormModalHeader({
  title,
  icon,
  leftActions,
  rightActions,
  className,
}: FormModalHeaderProps) {
  return (
    <div className={cn("px-4 py-3 flex items-center justify-between border-b border-[var(--card-border)] min-h-[56px]", className)}>
      <div className="flex items-center gap-2">
        {leftActions}
        {title && (
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-sm font-medium text-foreground">{title}</h2>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {rightActions}
      </div>
    </div>
  );
}