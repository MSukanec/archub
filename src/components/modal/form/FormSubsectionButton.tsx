import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormSubsectionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export function FormSubsectionButton({
  icon,
  title,
  description,
  onClick,
  className,
  disabled = false
}: FormSubsectionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={cn(
        "group relative w-full transition-all duration-200",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Button */}
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200",
          "text-left bg-background hover:bg-accent/5",
          "border-dashed border-border hover:border-accent",
          "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border",
          isHovered && !disabled && "border-accent shadow-sm"
        )}
      >
        {/* Icon */}
        <div 
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200",
            "bg-muted text-muted-foreground",
            isHovered && !disabled && "bg-accent/10 text-accent"
          )}
        >
          <div className="w-5 h-5 [&>svg]:w-5 [&>svg]:h-5">
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-sm transition-colors duration-200",
            "text-foreground",
            isHovered && !disabled && "text-accent"
          )}>
            {title}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {description}
          </div>
        </div>
      </button>

      {/* Hover Add Button */}
      <div className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-200",
        "opacity-0 translate-x-2 pointer-events-none",
        isHovered && !disabled && "opacity-100 translate-x-0 pointer-events-auto"
      )}>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}