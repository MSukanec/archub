import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FormModalHeaderProps {
  title?: string;
  description?: string; // Agregando descripción como en el legacy
  icon?: LucideIcon;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  className?: string;
}

export function FormModalHeader({
  title,
  description,
  icon: Icon,
  leftActions,
  rightActions,
  className,
}: FormModalHeaderProps) {
  return (
    <div className={cn("px-3 py-3 flex items-center justify-between border-b border-[var(--card-border)]", className)}>
      <div className="flex items-center gap-2 flex-1">
        {leftActions}
        {title && (
          <div className="flex items-center gap-2 flex-1 pr-2">
            {Icon && (
              <Icon className="h-4 w-4 text-[var(--accent)]" />
            )}
            <div className="flex-1">
              <h2 className="text-sm font-medium text-[var(--card-fg)]">{title}</h2>
              {description && (
                <p className="text-xs text-[var(--text-muted)] leading-tight">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {rightActions}
      </div>
    </div>
  );
}