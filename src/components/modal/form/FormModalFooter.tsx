import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormModalFooterProps {
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function FormModalFooter({
  leftActions,
  rightActions,
  children,
  className,
}: FormModalFooterProps) {
  return (
    <div className={cn("p-2 border-t border-[var(--card-border)] mt-auto", className)}>
      {children ? (
        children
      ) : (
        <div className="flex gap-2 w-full">
          <div className="w-1/4">
            {leftActions}
          </div>
          <div className="w-3/4">
            {rightActions}
          </div>
        </div>
      )}
    </div>
  );
}