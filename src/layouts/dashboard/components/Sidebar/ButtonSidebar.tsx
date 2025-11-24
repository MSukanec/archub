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
  badgeCount?: number;
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
  badgeCount
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
        data-active={isActive}
        className={cn(
          "flex items-center h-8 transition-all duration-200 ease-out overflow-hidden rounded",
          isExpanded ? "w-full" : "w-8",
          "text-[var(--main-sidebar-button-fg)] bg-[var(--main-sidebar-button-bg)]",
          !disableHover && "hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-[var(--main-sidebar-button-hover-fg)]",
          "data-[active=true]:bg-[var(--main-sidebar-button-active-bg)] data-[active=true]:text-[var(--main-sidebar-button-active-fg)]"
        )}
        onClick={handleClick}
        onMouseEnter={(e) => {
          handleMouseEnter();
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
        }}
      >
        {/* Icono centrado */}
        <span className="flex-shrink-0 w-8 flex items-center justify-center transition-colors duration-200 relative">
          {!isChild && !(isHeaderButton && icon === null) && (
            <>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar"
                  className="w-[28px] h-[28px] rounded-full"
                />
              ) : userFullName ? (
                <div 
                  className={cn(
                    "w-[28px] h-[28px] rounded-full flex items-center justify-center text-xs font-medium border",
                    projectColor ? "" : "text-current border-current"
                  )}
                  style={projectColor ? { 
                    backgroundColor: projectColor,
                    borderColor: 'transparent',
                    color: 'white'
                  } : {}}
                >
                  {userFullName.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase()}
                </div>
              ) : (
                <span 
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-[var(--accent)]" : "text-[var(--main-sidebar-button-fg)]",
                    "group-hover:text-[var(--accent)]"
                  )}
                >
                  {icon}
                </span>
              )}
            </>
          )}
          
          {/* Badge de notificaciones */}
          {badgeCount !== undefined && badgeCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </span>
        
        {/* Texto - Solo aparece cuando expandido */}
        {isExpanded && (
          <span 
            className={cn(
              "text-xs whitespace-nowrap text-left flex items-center justify-start flex-1 pr-2 text-current ml-3",
              isHeaderButton ? "font-bold" : "font-normal"
            )}
          >
            <span>{label}</span>
            {rightIcon && (
              <span className="flex-shrink-0 ml-2">
                {rightIcon}
              </span>
            )}
          </span>
        )}
      </button>
    </div>
  );
}