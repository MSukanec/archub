import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalloutButton {
  label: string;
  onClick: (e?: React.MouseEvent) => void;
}

interface CalloutProps {
  icon?: LucideIcon;
  title?: string;
  children?: React.ReactNode;
  text?: string;
  button?: CalloutButton;
  buttons?: CalloutButton[];
  backgroundColor?: string;
  onClose?: () => void;
  className?: string;
  onClick?: () => void;
}

export function Callout({ 
  icon: Icon, 
  title, 
  children, 
  text,
  button,
  buttons,
  backgroundColor,
  onClose,
  className,
  onClick 
}: CalloutProps) {
  const [isClosed, setIsClosed] = useState(false);
  const allButtons = buttons || (button ? [button] : []);
  const isVolumetric = !!backgroundColor || !!text || allButtons.length > 0 || !!onClose;
  
  if (isVolumetric) {
    if (isClosed) return null;

    return (
      <div
        className={cn(
          "relative w-full rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-lg transition-all",
          "hover:shadow-xl",
          onClick && "cursor-pointer",
          className
        )}
        style={{
          backgroundColor: backgroundColor || 'var(--neutral)'
        }}
        onClick={onClick}
      >
        <div className="flex items-center gap-3 flex-1">
          {Icon && (
            <Icon className="h-4 w-4 text-white flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-white">
            {text || children}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {allButtons.map((btn, index) => (
            <Button
              key={index}
              size="sm"
              variant="ghost"
              className="h-7 px-3 text-white bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                btn.onClick(e);
              }}
            >
              {btn.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-white hover:bg-white/20 transition-colors rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              if (onClose) {
                onClose();
              } else {
                setIsClosed(true);
              }
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

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