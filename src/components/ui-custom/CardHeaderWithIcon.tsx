import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardHeaderWithIconProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function CardHeaderWithIcon({ 
  icon: Icon, 
  title, 
  description, 
  className 
}: CardHeaderWithIconProps) {
  return (
    <div className={cn("px-4 py-3 border-b border-[var(--card-border)]", className)}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
        <div className="flex-1">
          <h2 className="text-sm font-medium text-[var(--card-fg)]">{title}</h2>
          {description && (
            <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}