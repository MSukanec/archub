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
          size="sm"
          className={cn(
            "h-auto w-auto p-1 rounded-full hover:bg-transparent",
            className
          )}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          tabIndex={-1}
        >
          <HelpCircle 
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
          {title && (
              {title}
            </h4>
          )}
          
            {description}
          </p>
          
          {(primaryActionText || secondaryActionText) && (
              {secondaryActionText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSecondaryAction}
                >
                  {secondaryActionText}
                </Button>
              )}
              
              {primaryActionText && (
                <Button
                  size="sm"
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