import React from 'react';
import { cn } from '@/lib/utils';

export interface CustomModalBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  columns?: 1 | 2;
}

export function CustomModalBody({ 
  children, 
  className, 
  padding = 'md',
  columns = 2 
}: CustomModalBodyProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  const gridClasses = columns === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2';

  return (
    <div
      className={cn(
        "overflow-y-auto max-h-[60vh]",
        paddingClasses[padding],
        className
      )}
    >
      <div className={cn("grid gap-4", gridClasses)}>
        {children}
      </div>
    </div>
  );
}

export default CustomModalBody;