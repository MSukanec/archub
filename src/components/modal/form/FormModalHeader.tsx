import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormModalHeaderProps {
  title?: string;
  rightContent?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function FormModalHeader({
  title,
  rightContent,
  onClose,
  className,
}: FormModalHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between p-4 border-b border-border", className)}>
      <div className="flex-1">
        {title && (
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {rightContent}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}