import { cn } from "@/lib/utils";
import { type ReactElement, cloneElement, isValidElement } from "react";

interface SidebarIconButtonProps {
  icon: ReactElement;
  isActive?: boolean;
  onClick?: () => void;
  badge?: number;
  title?: string;
  testId?: string;
  className?: string;
}

export function SidebarIconButton({
  icon,
  isActive = false,
  onClick,
  badge,
  title,
  testId,
  className,
}: SidebarIconButtonProps) {
  const baseColor = isActive ? 'var(--accent)' : 'var(--main-sidebar-fg)';
  
  const enhancedIcon = isValidElement(icon)
    ? cloneElement(icon, {
        className: cn(icon.props.className, "sidebar-icon-managed transition-colors"),
        style: {
          ...((icon.props as any).style || {}),
          color: baseColor,
          stroke: 'currentColor',
          fill: 'currentColor',
        },
      } as any)
    : icon;

  return (
    <button
      onClick={onClick}
      title={title}
      data-testid={testId}
      className={cn(
        "h-8 w-8 rounded-md cursor-pointer transition-colors flex items-center justify-center group relative",
        "hover:bg-[var(--main-sidebar-button-hover-bg)]",
        isActive && "bg-[var(--main-sidebar-button-active-bg)]",
        className
      )}
    >
      <div className="h-5 w-5 flex items-center justify-center">
        {enhancedIcon}
      </div>
      
      {badge !== undefined && badge > 0 && (
        <span 
          className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white border-0"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}
