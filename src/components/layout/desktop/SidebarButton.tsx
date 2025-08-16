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
  userFullName?: string | null;
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
  userFullName,
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
            e.currentTarget.style.backgroundColor = `var(--main-sidebar-button-hover-bg)`; // Usar siempre main
            e.currentTarget.style.color = `var(--main-sidebar-button-hover-fg)`; // Usar siempre main
          }
        }}
        style={{ 
        borderRadius: '4px', // All buttons have 4px rounded corners
        backgroundColor: isActive 
          ? `var(--main-sidebar-button-active-bg)` // Usar siempre las variables main para consistencia
          : `var(--main-sidebar-button-bg)`,
        color: isActive 
          ? `var(--main-sidebar-button-active-fg)` // Usar siempre las variables main para consistencia
          : `var(--main-sidebar-button-fg)`,
        '--hover-bg': `var(--main-sidebar-button-hover-bg)`, // Usar siempre las variables main para consistencia
        '--hover-fg': `var(--main-sidebar-button-hover-fg)`, // Usar siempre las variables main para consistencia
        // Extend active main buttons to overlap the border
        ...(variant === 'main' && isActive && {
          width: 'calc(100% + 1px)',
          marginRight: '-1px',
          zIndex: 10,
          borderRight: `1px solid var(--main-sidebar-button-active-bg)` // Usar siempre main
        })
      } as React.CSSProperties}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = `var(--main-sidebar-button-bg)`; // Usar siempre main
          e.currentTarget.style.color = `var(--main-sidebar-button-fg)`; // Usar siempre main
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
              className="w-[28px] h-[28px] rounded-full"
            />
          ) : userFullName ? (
            <div className="w-[28px] h-[28px] rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-medium">
              {userFullName.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          ) : (
            icon
          )}
        </div>
      )}
      
      {/* Texto - solo cuando expandido */}
      {isExpanded && (
        <div className={cn(
          "flex items-center justify-between w-full",
          isChild ? "ml-2" : "ml-10" // Más margen para separar del icono
        )}>
          <span className={cn(
            "text-sm whitespace-nowrap text-left transition-opacity duration-300 delay-100",
            "font-normal" // Quitar negrita de todos los textos
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
      

    </div>
  );
}