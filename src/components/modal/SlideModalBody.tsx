import React from 'react';
import { cn } from '@/lib/utils';

interface SlideModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export default function SlideModalBody({
  children,
  className
}: SlideModalBodyProps) {
  return (
    <div 
      className={cn(
        "px-6 py-4",
        "space-y-4",
        "overflow-y-auto",
        "scrollbar-hide",
        "flex-1",
        className
      )}
    >
      {children}
    </div>
  );
}