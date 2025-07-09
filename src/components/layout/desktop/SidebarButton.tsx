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
    <button
      className={cn(
        'relative flex items-center transition-all duration-300',
        // Botón SIEMPRE 32x32px (w-8 h-8), centrado cuando colapsado
        'w-8 h-8',
        // Cuando expandido, el botón se extiende pero el icono queda fijo
        isExpanded && 'w-full'
      )}
      onClick={handleClick}
      title={!isExpanded ? label : undefined}
      style={{ 
        borderRadius: '4px',
        backgroundColor: isActive 
          ? `var(--${variant}-sidebar-button-active-bg)` 
          : `var(--${variant}-sidebar-button-bg)`,
        color: isActive 
          ? `var(--${variant}-sidebar-button-active-fg)` 
          : `var(--${variant}-sidebar-button-fg)`,
        '--hover-bg': `var(--${variant}-sidebar-button-hover-bg)`,
        '--hover-fg': `var(--${variant}-sidebar-button-hover-fg)`
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
      {/* Contenedor del icono - SIEMPRE centrado en 32x32px, no mostrar para hijos */}
      {!isChild && (
        <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
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
      
      {/* Texto - solo cuando expandido */}
      {isExpanded && (
        <div className={cn(
          "flex items-center justify-between w-full",
          isChild ? "ml-2" : "ml-8" // Menos margen para elementos hijos
        )}>
          <span className="text-sm font-medium whitespace-nowrap text-left transition-opacity duration-300 delay-100">
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
  );
}