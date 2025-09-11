import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import React from "react";

interface HeaderButtonProps {
  icon?: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  href?: string;
  avatarUrl?: string;
  userFullName?: string | null;
  rightIcon?: React.ReactNode;
  projectColor?: string;
}

export default function HeaderButton({ 
  icon, 
  label, 
  isActive, 
  onClick,
  href,
  avatarUrl,
  userFullName,
  rightIcon,
  projectColor
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

  return (
    <div className="relative group">
      <button
        ref={buttonRef}
        className={cn(
          'relative flex items-center justify-center transition-[width] duration-150 ease-in-out overflow-hidden',
          'w-8 h-8', // Tamaño base compacto
          (isHovered || isActive) && 'w-auto justify-start pr-3' // Expansión en hover/active
        )}
        style={{
          minWidth: '32px',
          borderRadius: '4px',
          backgroundColor: isActive || isHovered 
            ? 'var(--accent)' 
            : 'transparent',
          color: isActive || isHovered 
            ? 'white' 
            : 'var(--main-sidebar-button-fg)'
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Contenedor flex para icono y texto */}
        <div className="flex items-center">
          {/* Icono - solo si no es ARCHUB (sin icono) */}
          {icon !== null && (
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
                      : (isActive || isHovered)
                      ? 'white'
                      : 'currentColor',
                    color: projectColor 
                      ? 'white' 
                      : (isActive || isHovered)
                      ? 'white'
                      : 'currentColor'
                  }}
                >
                  {userFullName.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase()}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {icon}
                </div>
              )}
            </div>
          )}
          
          {/* Texto - solo cuando está expandido */}
          {(isHovered || isActive) && (
            <div 
              className={cn(
                "flex items-center justify-between whitespace-nowrap",
                icon === null ? "ml-2" : "ml-2" // Margen consistente
              )}
            >
              <span className="text-sm text-left select-none font-bold">
                {label}
              </span>
              {rightIcon && (
                <div className="flex-shrink-0 ml-2">
                  {rightIcon}
                </div>
              )}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}