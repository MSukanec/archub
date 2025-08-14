import React, { useState } from "react";
import { ChevronDown, Folder, Search, Filter, X } from "lucide-react";
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
import { CustomRestricted } from "@/components/ui-custom/CustomRestricted";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
import { useUserOrganizationPreferences } from "@/hooks/use-user-organization-preferences";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { ProjectSelector } from "@/components/navigation/ProjectSelector";
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
      className={`fixed top-0 right-0 z-50 ${getHeaderHeight()} border-b border-[var(--menues-border)] bg-[var(--card-bg)] transition-all duration-300 ${
        // Calculate left margin based on fixed main sidebar (40px) and variable secondary sidebar
        isSecondaryExpanded
          ? "left-[304px]" // 40px main + 264px secondary
          : "left-[80px]" // 40px main + 40px secondary
      }`}
    >
      {/* Primera fila: Título + Tabs + Selector de proyectos */}
      <div className="w-full h-10 px-12 flex items-center justify-between">
        {/* Left: Page Title + Tabs */}
        <div className="flex items-center gap-8">
          {(pageTitle || title) && (
            <h1 className="text-xl font-light text-foreground tracking-wider">
              {pageTitle || title}
            </h1>
          )}
          
          {/* Tabs */}
          {hasTabs && (
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
                    className={`relative text-sm transition-all duration-300 flex items-center gap-2 px-3 py-2 rounded-lg ${
                      tab.isDisabled || tab.isRestricted
                        ? "text-muted-foreground opacity-60 cursor-not-allowed"
                        : tab.isActive
                          ? "text-primary font-semibold bg-primary/10 shadow-md border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
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

                // Si la tab está restringida, envolverla con CustomRestricted
                if (tab.isRestricted && tab.restrictionReason) {
                  return (
                    <CustomRestricted key={tab.id} reason={tab.restrictionReason}>
                      {tabContent}
                    </CustomRestricted>
                  );
                }

                return tabContent;
              })}
            </div>
          )}
        </div>

        {/* Right: Project Selector - SIEMPRE VISIBLE */}
        <div className="flex items-center">
          <CustomRestricted feature="project_management">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs font-normal flex items-center gap-1"
                >
                  <Folder className="w-4 h-4" />
                  <span className="max-w-32 truncate">
                    {projects.length === 0
                      ? "No hay proyectos"
                      : projects.find((p) => p.id === userOrgPrefs?.last_project_id)
                          ?.name || "Sin proyecto"}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() =>
                        updateProjectMutation.mutate(project.id)
                      }
                      className={`${userOrgPrefs?.last_project_id === project.id ? "bg-[var(--accent)] text-white" : ""}`}
                    >
                      <div className="flex items-center w-full">
                        <Folder className="w-4 h-4 mr-2" />
                        <span className="truncate">{project.name}</span>
                      </div>
                      {userOrgPrefs?.last_project_id === project.id && (
                        <div
                          className="w-2 h-2 rounded-full ml-auto"
                          style={{ backgroundColor: "var(--accent)" }}
                        />
                      )}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Folder className="w-8 h-8 text-[var(--layout-text-muted)]" />
                      <div className="text-sm text-[var(--layout-text)]">
                        No hay proyectos
                      </div>
                      <div className="text-xs text-[var(--layout-text-muted)] mb-2">
                        Crea tu primer proyecto para comenzar
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          navigate("/organization/projects");
                        }}
                        className="h-7 px-3 text-xs"
                      >
                        Crear proyecto
                      </Button>
                    </div>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CustomRestricted>
        </div>
      </div>

      {/* Segunda fila: Solo botones de acción */}
      <div className="w-full h-10 px-12 flex items-center justify-end">

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
                absolute right-0 transition-all duration-300 overflow-hidden
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
                    className="absolute right-0 h-8 w-8 p-0 hover:bg-transparent"
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

          {/* Header Filter Button */}
          {showHeaderFilter && renderHeaderFilterContent && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${isHeaderFilterActive ? "button-secondary-pressed" : ""}`}
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
              className="h-8 w-8 p-0"
              onClick={onHeaderClearFilters}
              title="Limpiar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Separator if there are header actions and main action buttons */}
          {(showHeaderSearch || showHeaderFilter || showHeaderClearFilters) && (actionButton?.additionalButton || actionButton) && (
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
    </div>
  );
}
