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
        data-active={isActive}
        className={cn(
          "flex items-center h-8 w-full transition-all duration-200 ease-out overflow-hidden rounded",
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
        {/* RAIL DE 47px - El icono SIEMPRE está perfectamente centrado aquí y NUNCA se mueve */}
        <span className="shrink-0 w-12 flex items-center justify-center transition-colors duration-200">
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
                <span className="text-current">
                  {icon}
                </span>
              )}
            </>
          )}
        </span>
        
        {/* Texto - Solo aparece cuando expandido, SIN mover el icono */}
        {isExpanded && (
          <span 
            className={cn(
              "text-sm whitespace-nowrap text-left flex items-center justify-between flex-1 ml-2 text-current",
              isHeaderButton ? "font-bold" : "font-normal"
            )}
          >
            <span>{label}</span>
            {rightIcon && (
              <span className="flex-shrink-0 ml-2 mr-2">
                {rightIcon}
              </span>
            )}
          </span>
        )}
      </button>
    </div>
  );
}