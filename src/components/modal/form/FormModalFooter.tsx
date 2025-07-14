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
    <div className={cn("flex items-center justify-between", className)}>
      {children ? (
        children
      ) : (
        <>
          <div className="flex items-center gap-2">
            {leftActions}
          </div>
          <div className="flex items-center gap-2">
            {rightActions}
          </div>
        </>
      )}
    </div>
  );
}