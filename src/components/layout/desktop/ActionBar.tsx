import React from 'react';

interface ActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function ActionBar({ children, className = "" }: ActionBarProps) {
  return (
    <div className={`flex items-center gap-3 p-4 border-b bg-background/50 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}