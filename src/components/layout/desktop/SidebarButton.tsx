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
  disableHover = false
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
          'relative flex items-center justify-center transition-all duration-300',
          // Botón SIEMPRE 32x32px (w-8 h-8), SIEMPRE centrado
          'w-8 h-8',
          // Cuando expandido, el botón se extiende al full width SIN PADDING
          isExpanded && 'w-full justify-start'
        )}
        onClick={handleClick}
        onMouseEnter={(e) => {
          handleMouseEnter();
          if (!isActive && !disableHover) {
            e.currentTarget.style.backgroundColor = `var(--main-sidebar-button-hover-bg)`; // Usar siempre main
            e.currentTarget.style.color = `var(--main-sidebar-button-hover-fg)`; // Usar siempre main
          }
        }}
        style={{ 
        borderRadius: '4px', // All buttons have 4px rounded corners
        backgroundColor: isActive && !isExpanded
          ? `var(--main-sidebar-bg)` // Botón activo del sidebar primario usa color del secundario
          : (isActive || isHeaderButton)
          ? `var(--main-sidebar-button-active-bg)` // Header buttons también usan active bg
          : `var(--main-sidebar-button-bg)`,
        color: (isActive || isHeaderButton)
          ? `var(--main-sidebar-button-active-fg)` // Header buttons también usan active fg
          : `var(--main-sidebar-button-fg)`,
        '--hover-bg': `var(--main-sidebar-button-hover-bg)`, // Usar siempre las variables main para consistencia
        '--hover-fg': `var(--main-sidebar-button-hover-fg)` // Usar siempre las variables main para consistencia
      } as React.CSSProperties}
      onMouseLeave={(e) => {
        if (!isActive && !disableHover) {
          e.currentTarget.style.backgroundColor = `var(--main-sidebar-button-bg)`; // Usar siempre main
          e.currentTarget.style.color = `var(--main-sidebar-button-fg)`; // Usar siempre main
        }
      }}
    >
      {/* Contenedor del icono - SIEMPRE centrado en 32x32px, no mostrar para hijos o cuando es header ARCHUB */}
      {!isChild && !(isHeaderButton && icon === null) && (
        <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center flex-shrink-0">
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
                backgroundColor: 'transparent',
                borderColor: (isActive || isHeaderButton)
                  ? `var(--main-sidebar-button-active-fg)`
                  : `var(--main-sidebar-button-fg)`,
                color: (isActive || isHeaderButton)
                  ? `var(--main-sidebar-button-active-fg)`
                  : `var(--main-sidebar-button-fg)`
              }}
            >
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
          isChild ? "ml-2" : 
          (isHeaderButton && icon === null) ? "ml-2" : // Sin margen para ARCHUB
          "ml-10" // Más margen para separar del icono
        )}>
          <span className={cn(
            "text-sm whitespace-nowrap text-left transition-opacity duration-300 delay-100",
            isHeaderButton ? "font-bold" : "font-normal" // Negrita solo para botones header
          )}>
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