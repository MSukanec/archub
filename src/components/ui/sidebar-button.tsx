import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarButtonProps {
  icon?: LucideIcon;
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
        "flex items-center w-full h-9 transition-colors px-2",
        "hover:bg-[var(--sidebar-hover-bg)]",
        isActive
          ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]"
          : "text-[var(--sidebar-text)]",
        className,
      )}
    >
      {/* Icono siempre visible */}
      {Icon && (
        <Icon
          className="flex-shrink-0 w-[18px] h-[18px]"
        />
      )}
      {!Icon && (
        <div
          className="flex-shrink-0 w-[18px] h-[18px]"
        />
      )}

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
