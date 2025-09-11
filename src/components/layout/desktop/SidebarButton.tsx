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
  const [isHovered, setIsHovered] = useState(false);
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
          'flex items-center h-8 rounded transition-all duration-200 ease-out',
          // Cuando colapsado: centrado con padding lateral para el sidebar más ancho (52px)
          !isExpanded && !isHeaderButton ? 'w-[52px] justify-center px-4' : 
          // Cuando expandido: ancho completo, align left con padding
          'w-full justify-start px-2 gap-2',
          // Elementos hijos tienen más indentación cuando expandido
          isChild && isExpanded && 'pl-8'
        )}
        onClick={handleClick}
        onMouseEnter={(e) => {
          handleMouseEnter();
          setIsHovered(true);
          if (!isActive && !disableHover) {
            const hoverBgVar = variant === 'secondary' ? 'var(--secondary-sidebar-button-hover-bg)' : 'var(--main-sidebar-button-hover-bg)';
            const hoverFgVar = variant === 'secondary' ? 'var(--secondary-sidebar-button-hover-fg)' : 'var(--main-sidebar-button-hover-fg)';
            e.currentTarget.style.backgroundColor = hoverBgVar;
            e.currentTarget.style.color = hoverFgVar;
          }
        }}
        style={{ 
        borderRadius: '4px', // All buttons have 4px rounded corners
        backgroundColor: isActive && !isExpanded
          ? `var(--main-sidebar-bg)` // Botón activo del sidebar primario usa color del secundario
          : isActive
          ? (variant === 'secondary' ? `var(--secondary-sidebar-button-hover-bg)` : `var(--main-sidebar-button-active-bg)`) // Usar hover para activo en sidebar secundario
          : (variant === 'secondary' ? `var(--secondary-sidebar-button-bg)` : `var(--main-sidebar-button-bg)`),
        color: isActive
          ? (variant === 'secondary' ? `var(--secondary-sidebar-button-hover-fg)` : `var(--main-sidebar-button-active-fg)`) // Usar hover para activo en sidebar secundario
          : (variant === 'secondary' ? `var(--secondary-sidebar-button-fg)` : `var(--main-sidebar-button-fg)`),
        '--hover-bg': variant === 'secondary' ? `var(--secondary-sidebar-button-hover-bg)` : `var(--main-sidebar-button-hover-bg)`,
        '--hover-fg': variant === 'secondary' ? `var(--secondary-sidebar-button-hover-fg)` : `var(--main-sidebar-button-hover-fg)`
      } as React.CSSProperties}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (!isActive && !disableHover) {
          const normalBgVar = variant === 'secondary' ? 'var(--secondary-sidebar-button-bg)' : 'var(--main-sidebar-button-bg)';
          const normalFgVar = variant === 'secondary' ? 'var(--secondary-sidebar-button-fg)' : 'var(--main-sidebar-button-fg)';
          e.currentTarget.style.backgroundColor = normalBgVar;
          e.currentTarget.style.color = normalFgVar;
        }
      }}
    >
      {/* Icono - inline, no absolute positioning */}
      {!isChild && !(isHeaderButton && icon === null) && (
        <div className="inline-flex items-center justify-center w-5 h-5 shrink-0">
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
                  : isActive
                  ? `var(--main-sidebar-button-active-fg)`
                  : `var(--main-sidebar-button-fg)`,
                color: projectColor 
                  ? 'white' 
                  : isActive
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
      
      {/* Label - solo cuando expandido */}
      {(isExpanded || (isHeaderButton && (isHovered || isActive))) && (
        <span className={cn(
          "text-sm truncate",
          isHeaderButton ? "font-bold" : "font-normal"
        )}>
          {label}
        </span>
      )}
      
      {/* Right Icon - solo cuando expandido */}
      {rightIcon && (isExpanded || (isHeaderButton && (isHovered || isActive))) && (
        <div className="ml-auto shrink-0">
          {rightIcon}
        </div>
      )}
      </button>
      

    </div>
  );
}