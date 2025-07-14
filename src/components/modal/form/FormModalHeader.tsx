import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FormModalHeaderProps {
  title?: string;
  icon?: LucideIcon;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  className?: string;
}

export function FormModalHeader({
  title,
  icon: Icon,
  leftActions,
  rightActions,
  className,
}: FormModalHeaderProps) {
  return (
    <div className={cn("p-2 flex items-center justify-between border-b border-[var(--card-border)]", className)}>
      <div className="flex items-center gap-2">
        {leftActions}
        {title && (
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon className="h-4 w-4 text-[var(--accent)]" />
            )}
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