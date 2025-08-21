import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpPopoverProps {
  title?: string;
  description: string;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  iconSize?: number;
  placement?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function HelpPopover({
  title,
  description,
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  iconSize = 18,
  placement = "bottom",
  className
}: HelpPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrimaryAction = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    }
    setIsOpen(false);
  };

  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            "h-auto w-auto p-1 rounded-full hover:bg-transparent",
            className
          )}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          tabIndex={-1}
        >
          <HelpCircle 
            className="text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
            size={iconSize} 
          />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent
        side={placement}
        align="center"
        className={cn(
          "w-80 p-4 z-[9999]",
          "bg-[var(--popover-bg)] text-[var(--popover-fg)] border-[var(--popover-border)]",
          "rounded-xl shadow-xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="space-y-3">
          {title && (
            <h4 className="font-semibold text-sm leading-none">
              {title}
            </h4>
          )}
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
          
          {(primaryActionText || secondaryActionText) && (
            <div className="flex items-center justify-end gap-2 pt-2">
              {secondaryActionText && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:underline"
                  onClick={handleSecondaryAction}
                >
                  {secondaryActionText}
                </Button>
              )}
              
              {primaryActionText && (
                <Button
                  size="icon-sm"
                  className="h-8 px-4 text-xs"
                  onClick={handlePrimaryAction}
                >
                  {primaryActionText}
                </Button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}