import React, { useState, useRef, useEffect } from "react";
import { 
  ChevronDown, 
  Search, 
  Filter, 
  X, 
  ArrowLeft, 
  DollarSign,
  Home,
  Building,
  Users,
  FileText,
  Calculator,
  FolderOpen,
  Activity,
  Settings,
  Package,
  Layers,
  History,
  BookOpen,
  ListTodo,
  GraduationCap,
  MessageCircle,
  Wallet
} from "lucide-react";
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
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";

// Mapeo de rutas a nombres e iconos de páginas (exactamente como en el sidebar)
const PAGE_CONFIG: Record<string, { name: string; icon: any }> = {
  // Home
  '/home': { name: 'Inicio', icon: Home },
  
  // Organization level
  '/organization/dashboard': { name: 'Resumen de Organización', icon: Home },
  '/organization/projects': { name: 'Gestión de Proyectos', icon: Building },
  '/contacts': { name: 'Contactos', icon: Users },
  '/analysis': { name: 'Análisis de Costos', icon: FileText },
  '/movements': { name: 'Movimientos', icon: DollarSign },
  '/finances/capital': { name: 'Capital', icon: Calculator },
  '/finances/general-costs': { name: 'Gastos Generales', icon: FolderOpen },
  '/organization/activity': { name: 'Actividad', icon: Activity },
  '/organization/preferences': { name: 'Preferencias', icon: Settings },
  
  // Project level
  '/project/dashboard': { name: 'Resumen de Proyecto', icon: Home },
  '/budgets': { name: 'Cómputo y Presupuesto', icon: Calculator },
  '/professional/budgets': { name: 'Cómputo y Presupuesto', icon: Calculator },
  '/construction/personnel': { name: 'Mano de Obra', icon: Users },
  '/construction/materials': { name: 'Materiales', icon: Package },
  '/construction/indirects': { name: 'Indirectos', icon: Layers },
  '/construction/subcontracts': { name: 'Subcontratos', icon: FileText },
  '/construction/logs': { name: 'Bitácora', icon: History },
  '/clients': { name: 'Clientes', icon: Users },
  
  // Admin
  '/admin/community': { name: 'Comunidad', icon: Users },
  '/admin/payments': { name: 'Pagos', icon: Wallet },
  '/admin/courses': { name: 'Cursos', icon: BookOpen },
  '/admin/tasks': { name: 'Tareas', icon: ListTodo },
  '/admin/costs': { name: 'Costos', icon: DollarSign },
  '/providers/products': { name: 'Productos', icon: Package },
  '/admin/general': { name: 'General', icon: Settings },
  
  // Learning / Capacitaciones
  '/learning/dashboard': { name: 'Dashboard', icon: Home },
  '/learning/courses': { name: 'Cursos', icon: GraduationCap },
};

// Mapeo de sidebar level a nombre de sección
const SECTION_NAMES: Record<string, string> = {
  'general': 'Inicio',
  'organization': 'Organización',
  'project': 'Proyecto',
  'learning': 'Capacitaciones',
  'admin': 'Administración',
};

// Mapeo de sidebar level a dashboard route
const SECTION_DASHBOARDS: Record<string, string> = {
  'general': '/home',
  'organization': '/organization/dashboard',
  'project': '/project/dashboard',
  'learning': '/learning/dashboard',
  'admin': '/admin/community',
};

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
  description?: string;
  
  // Selector de proyecto/organización
  selector?: React.ReactNode;
  
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
  
  // Control de ancho - debe coincidir con el contenido
  wide?: boolean;
  
  // Contenido de la página
  children: React.ReactNode;
}

export function PageLayout({
  icon,
  title,
  description,
  selector,
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
  wide = false,
  children,
}: PageLayoutProps) {
  const [searchInputValue, setSearchInputValue] = useState(headerSearchValue);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  // Get sidebar state for padding compensation
  const { isDocked } = useSidebarStore();
  const { sidebarLevel } = useNavigationStore();
  const [location, navigate] = useLocation();
  
  // Estado y refs para animación de tabs
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [underlineStyle, setUnderlineStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 });

  const handleHeaderSearchChange = (value: string) => {
    setSearchInputValue(value);
    onHeaderSearchChange?.(value);
  };

  const hasTabs = tabs.length > 0;
  
  // Determinar si hay botones de acción para mostrar en la segunda fila
  const hasActionButtons = 
    showHeaderSearch || 
    showCurrencySelector || 
    showHeaderFilter || 
    showHeaderClearFilters || 
    actionButton?.additionalButton || 
    actions.length > 0 || 
    actionButton;
  
  // Mostrar segunda fila si hay tabs O botones de acción
  const showSecondRow = hasTabs || hasActionButtons;

  // Actualizar posición del subrayado animado
  useEffect(() => {
    const updateUnderlinePosition = () => {
      if (!hasTabs || !tabsContainerRef.current) return;
      
      const activeTab = tabs.find(tab => tab.isActive);
      if (!activeTab) {
        setUnderlineStyle({ width: 0, left: 0 });
        return;
      }
      
      const tabButton = tabsContainerRef.current?.querySelector(`[data-tab-id="${activeTab.id}"]`) as HTMLElement;
      if (tabButton && tabsContainerRef.current) {
        // Obtener posición relativa del contenedor padre
        const tabOffsetLeft = tabButton.offsetLeft;
        const tabWidth = tabButton.offsetWidth;
        
        // Obtener el padding interno del botón (px-1 = 4px cada lado)
        const buttonPadding = 4;
        
        // console.log('🔧 Tab positioning:', {
        //   activeTabId: activeTab.id,
        //   tabOffsetLeft,
        //   tabWidth,
        //   tabLabel: activeTab.label,
        //   adjustedLeft: tabOffsetLeft + buttonPadding,
        //   adjustedWidth: tabWidth - (buttonPadding * 2)
        // });
        
        // Calcular posición exacta del contenido del texto (sin el padding del botón)
        const left = tabOffsetLeft + buttonPadding;
        const width = tabWidth - (buttonPadding * 2);
        
        setUnderlineStyle({ width, left });
      }
    };
    
    // Ejecutar inmediatamente y también después de un frame para asegurar medición correcta
    updateUnderlinePosition();
    requestAnimationFrame(updateUnderlinePosition);
  }, [tabs, hasTabs]);

  return (
    <div className="flex flex-col min-h-0">
      {/* Page Content - HEADER Y CONTENIDO juntos para que se muevan con scroll */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div style={{ backgroundColor: "var(--layout-bg)" }}>
          <div className={`${wide ? "" : "max-w-[1440px] mx-auto"} pt-0 ${
            isDocked ? 'px-16' : 'px-16'
          }`}>
          {/* FILA 1: Icono + Título + Descripción a la izquierda + Selector a la derecha */}
          {/* COMENTADO - Ahora se muestra en MainHeader */}
          {/* <div className={`min-h-[50px] flex items-center justify-between ${!showSecondRow ? 'border-b border-[var(--main-sidebar-border)]' : ''}`}>
          <div className="flex items-center gap-4 py-2">
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
            
            <div className="flex items-center gap-3">
              {(() => {
                const IconComponent = icon || PAGE_CONFIG[location]?.icon;
                if (!IconComponent) return null;
                
                if (React.isValidElement(IconComponent)) {
                  return (
                    <span className="text-[var(--accent)] flex-shrink-0">
                      {IconComponent}
                    </span>
                  );
                }
                
                const Icon = IconComponent as React.ComponentType<any>;
                return (
                  <span className="text-[var(--accent)] flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </span>
                );
              })()}
              
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-[var(--foreground)]">
                  {PAGE_CONFIG[location]?.name || title || 'Página'}
                </h1>
                {description && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {selector && (
            <div className="flex items-center">
              {selector}
            </div>
          )}
        </div> */}

          {/* FILA 2: Tabs a la izquierda + Botones de acción a la derecha */}
          {showSecondRow && (
            <div className="h-10 flex items-center justify-between border-b border-border relative overflow-hidden">
              {/* Left: Tabs */}
              {hasTabs && (
                <div ref={tabsContainerRef} className="flex items-center relative" style={{ gap: '24px' }}>
                  {tabs.map((tab) => {
                    const tabContent = (
                      <button
                        key={tab.id}
                        data-tab-id={tab.id}
                        onClick={() =>
                          tab.isDisabled || tab.isRestricted
                            ? undefined
                            : onTabChange?.(tab.id)
                        }
                        disabled={tab.isDisabled}
                        className={`relative text-sm flex items-center gap-2 px-1 h-10 flex-shrink-0 min-w-0 ${
                          tab.isDisabled || tab.isRestricted
                            ? "text-muted-foreground opacity-60 cursor-not-allowed"
                            : tab.isActive
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                        }`}
                        style={{ 
                          transition: 'none',
                          transform: 'translateZ(0)',
                          willChange: 'auto'
                        }}
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
                        <PlanRestricted key={tab.id} feature={tab.restrictionReason}>
                          {tabContent}
                        </PlanRestricted>
                      );
                    }

                    return tabContent;
                  })}
                  
                  {/* Subrayado animado dinámico */}
                  <div
                    className="absolute bottom-0 h-[2px] bg-[var(--accent)] transition-all duration-300 ease-out pointer-events-none"
                    style={{
                      width: `${underlineStyle.width}px`,
                      transform: `translateX(${underlineStyle.left}px)`,
                      opacity: underlineStyle.width > 0 ? 1 : 0,
                      left: 0
                    }}
                  />
                </div>
              )}

              {/* Right: Action Buttons */}
              {hasActionButtons && (
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
              )}
            </div>
          )}
          </div>
        </div>

        {/* Page Content */}
        <div className={`${wide ? "" : "max-w-[1440px] mx-auto"} pt-6 pb-6 min-h-0 max-w-full overflow-x-hidden ${
          isDocked ? 'px-16' : 'px-16'
        }`}>
          {children}
        </div>
      </div>
    </div>
  );
}