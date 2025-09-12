import React, { useState } from "react";
import { ChevronDown, Search, Filter, X, ArrowLeft, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted";

interface Tab {
  id: string;
  label: string;
  isActive: boolean;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline";
  isDisabled?: boolean;
  isRestricted?: boolean;
  restrictionReason?: string;
}

interface PageLayoutProps {
  // Título e icono de la página
  icon?: React.ComponentType<any> | React.ReactNode;
  title?: string;
  
  // Sistema de tabs
  tabs?: Tab[];
  onTabChange?: (tabId: string) => void;
  
  // Botones de acción del header de página
  showHeaderSearch?: boolean;
  headerSearchValue?: string;
  onHeaderSearchChange?: (value: string) => void;
  showHeaderFilter?: boolean;
  renderHeaderFilterContent?: () => React.ReactNode;
  isHeaderFilterActive?: boolean;
  showHeaderClearFilters?: boolean;
  onHeaderClearFilters?: () => void;
  
  // Botón de acción principal
  actionButton?: {
    label: string;
    icon?: React.ComponentType<any>;
    onClick: () => void;
    dropdown?: Array<{
      label: string;
      onClick: () => void;
    }>;
    additionalButton?: {
      label: string;
      icon?: React.ComponentType<any>;
      onClick: () => void;
      variant?: "ghost" | "default" | "secondary";
    };
  };
  
  // Acciones personalizadas (para PlanRestricted y otros)
  actions?: React.ReactNode[];
  
  // Botón "Volver" para páginas de vista/detalle
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonText?: string;
  isViewMode?: boolean;
  
  // Selector de vista de moneda
  showCurrencySelector?: boolean;
  currencyView?: 'discriminado' | 'pesificado' | 'dolarizado';
  onCurrencyViewChange?: (view: 'discriminado' | 'pesificado' | 'dolarizado') => void;
  
  // Contenido de la página
  children: React.ReactNode;
}

export function PageLayout({
  icon,
  title,
  tabs = [],
  onTabChange,
  showHeaderSearch = false,
  headerSearchValue = "",
  onHeaderSearchChange,
  showHeaderFilter = false,
  renderHeaderFilterContent,
  isHeaderFilterActive = false,
  showHeaderClearFilters = false,
  onHeaderClearFilters,
  actionButton,
  actions = [],
  showBackButton = false,
  onBackClick,
  backButtonText = "Volver",
  isViewMode = false,
  showCurrencySelector = false,
  currencyView = 'discriminado',
  onCurrencyViewChange,
  children,
}: PageLayoutProps) {
  const [searchInputValue, setSearchInputValue] = useState(headerSearchValue);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleHeaderSearchChange = (value: string) => {
    setSearchInputValue(value);
    onHeaderSearchChange?.(value);
  };

  const hasTabs = tabs.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="bg-[var(--layout-bg)]">
        <div className="max-w-[1440px] mx-auto px-6">
          {/* FILA SUPERIOR: Título de página a la izquierda + Botones de acción a la derecha */}
          <div className={`h-[50px] flex items-center justify-between ${!hasTabs ? 'border-b border-[var(--menues-border)]' : ''}`}>
          {/* Left: Page Title */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackClick}
                className="h-8 px-2 text-sm font-normal text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backButtonText}
              </Button>
            )}
            {title && (
              <div className="flex items-center gap-3">
                {icon && (
                  <span className="text-[var(--accent)] flex-shrink-0">
                    {React.isValidElement(icon) ? icon : React.createElement(icon as React.ComponentType<{ className?: string }>, { 
                      className: "w-5 h-5" 
                    })}
                  </span>
                )}
                <h1 className="text-lg font-semibold text-[var(--foreground)]">
                  {title}
                </h1>
              </div>
            )}
          </div>

          {/* Right: Header Action Buttons + Main Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Header Search Button (expandible) */}
            {showHeaderSearch && (
              <div 
                className="relative flex items-center"
                onMouseLeave={() => {
                  if (isSearchExpanded && !searchFocused) {
                    setIsSearchExpanded(false);
                    setSearchFocused(false);
                  }
                }}
              >
                <div className={`
                  transition-all duration-300 overflow-hidden
                  ${isSearchExpanded ? "w-48 opacity-100" : "w-8 opacity-100"}
                `}>
                  <div className={`
                    relative flex items-center h-8 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] transition-all
                    ${isSearchExpanded ? "bg-[var(--card-bg)]" : "bg-transparent border-transparent"}
                  `}>
                    <Input
                      placeholder="Buscar..."
                      value={searchInputValue}
                      onChange={(e) => handleHeaderSearchChange(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => {
                        setSearchFocused(false);
                        setTimeout(() => {
                          if (!searchFocused) {
                            setIsSearchExpanded(false);
                          }
                        }, 150);
                      }}
                      className={`
                        flex-1 h-full text-xs border-0 bg-transparent font-normal
                        placeholder:text-[var(--muted-foreground)]
                        focus:ring-0 focus:outline-none
                        ${isSearchExpanded ? "pl-3 pr-10" : "pl-0 pr-0 opacity-0"}
                      `}
                      autoFocus={isSearchExpanded}
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-transparent flex-shrink-0"
                      onClick={() => {
                        setIsSearchExpanded(!isSearchExpanded);
                        if (!isSearchExpanded) {
                          setTimeout(() => setSearchFocused(true), 100);
                        }
                      }}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Currency Selector */}
            {showCurrencySelector && onCurrencyViewChange && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className=""
                    title="Vista de moneda"
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40" align="end">
                  <div className="space-y-1">
                    <Button
                      variant={currencyView === 'discriminado' ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start h-8"
                      onClick={() => onCurrencyViewChange('discriminado')}
                    >
                      Discriminado
                    </Button>
                    <Button
                      variant={currencyView === 'pesificado' ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start h-8"
                      onClick={() => onCurrencyViewChange('pesificado')}
                    >
                      Pesificado
                    </Button>
                    <Button
                      variant={currencyView === 'dolarizado' ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start h-8"
                      onClick={() => onCurrencyViewChange('dolarizado')}
                    >
                      Dolarizado
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Header Filter Button */}
            {showHeaderFilter && renderHeaderFilterContent && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={`${isHeaderFilterActive ? "button-secondary-pressed" : ""}`}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  {renderHeaderFilterContent()}
                </PopoverContent>
              </Popover>
            )}

            {/* Header Clear Filters Button */}
            {showHeaderClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                className=""
                onClick={onHeaderClearFilters}
                title="Limpiar filtros"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Separator if there are header actions and main action buttons */}
            {(showCurrencySelector || showHeaderSearch || showHeaderFilter || showHeaderClearFilters) && (actionButton?.additionalButton || actionButton || actions.length > 0) && (
              <div className="w-px h-6 bg-[var(--card-border)] mx-1" />
            )}

            {/* Additional Button (appears first/left) */}
            {actionButton?.additionalButton && (
              <Button
                variant={actionButton.additionalButton.variant || "ghost"}
                size="sm"
                onClick={actionButton.additionalButton.onClick}
                className="h-8 px-3 text-xs font-normal"
              >
                {actionButton.additionalButton.icon && (
                  <actionButton.additionalButton.icon className="w-4 h-4 mr-1" />
                )}
                {actionButton.additionalButton.label}
              </Button>
            )}

            {/* Custom Actions (like PlanRestricted) */}
            {actions.map((action, index) => (
              <div key={index}>
                {action}
              </div>
            ))}

            {/* Main Action Button */}
            {actionButton && (
              <>
                {actionButton.dropdown ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 px-3 text-xs font-normal"
                      >
                        {actionButton.icon && (
                          <actionButton.icon className="w-4 h-4 mr-1" />
                        )}
                        {actionButton.label}
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {actionButton.dropdown.map((item, index) => (
                        <DropdownMenuItem key={index} onClick={item.onClick}>
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={actionButton.onClick}
                    className="h-8 px-3 text-xs font-normal"
                  >
                    {actionButton.icon && (
                      <actionButton.icon className="w-4 h-4 mr-1" />
                    )}
                    {actionButton.label}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

          {/* FILA INFERIOR: Tabs a la izquierda */}
          {hasTabs && (
            <div className="h-8 flex items-center border-b border-[var(--menues-border)]">
            <div className="flex items-center space-x-6">
              {tabs.map((tab) => {
                const tabContent = (
                  <button
                    key={tab.id}
                    onClick={() =>
                      tab.isDisabled || tab.isRestricted
                        ? undefined
                        : onTabChange?.(tab.id)
                    }
                    disabled={tab.isDisabled}
                    className={`relative text-sm transition-all duration-300 flex items-center gap-2 px-1 h-8 ${
                      tab.isDisabled || tab.isRestricted
                        ? "text-muted-foreground opacity-60 cursor-not-allowed"
                        : tab.isActive
                          ? "text-foreground font-medium border-b-2 border-[var(--accent)] -mb-[2px]"
                          : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {tab.badge && (
                      <span className="px-1.5 py-0.5 text-xs bg-[var(--muted)] text-[var(--muted-foreground)] rounded-md">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );

                // Si la tab está restringida, envolverla con PlanRestricted
                if (tab.isRestricted && tab.restrictionReason) {
                  return (
                    <PlanRestricted key={tab.id} reason={tab.restrictionReason}>
                      {tabContent}
                    </PlanRestricted>
                  );
                }

                return tabContent;
              })}
            </div>
            </div>
          )}
        </div>

      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}