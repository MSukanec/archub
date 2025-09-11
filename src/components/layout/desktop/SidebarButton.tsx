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
          'relative flex items-center justify-center transition-[width] duration-150 ease-in-out overflow-hidden',
          // Botón SIEMPRE 32x32px (w-8 h-8), SIEMPRE centrado
          'w-8 h-8',
          // Cuando expandido o cuando es header button en hover, el botón se extiende
          (isExpanded || (isHeaderButton && (isHovered || isActive))) && 'w-auto justify-start pr-3'
        )}
        style={{
          minWidth: '32px' // Asegurar tamaño mínimo
        }}
        onClick={handleClick}
        onMouseEnter={(e) => {
          handleMouseEnter();
          setIsHovered(true);
          if (!isActive && !disableHover) {
            if (isHeaderButton) {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
              e.currentTarget.style.color = 'white';
            } else {
              const hoverBgVar = variant === 'secondary' ? 'var(--secondary-sidebar-button-hover-bg)' : 'var(--main-sidebar-button-hover-bg)';
              const hoverFgVar = variant === 'secondary' ? 'var(--secondary-sidebar-button-hover-fg)' : 'var(--main-sidebar-button-hover-fg)';
              e.currentTarget.style.backgroundColor = hoverBgVar;
              e.currentTarget.style.color = hoverFgVar;
            }
          }
        }}
        style={{ 
        borderRadius: '4px', // All buttons have 4px rounded corners
        backgroundColor: isActive || (isHeaderButton && isHovered)
          ? `var(--accent)`
          : (variant === 'secondary' ? `var(--secondary-sidebar-button-bg)` : `var(--main-sidebar-button-bg)`),
        color: isActive || (isHeaderButton && isHovered)
          ? `white`
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
      {/* Contenedor del icono - no mostrar para hijos o cuando es header ARCHUB */}
      {!isChild && !(isHeaderButton && icon === null) && (
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
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
                  ? `white`
                  : `currentColor`,
                color: projectColor 
                  ? 'white' 
                  : isActive || (isHeaderButton && isHovered)
                  ? `white`
                  : `currentColor`
              }}
            >
              {userFullName.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          ) : (
            icon
          )}
        </div>
      )}
      
      {/* Texto - solo cuando está expandido/hover para evitar problemas de animación */}
      {(isExpanded || (isHeaderButton && (isHovered || isActive))) && (
        <div 
          className={cn(
            "flex items-center justify-between whitespace-nowrap",
            isChild ? "ml-2" : 
            (isHeaderButton && icon === null) ? "ml-2" : // Sin margen para ARCHUB
            "ml-2" // Menos margen para mejor ajuste
          )}
        >
          <span className={cn(
            "text-sm text-left select-none",
            isHeaderButton ? "font-bold" : "font-normal"
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