import React from 'react';
import { cn } from '@/lib/utils';

interface SlideModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export default function SlideModalFooter({
  children,
  className
}: SlideModalFooterProps) {
  return (
    <div 
      className={cn(
        "p-4",
        "border-t border-[var(--card-border)]",
        "bg-[var(--card-bg)]",
        "flex gap-2",
        "items-center justify-end",
        "min-h-[60px]",
        className
      )}
    >
      {children}
    </div>
  );
}