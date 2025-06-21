import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUTTON_SIZE, ICON_SIZE } from "@/lib/constants/ui";

interface SidebarButtonProps {
  icon: LucideIcon;
  children?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  isExpanded?: boolean;
}

export function SidebarButton({
  icon: Icon,
  children,
  isActive = false,
  onClick,
  className,
  isExpanded = false,
}: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full h-auto transition-colors px-2",
        "hover:bg-[var(--sidebar-hover-bg)]",
        isActive
          ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]"
          : "text-[var(--sidebar-text)]",
        className,
      )}
      style={{
        height: `${BUTTON_SIZE}px`,
      }}
    >
      {/* Icono siempre visible */}
      <Icon
        className="flex-shrink-0"
        style={{
          width: `${ICON_SIZE}px`,
          height: `${ICON_SIZE}px`,
        }}
      />

      {/* Texto que se desliza como en Supabase */}
      <span
        className="text-xs font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ml-2"
        style={{
          maxWidth: isExpanded ? 160 : 0,
          opacity: isExpanded ? 1 : 0,
        }}
      >
        {children}
      </span>
    </button>
  );
}
