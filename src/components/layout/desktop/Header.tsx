import React, { useState } from "react";
import { ChevronDown, Folder, Search, Filter, X, ArrowLeft, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
import { useUserOrganizationPreferences } from "@/hooks/use-user-organization-preferences";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { useProjectContext } from "@/stores/projectContext";
import { useEffect } from "react";
import {
  useSidebarStore,
  useSecondarySidebarStore,
} from "@/stores/sidebarStore";

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

interface HeaderProps {
  icon?: React.ComponentType<any> | React.ReactNode;
  title?: string;
  // Título de página que se mostrará en el lado izquierdo
  pageTitle?: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showFilters?: boolean;
  filters?: { label: string; onClick: () => void }[];
  customFilters?: React.ReactNode;
  onClearFilters?: () => void;
  actions?: React.ReactNode[];
  // Props para sistema de tabs
  tabs?: Tab[];
  onTabChange?: (tabId: string) => void;
  // Botones de acción adicionales (búsqueda, filtro, limpiar filtros)
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
    additionalButton?: {
      label: string;
      icon?: React.ComponentType<any>;
      onClick: () => void;
      variant?: "ghost" | "default" | "secondary";
    };
  };
  // Botón "Volver" para páginas de vista/detalle
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonText?: string;
  // Mostrar "Viendo:" en páginas de vista
  isViewMode?: boolean;
  // Selector de vista de moneda
  showCurrencySelector?: boolean;
  currencyView?: 'discriminado' | 'pesificado' | 'dolarizado';
  onCurrencyViewChange?: (view: 'discriminado' | 'pesificado' | 'dolarizado') => void;
}

export function Header({
  icon,
  title,
  pageTitle,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  showFilters = true,
  filters = [],
  customFilters,
  onClearFilters,
  actions = [],
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
  showBackButton = false,
  onBackClick,
  backButtonText = "Volver",
  isViewMode = false,
  showCurrencySelector = false,
  currencyView = 'discriminado',
  onCurrencyViewChange,
}: HeaderProps = {}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState(headerSearchValue);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { openModal } = useGlobalModalStore();

  const handleHeaderSearchChange = (value: string) => {
    setSearchInputValue(value);
    onHeaderSearchChange?.(value);
  };

  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjects(
    userData?.preferences?.last_organization_id,
  );
  const { data: userOrgPrefs } = useUserOrganizationPreferences(
    userData?.organization?.id,
  );
  const { setSidebarContext, currentSidebarContext, setActiveSidebarSection } =
    useNavigationStore();
  const { selectedProjectId, setSelectedProject } = useProjectContext();

  // Mutation para actualizar proyecto seleccionado usando nuevo sistema
  const updateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !userData?.organization?.id)
        return;

      console.log("🔧 Header: Updating project", {
        projectId,
        organizationId: userData.organization.id,
      });

      const { error } = await supabase
        .from("user_organization_preferences")
        .upsert(
          {
            user_id: userData.user.id,
            organization_id: userData.organization.id,
            last_project_id: projectId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,organization_id" },
        );

      if (error) {
        console.error("🔧 Header: Error updating project", error);
        // Fallback to localStorage
        localStorage.setItem(
          `last-project-${userData.organization.id}`,
          projectId,
        );
      }

      return projectId;
    },
    onSuccess: (projectId) => {
      console.log("🔧 Header: Project updated successfully", projectId);
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({
        queryKey: ["user-organization-preferences"],
      });
      setSelectedProject(projectId || null);
    },
  });





  const isProjectBasedSection =
    location.startsWith("/design") ||
    location.startsWith("/construction") ||
    location.startsWith("/finances") ||
    location.startsWith("/project");

  // Hook para detectar el estado del sidebar
  const { isDocked: isMainDocked, isHovered: isMainHovered } =
    useSidebarStore();
  const { isDocked: isSecondaryDocked, isHovered: isSecondaryHovered } =
    useSecondarySidebarStore();

  const isSecondaryExpanded =
    isSecondaryDocked || isSecondaryHovered || isMainHovered;
  const hasTabs = tabs.length > 0;
  
  // Doble fila: primera fila titulo + selector, segunda fila tabs + botones
  const getHeaderHeight = () => {
    return "h-20"; // Altura para dos filas (10 + 10)
  };

  return (
    <div
      className={`fixed top-0 right-0 z-50 ${getHeaderHeight()} border-b border-[var(--menues-border)] bg-[var(--layout-bg)] transition-all duration-300 ${
        // Calculate left margin based on both sidebars: 40px (OrganizationSidebar) + main sidebar
        (isMainDocked || isMainHovered)
          ? "left-[304px]" // 40px + 264px when main sidebar is expanded
          : "left-[80px]" // 40px + 40px when main sidebar is collapsed
      }`}
    >
      {/* Primera fila: Botón Volver + Título + Botones de acción */}
      <div className="w-full h-10 px-12 flex items-center justify-between">
        {/* Left: Back Button + Page Title */}
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
          {(pageTitle || title) && (
            <h1 className="text-xl font-light text-foreground tracking-wider flex items-center gap-3">
              {icon && (
                React.createElement(icon as React.ComponentType<any>, { 
                  className: "h-6 w-6", 
                  style: { color: 'var(--accent)' } 
                })
              )}
              <span>
                {isViewMode && showBackButton ? `Editando: ${pageTitle || title}` : (pageTitle || title)}
              </span>
            </h1>
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
                    className=" hover:bg-transparent flex-shrink-0"
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
          {(showCurrencySelector || showHeaderSearch || showHeaderFilter || showHeaderClearFilters) && (actionButton?.additionalButton || actionButton) && (
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
          {/* Main Action Button */}
          {actionButton && (
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
        </div>
      </div>

      {/* Segunda fila: Solo Tabs */}
      {hasTabs && (
        <div className="w-full h-10 px-12 flex items-center justify-start">
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
                  className={`relative text-sm transition-all duration-300 flex items-center gap-2 px-1 py-2 ${
                    tab.isDisabled || tab.isRestricted
                      ? "text-muted-foreground opacity-60 cursor-not-allowed"
                      : tab.isActive
                        ? "text-foreground font-medium border-b-2 border-[var(--accent)]"
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
  );
}
