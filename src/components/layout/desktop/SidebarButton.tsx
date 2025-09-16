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
          'relative flex items-center transition-all duration-200 ease-out overflow-hidden',
          // Botón SIEMPRE del ancho completo disponible, altura fija 32px
          'w-full h-8',
          // Alineación condicional: centrado cuando colapsado, al inicio cuando expandido
          isExpanded ? 'justify-start pr-2' : 'justify-center px-0'
        )}
        onClick={handleClick}
        onMouseEnter={(e) => {
          handleMouseEnter();
          setIsHovered(true);
          if (!isActive && !disableHover) {
            const hoverBgVar = variant === 'secondary' ? 'var(--main-sidebar-button-hover-bg)' : 'var(--main-sidebar-button-hover-bg)';
            const hoverFgVar = variant === 'secondary' ? 'var(--main-sidebar-button-hover-fg)' : 'var(--main-sidebar-button-hover-fg)';
            e.currentTarget.style.backgroundColor = hoverBgVar;
            e.currentTarget.style.color = hoverFgVar;
          }
        }}
        style={{ 
        borderRadius: '6px', // Supabase-style rounded corners
        backgroundColor: isActive && !isExpanded
          ? `var(--main-sidebar-bg)` // Botón activo del sidebar primario usa color del secundario
          : isActive
          ? (variant === 'secondary' ? `var(--main-sidebar-button-hover-bg)` : `var(--main-sidebar-button-active-bg)`) // Usar hover para activo en sidebar secundario
          : (variant === 'secondary' ? `var(--main-sidebar-button-bg)` : `var(--main-sidebar-button-bg)`),
        color: isActive
          ? (variant === 'secondary' ? `var(--main-sidebar-button-hover-fg)` : `var(--main-sidebar-button-active-fg)`) // Usar hover para activo en sidebar secundario
          : (variant === 'secondary' ? `var(--main-sidebar-button-fg)` : `var(--main-sidebar-button-fg)`),
        '--hover-bg': variant === 'secondary' ? `var(--main-sidebar-button-hover-bg)` : `var(--main-sidebar-button-hover-bg)`,
        '--hover-fg': variant === 'secondary' ? `var(--main-sidebar-button-hover-fg)` : `var(--main-sidebar-button-hover-fg)`
      } as React.CSSProperties}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (!isActive && !disableHover) {
          const normalBgVar = variant === 'secondary' ? 'var(--main-sidebar-button-bg)' : 'var(--main-sidebar-button-bg)';
          const normalFgVar = variant === 'secondary' ? 'var(--main-sidebar-button-fg)' : 'var(--main-sidebar-button-fg)';
          e.currentTarget.style.backgroundColor = normalBgVar;
          e.currentTarget.style.color = normalFgVar;
        }
      }}
    >
      {/* Contenedor del icono - EXACTAMENTE como Supabase: 32x32px perfectamente centrado */}
      {!isChild && !(isHeaderButton && icon === null) && (
        <div className={cn(
          "absolute top-0 flex items-center justify-center flex-shrink-0",
          "w-8 h-8", // 32x32px como Supabase
          "left-1" // Siempre a 4px del borde izquierdo como en Supabase
        )}>
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
      
      {/* Texto - solo cuando expandido (SIN animaciones complicadas) */}
      {(isExpanded || (isHeaderButton && (isHovered || isActive))) && (
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