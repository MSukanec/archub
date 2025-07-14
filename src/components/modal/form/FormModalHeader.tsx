import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormModalHeaderProps {
  title?: string;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  className?: string;
}

export function FormModalHeader({
  title,
  leftActions,
  rightActions,
  className,
}: FormModalHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2">
        {leftActions}
        {title && (
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {rightActions}
      </div>
    </div>
  );
}