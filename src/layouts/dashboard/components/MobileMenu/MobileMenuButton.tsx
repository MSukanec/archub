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
  badgeCount?: number;
}
export function MobileMenuButton({
  icon: Icon,
  label,
  onClick,
  isActive = false,
  showChevron = false,
  disabled = false,
  testId,
  badgeCount,
}: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 text-left transition-colors relative",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && !isActive && "hover:bg-[var(--mobile-menu-item-active-bg)]",
        isActive && "bg-[var(--mobile-menu-item-active-bg)]"
      )}
    >
      <div className="relative flex-shrink-0">
        <Icon 
          className={cn(
            "h-5 w-5 transition-colors",
            isActive ? "text-[var(--mobile-menu-item-active-icon)]" : "text-[var(--mobile-menu-item-fg)]"
          )} 
        />
        {badgeCount !== undefined && badgeCount > 0 && (
          <span 
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-[var(--accent)]"
          >
            {badgeCount > 99 ? '99+': badgeCount}
          </span>
        )}
      </div>
      <span 
        className={cn(
          "flex-1 text-base transition-colors",
          isActive ? "text-[var(--mobile-menu-item-active-fg)] font-medium" : "text-[var(--mobile-menu-item-fg)]"
        )}
      >
        {label}
      </span>
      {showChevron && (
        <ChevronRight 
          className={cn(
            "h-5 w-5 flex-shrink-0 transition-colors",
            isActive ? "text-[var(--mobile-menu-item-active-icon)]" : "text-[var(--mobile-menu-item-fg)]"
          )} 
        />
      )}
    </button>
  );
}
