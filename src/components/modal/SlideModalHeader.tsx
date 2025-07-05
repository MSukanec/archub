import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideModalHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
}

export default function SlideModalHeader({
  title,
  showBack = false,
  onBack,
  onClose,
  className
}: SlideModalHeaderProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4",
        "border-b border-[var(--card-border)]",
        "bg-[var(--card-bg)]",
        "relative z-10",
        "min-h-[60px]",
        className
      )}
    >
      {/* Left side - Back button or spacer */}
      <div className="flex items-center min-w-[40px]">
        {showBack && onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0 rounded-full hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Center - Title */}
      <div className="flex-1 text-center px-4">
        {title && (
          <h2 className="text-lg font-semibold text-[var(--foreground)] truncate">
            {title}
          </h2>
        )}
      </div>

      {/* Right side - Close button */}
      <div className="flex items-center justify-end min-w-[40px]">
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-[var(--muted)] transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}