import React, { useState } from "react";
import { ChevronDown, Folder, Search, Filter, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  // Botones de herramientas ghost
  showSearch?: boolean;
  showFilters?: boolean;
  showClearFilters?: boolean;
  onSearch?: (value: string) => void;
  onFiltersOpen?: () => void;
  onClearFilters?: () => void;
  filtersContent?: React.ReactNode;
  activeFiltersCount?: number;
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
  actionButton,
  showSearch: showSearchButton = false,
  showFilters: showFiltersButton = false,
  showClearFilters = false,
  onSearch,
  onFiltersOpen,
  onClearFilters: onClearFiltersAction,
  filtersContent,
  activeFiltersCount = 0,
}: HeaderProps = {}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { openModal } = useGlobalModalStore();

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
  
  // Dos filas con altura fija
  const getHeaderHeight = () => {
    return "h-24"; // Dos filas de 12 cada una
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
      {/* Primera fila: Título de página + Selector de proyecto */}
      <div className="w-full h-12 px-12 flex items-center justify-between border-b border-[var(--menues-border)]">
        {/* Left: Page Title */}
        <div className="flex items-center">
          {(pageTitle || title) && (
            <h1 className="text-xl font-light text-foreground tracking-wider">
              {pageTitle || title}
            </h1>
          )}
        </div>

        {/* Right: Action Buttons + Project Selector */}
        <div className="flex items-center gap-2">
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
          
          {/* Project Selector - Solo para secciones basadas en proyecto */}
          {isProjectBasedSection && (
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
          )}
        </div>
      </div>

      {/* Segunda fila: Tabs + Botones de herramientas + Botón de acción */}
      <div className="w-full h-12 px-12 flex items-center justify-between">
        {/* Left: Tabs */}
        <div className="flex items-center">
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

        {/* Right: Botones de herramientas + Botón de acción */}
        <div className="flex items-center gap-2">
          {/* Botones de herramientas ghost */}
          {showSearchButton && (
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <Search className="mr-1 h-3 w-3" />
                  Buscar
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="end">
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    onSearch?.(e.target.value);
                  }}
                  className="h-8"
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          )}

          {showFiltersButton && (
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 text-xs ${
                    activeFiltersCount > 0 ? "bg-secondary text-secondary-foreground" : ""
                  }`}
                  onClick={onFiltersOpen}
                >
                  <Filter className="mr-1 h-3 w-3" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              {filtersContent && (
                <PopoverContent className="w-80 p-4" align="end">
                  {filtersContent}
                </PopoverContent>
              )}
            </Popover>
          )}

          {showClearFilters && activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFiltersAction}
              className="h-8 px-3 text-xs"
            >
              <FilterX className="mr-1 h-3 w-3" />
              Limpiar
            </Button>
          )}

          {/* Botón de acción principal */}
          {actionButton && (
            <div className="flex items-center gap-2 ml-2">
              {actionButton.additionalButton && (
                <Button
                  variant={actionButton.additionalButton.variant || "ghost"}
                  size="sm"
                  onClick={actionButton.additionalButton.onClick}
                  className="h-8 text-xs"
                >
                  {actionButton.additionalButton.icon && (
                    <actionButton.additionalButton.icon className="mr-1.5 h-3 w-3" />
                  )}
                  {actionButton.additionalButton.label}
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={actionButton.onClick}
                className="h-8 text-xs"
              >
                {actionButton.icon && (
                  <actionButton.icon className="mr-1.5 h-3 w-3" />
                )}
                {actionButton.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
