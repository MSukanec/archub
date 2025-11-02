import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { ComponentType } from "react";

interface MobileMenuButtonProps {
  icon: ComponentType<any>;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  showChevron?: boolean;
  disabled?: boolean;
  testId?: string;
}

export function MobileMenuButton({
  icon: Icon,
  label,
  onClick,
  isActive = false,
  showChevron = false,
  disabled = false,
  testId,
}: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        "border-b border-[var(--card-border)]",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "active:bg-[var(--card-hover-bg)]"
      )}
    >
      <Icon 
        className={cn(
          "h-5 w-5 flex-shrink-0",
          isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
        )} 
      />
      <span 
        className={cn(
          "flex-1 text-base",
          isActive ? "text-[var(--text-default)] font-medium" : "text-[var(--text-default)]"
        )}
      >
        {label}
      </span>
      {showChevron && (
        <ChevronRight 
          className={cn(
            "h-5 w-5 flex-shrink-0",
            isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          )} 
        />
      )}
    </button>
  );
}
