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
        "flex items-center w-full h-auto transition-colors px-3",
        "hover:bg-slate-100 dark:hover:bg-slate-700",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-slate-700 dark:text-slate-300",
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
        className="overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ml-2"
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
