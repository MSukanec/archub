import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CalloutProps {
  icon?: LucideIcon;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Callout({ 
  icon: Icon, 
  title, 
  children, 
  className,
  onClick 
}: CalloutProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      className={cn(
        "relative w-full rounded-lg border border-accent bg-accent/10 p-4",
        onClick && "cursor-pointer hover:bg-accent/15 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <Icon className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0 text-left">
          {title && (
            <h4 className="font-medium text-foreground mb-1 text-left">{title}</h4>
          )}
          <div className="text-sm text-muted-foreground text-left">
            {children}
          </div>
        </div>
      </div>
    </Component>
  );
}