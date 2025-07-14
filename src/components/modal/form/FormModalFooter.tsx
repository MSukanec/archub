import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormModalFooterProps {
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function FormModalFooter({
  leftContent,
  rightContent,
  children,
  className,
}: FormModalFooterProps) {
  return (
    <div className={cn("p-4 border-t border-border", className)}>
      {children ? (
        children
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {leftContent}
          </div>
          <div className="flex items-center gap-2">
            {rightContent}
          </div>
        </div>
      )}
    </div>
  );
}