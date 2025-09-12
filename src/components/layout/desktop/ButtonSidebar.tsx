import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import React from "react";

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
  isHeaderButton?: boolean;
  projectColor?: string;
  disableHover?: boolean;
  onButtonHover?: (isHovered: boolean) => void;
  onButtonActive?: (isActive: boolean) => void;
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
  variant = 'main',
  isHeaderButton = false,
  projectColor,
  disableHover = false,
  onButtonHover,
  onButtonActive
}: SidebarButtonProps) {
  const [, navigate] = useLocation();
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Llamar onButtonActive cuando el estado activo cambia
  React.useEffect(() => {
    onButtonActive?.(isActive);
  }, [isActive, onButtonActive]);

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
          'relative flex items-center justify-center transition-all duration-200 ease-out overflow-hidden',
          // Botón SIEMPRE 32x32px (w-8 h-8), SIEMPRE centrado
          'w-8 h-8',
          // Cuando expandido o cuando es header button en hover, el botón se extiende
          (isExpanded || (isHeaderButton && (isHovered || isActive))) && 'w-full justify-start pr-2'
        )}
        onClick={handleClick}
        onMouseEnter={(e) => {
          handleMouseEnter();
          setIsHovered(true);
          onButtonHover?.(true);
        }}
        style={{ 
          borderRadius: '4px',
          backgroundColor: 'transparent', // Sin fondo
          color: (variant === 'secondary' ? `var(--secondary-sidebar-button-fg)` : `var(--main-sidebar-button-fg)`)
        } as React.CSSProperties}
        onMouseLeave={(e) => {
          setIsHovered(false);
          onButtonHover?.(false);
        }}
      >
      
      {/* Contenedor del icono - SIEMPRE centrado en 32x32px, no mostrar para hijos o cuando es header ARCHUB */}
      {!isChild && !(isHeaderButton && icon === null) && (
        <div 
          className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0 transition-colors duration-200"
          style={{
            color: (isActive || isHovered) 
              ? 'var(--accent)' 
              : (variant === 'secondary' ? `var(--secondary-sidebar-button-fg)` : `var(--main-sidebar-button-fg)`)
          }}
        >
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Avatar"
              className="w-[28px] h-[28px] rounded-full"
            />
          ) : userFullName ? (
            <div 
              className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-xs font-medium border"
              style={{ 
                backgroundColor: projectColor || 'transparent',
                borderColor: projectColor 
                  ? 'transparent' 
                  : (isActive || isHovered)
                  ? `var(--accent)`
                  : (variant === 'secondary' ? `var(--secondary-sidebar-button-fg)` : `var(--main-sidebar-button-fg)`),
                color: projectColor 
                  ? 'white' 
                  : (isActive || isHovered)
                  ? `var(--accent)`
                  : (variant === 'secondary' ? `var(--secondary-sidebar-button-fg)` : `var(--main-sidebar-button-fg)`)
              }}
            >
              {userFullName.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          ) : (
            icon
          )}
        </div>
      )}
      
      {/* Texto - solo cuando expandido (SIN animaciones complicadas) */}
      {(isExpanded || (isHeaderButton && (isHovered || isActive))) && (
        <div className={cn(
          "flex items-center justify-between w-full",
          isChild ? "ml-2" : 
          (isHeaderButton && icon === null) ? "ml-2" : // Sin margen para ARCHUB
          "ml-10" // Más margen para separar del icono
        )}>
          <span 
            className={cn(
              "text-sm whitespace-nowrap text-left transition-all duration-200",
              isHeaderButton ? "font-bold" : "font-normal" // Negrita solo para botones header
            )}
            style={{
              color: (isActive || isHovered) ? '#000000' : 'inherit'
            }}
          >
            {label}
          </span>
          {rightIcon && (
            <div className="flex-shrink-0 ml-2 mr-2">
              {rightIcon}
            </div>
          )}
        </div>
      )}
      </button>
      

    </div>
  );
}