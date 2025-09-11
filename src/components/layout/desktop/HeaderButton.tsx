import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface HeaderButtonProps {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  rightIcon?: React.ReactNode;
  avatarUrl?: string;
  userFullName?: string;
  projectColor?: string;
  disableHover?: boolean;
}

export default function HeaderButton({
  label,
  icon,
  href,
  onClick,
  isActive = false,
  rightIcon,
  avatarUrl,
  userFullName,
  projectColor,
  disableHover = false
}: HeaderButtonProps) {
  const [, navigate] = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  const showText = isHovered || isActive;

  return (
    <div className="relative group">
      <button
        ref={buttonRef}
        className={cn(
          'relative flex items-center justify-center overflow-hidden h-8 rounded-[4px]',
          // Transición super smooth para width y padding
          'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
          // Width dinámica: solo icon (w-8) o expandido (w-auto con padding)
          showText ? 'w-auto justify-start pl-0 pr-3' : 'w-8',
        )}
        onClick={handleClick}
        onMouseEnter={(e) => {
          setIsHovered(true);
          if (!isActive && !disableHover) {
            e.currentTarget.style.backgroundColor = 'var(--main-sidebar-button-hover-bg)';
            e.currentTarget.style.color = 'var(--main-sidebar-button-hover-fg)';
          }
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          if (!isActive && !disableHover) {
            e.currentTarget.style.backgroundColor = 'var(--main-sidebar-button-bg)';
            e.currentTarget.style.color = 'var(--main-sidebar-button-fg)';
          }
        }}
        style={{ 
          borderRadius: '4px',
          backgroundColor: isActive
            ? 'var(--main-sidebar-button-active-bg)'
            : 'var(--main-sidebar-button-bg)',
          color: isActive
            ? 'var(--main-sidebar-button-active-fg)'
            : 'var(--main-sidebar-button-fg)',
        } as React.CSSProperties}
      >
        {/* Contenedor del icono - SIEMPRE visible, siempre 32x32px */}
        <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
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
                  ? 'var(--main-sidebar-button-active-fg)'
                  : 'var(--main-sidebar-button-fg)',
                color: projectColor 
                  ? 'white' 
                  : isActive
                  ? 'var(--main-sidebar-button-active-fg)'
                  : 'var(--main-sidebar-button-fg)'
              }}
            >
              {userFullName.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          ) : (
            icon
          )}
        </div>
        
        {/* Texto - con animación ultra smooth de entrada/salida */}
        <div 
          className={cn(
            "flex items-center whitespace-nowrap overflow-hidden",
            // Transiciones ultra smooth con cubic-bezier personalizado
            "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            showText 
              ? "max-w-[200px] opacity-100 translate-x-0" 
              : "max-w-0 opacity-0 translate-x-2"
          )}
        >
          <span 
            className={cn(
              "text-sm font-bold ml-2",
              // Transición suave para el texto también
              "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              showText ? "transform-none" : "scale-95"
            )}
          >
            {label}
          </span>
          {rightIcon && (
            <div className="flex-shrink-0 ml-2 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
              {rightIcon}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}