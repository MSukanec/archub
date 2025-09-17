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
          // SIN alineación condicional - el icono permanece ESTÁTICO como Supabase
          'justify-start'
        )}
        onClick={handleClick}
        onMouseEnter={(e) => {
          handleMouseEnter();
          setIsHovered(true);
          if (!isActive && !disableHover) {
            const hoverBgVar = variant === 'secondary' ? 'var(--main-sidebar-button-hover-bg)' : 'var(--main-sidebar-button-hover-bg)';
            e.currentTarget.style.backgroundColor = hoverBgVar;
            
            // Los colores ahora se manejan por estilos inline basados en isHovered
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
          ? (variant === 'secondary' ? `var(--main-sidebar-button-hover-text-fg)` : `var(--main-sidebar-button-active-text-fg)`) // Usar hover para activo en sidebar secundario
          : (variant === 'secondary' ? `var(--main-sidebar-button-text-fg)` : `var(--main-sidebar-button-text-fg)`),
        '--hover-bg': variant === 'secondary' ? `var(--main-sidebar-button-hover-bg)` : `var(--main-sidebar-button-hover-bg)`,
        '--hover-fg': variant === 'secondary' ? `var(--main-sidebar-button-hover-fg)` : `var(--main-sidebar-button-hover-fg)`
      } as React.CSSProperties}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (!isActive && !disableHover) {
          const normalBgVar = variant === 'secondary' ? 'var(--main-sidebar-button-bg)' : 'var(--main-sidebar-button-bg)';
          e.currentTarget.style.backgroundColor = normalBgVar;
          
          // Los colores ahora se manejan por estilos inline basados en isHovered
        }
      }}
    >
      {/* Contenedor del icono - EXACTAMENTE como Supabase: 32x32px perfectamente centrado */}
      {!isChild && !(isHeaderButton && icon === null) && (
        <div className={cn(
          "absolute top-0 flex items-center justify-center flex-shrink-0",
          "w-8 h-8", // 32x32px como Supabase
          "left-3" // Perfectamente centrado en 40px: (40-16)/2 = 12px como Supabase
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
            <div 
              data-icon
              style={{
                color: isActive
                  ? `var(--main-sidebar-button-active-icon-fg)`
                  : isHovered
                  ? `var(--main-sidebar-button-hover-icon-fg)`
                  : `var(--main-sidebar-button-icon-fg)`
              }}
            >
              {icon}
            </div>
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
            data-text
            className={cn(
              "text-sm whitespace-nowrap text-left transition-opacity duration-300 delay-100",
              isHeaderButton ? "font-bold" : "font-normal" // Negrita solo para botones header
            )}
            style={{
              color: isActive
                ? `var(--main-sidebar-button-active-text-fg)`
                : isHovered
                ? `var(--main-sidebar-button-hover-text-fg)`
                : `var(--main-sidebar-button-text-fg)`
            }}
          >
            {label}
          </span>
          {rightIcon && (
            <div 
              data-icon
              className="flex-shrink-0 ml-2 mr-2"
              style={{
                color: isActive
                  ? `var(--main-sidebar-button-active-icon-fg)`
                  : isHovered
                  ? `var(--main-sidebar-button-hover-icon-fg)`
                  : `var(--main-sidebar-button-icon-fg)`
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>
      )}
      </button>
      

    </div>
  );
}