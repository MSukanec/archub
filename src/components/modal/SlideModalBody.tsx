import React from 'react';
import { cn } from '@/lib/utils';

interface SlideModalBodyProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export default function SlideModalBody({
  children,
  className,
  maxHeight = "70vh"
}: SlideModalBodyProps) {
  return (
    <div 
      className={cn(
        "px-4 py-2",
        "overflow-y-auto scrollbar-hide",
        "bg-[var(--card-bg)]",
        "flex-1",
        className
      )}
      style={{
        maxHeight: maxHeight
      }}
    >
      {children}
    </div>
  );
}