import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useState, useRef } from "react";

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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  const handleMouseEnter = () => {
    if (buttonRef.current && variant === 'main' && !isExpanded) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8
      });
    }
  };
  return (
    <div className="relative group">
      <button
        ref={buttonRef}
        className={cn(
          'relative flex items-center transition-all duration-300',
          // Botón SIEMPRE 32x32px (w-8 h-8), centrado cuando colapsado
          'w-8 h-8',
          // Cuando expandido, el botón se extiende al full width SIN PADDING
          isExpanded && 'w-full'
        )}
        onClick={handleClick}
        onMouseEnter={(e) => {
          handleMouseEnter();
          if (!isActive) {
            e.currentTarget.style.backgroundColor = `var(--${variant}-sidebar-button-hover-bg)`;
            e.currentTarget.style.color = `var(--${variant}-sidebar-button-hover-fg)`;
          }
        }}
        style={{ 
        borderRadius: '4px', // All buttons have 4px rounded corners
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
        <div 
          className="fixed bg-black text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            transform: 'translateY(-50%)',
            zIndex: 999999
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}