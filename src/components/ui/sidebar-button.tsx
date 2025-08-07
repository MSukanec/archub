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
        />
      )}
      {!Icon && (
        <div
        />
      )}

      {/* Texto que se desliza como en Supabase */}
      <span
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
