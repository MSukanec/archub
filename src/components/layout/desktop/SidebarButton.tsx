import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  onClick?: () => void;
  href?: string;
  avatarUrl?: string;
  rightIcon?: React.ReactNode;
  isChild?: boolean;
  variant?: 'main' | 'secondary';
}

export default function SidebarButton({ 
  icon, 
  label, 
  isActive, 
  isExpanded, 
  onClick,
  href,
  avatarUrl,
  rightIcon,
  isChild = false,
  variant = 'main'
}: SidebarButtonProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };
  return (
    <div className="relative group">
      <button
        className={cn(
          'relative flex items-center transition-all duration-300 h-8',
          // When collapsed: 32px width, when expanded: full width
          isExpanded ? 'w-full' : 'w-8'
        )}
        onClick={handleClick}
        style={{ 
        borderRadius: variant === 'main' && isActive ? '4px 0 0 4px' : '4px', // Remove right border radius for active main buttons
        backgroundColor: isActive 
          ? `var(--${variant}-sidebar-button-active-bg)` 
          : `var(--${variant}-sidebar-button-bg)`,
        color: isActive 
          ? `var(--${variant}-sidebar-button-active-fg)` 
          : `var(--${variant}-sidebar-button-fg)`,
        '--hover-bg': `var(--${variant}-sidebar-button-hover-bg)`,
        '--hover-fg': `var(--${variant}-sidebar-button-hover-fg)`,
        // Extend active main buttons to overlap the border
        ...(variant === 'main' && isActive && {
          width: 'calc(100% + 1px)',
          marginRight: '-1px',
          zIndex: 10,
          borderRight: `1px solid var(--${variant}-sidebar-button-active-bg)`
        })
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = `var(--${variant}-sidebar-button-hover-bg)`;
          e.currentTarget.style.color = `var(--${variant}-sidebar-button-hover-fg)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = `var(--${variant}-sidebar-button-bg)`;
          e.currentTarget.style.color = `var(--${variant}-sidebar-button-fg)`;
        }
      }}
    >
      {/* Contenedor del icono - SIEMPRE en posición fija, no se mueve */}
      {!isChild && (
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Avatar"
              className="w-[18px] h-[18px] rounded-full"
            />
          ) : (
            icon
          )}
        </div>
      )}
      
      {/* Texto - aparece después del icono cuando expandido */}
      {isExpanded && (
        <div className={cn(
          "flex items-center justify-between flex-1 ml-0",
          isChild && "ml-2" // Solo margen para elementos hijos
        )}>
          <span className={cn(
            "text-sm whitespace-nowrap text-left transition-opacity duration-300 delay-100",
            variant === 'main' ? "font-medium" : "font-normal"
          )}>
            {label}
          </span>
          {rightIcon && (
            <div className="flex-shrink-0 ml-2">
              {rightIcon}
            </div>
          )}
        </div>
      )}
      </button>
      
      {/* Tooltip for main sidebar buttons when collapsed */}
      {variant === 'main' && !isExpanded && (
        <div className="absolute left-10 top-1/2 transform -translate-y-1/2 bg-black text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </div>
  );
}