import { LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarButtonProps {
  icon: LucideIcon
  label: string
  href?: string
  onClick?: () => void
  isExpanded: boolean
  className?: string
}

export function SidebarButton({ 
  icon: Icon, 
  label, 
  href, 
  onClick, 
  isExpanded,
  className 
}: SidebarButtonProps) {
  const [location, navigate] = useLocation();
  
  const isActive = href && location === href;
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  return (
    <button
      className={cn(
        'group/button relative flex items-center w-full h-8 rounded-md transition-all duration-300 ease-in-out',
        isActive 
          ? 'bg-muted text-foreground font-semibold' 
          : 'hover:bg-muted transition-colors',
        className
      )}
      onClick={handleClick}
      title={label}
    >
      {/* Icon container - fixed position */}
      <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      
      {/* Label - appears when expanded */}
      {isExpanded && (
        <span className="ml-2 text-sm whitespace-nowrap overflow-hidden">
          {label}
        </span>
      )}
    </button>
  );
}