import React, { useState } from "react";
import { ChevronDown, Plus, Filter, X, Search, Building, Building2, Folder, Menu } from "lucide-react";
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
import { CustomRestricted } from "@/components/ui-custom/CustomRestricted";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { ProjectSelector } from "@/components/navigation/ProjectSelector";
import { useProjectContext } from "@/stores/projectContext";
import { useEffect } from "react";


interface HeaderDesktopProps {
  icon?: React.ComponentType<any> | React.ReactNode;
  title?: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showFilters?: boolean;
  filters?: { label: string; onClick: () => void }[];
  customFilters?: React.ReactNode;
  onClearFilters?: () => void;
  actions?: React.ReactNode[];
}

export function HeaderDesktop({
  icon,
  title,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  showFilters = true,
  filters = [],
  customFilters,
  onClearFilters,
  actions = [],
}: HeaderDesktopProps = {}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { openModal } = useGlobalModalStore();

  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjects(userData?.preferences?.last_organization_id);
  const { setSidebarContext, currentSidebarContext, setActiveSidebarSection } = useNavigationStore();
  const { selectedProjectId, setSelectedProject } = useProjectContext();
  
  // Estado local para tracking inmediato del proyecto seleccionado
  const [localSelectedProject, setLocalSelectedProject] = useState<string | null>(selectedProjectId);
  
  // Sincronizar localSelectedProject con userData cuando cambie desde otras páginas
  useEffect(() => {
    if (userData?.preferences?.last_project_id !== undefined) {
      setLocalSelectedProject(userData.preferences.last_project_id);
    }
  }, [userData?.preferences?.last_project_id]);

  // Mutation para actualizar proyecto seleccionado
  const updateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.preferences?.id) return;
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('id', userData.preferences.id);
      
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setSelectedProject(projectId);
    }
  });

  const handleProjectChange = (projectId: string) => {
    setLocalSelectedProject(projectId);
    updateProjectMutation.mutate(projectId);
  };

  const getCurrentSectionLabel = () => {
    if (location === "/") return "Gestión de Organizaciones";
    if (location.startsWith("/design")) return "Diseño";
    if (location.startsWith("/construction")) return "Construcción";
    if (location.startsWith("/finances")) return "Finanzas";
    if (location.startsWith("/teams")) return "Equipos";
    if (location.startsWith("/profile")) return "Perfil";
    if (location.startsWith("/settings")) return "Configuración";
    if (location.startsWith("/admin")) return "Administración";
    if (location.startsWith("/organization")) return "Organización";
    return "Archub";
  };

  const getBreadcrumbIcon = () => {
    if (location === "/") return <Building className="w-4 h-4" />;
    if (location.startsWith("/design")) return <Building2 className="w-4 h-4" />;
    if (location.startsWith("/construction")) return <Building2 className="w-4 h-4" />;
    if (location.startsWith("/finances")) return <Building2 className="w-4 h-4" />;
    if (location.startsWith("/teams")) return <Building2 className="w-4 h-4" />;
    if (location.startsWith("/organization")) return <Building className="w-4 h-4" />;
    return <Folder className="w-4 h-4" />;
  };

  const isProjectBasedSection = location.startsWith("/design") || location.startsWith("/construction") || location.startsWith("/finances");

  return (
    <div className="hidden md:flex items-center justify-between h-14 px-6 border-b border-[var(--layout-border)] bg-[var(--layout-bg)]">
      {/* Left: Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-[var(--layout-text)]">
        {/* Organization */}
        <Button
          variant="ghost-flat"
          size="sm"
          className="p-1 h-auto text-[var(--layout-text)]"
          onClick={() => navigate("/organization/dashboard")}
        >
          <Building className="w-4 h-4 mr-1" />
          {userData?.organization?.name || "Organización"}
        </Button>
        
        {isProjectBasedSection && (
          <>
            <ChevronDown className="w-3 h-3 text-[var(--layout-text)] opacity-50" />
            
            {/* Project Selector */}
            <CustomRestricted feature="project_management">
              <ProjectSelector
                projects={projects}
                selectedProjectId={localSelectedProject || ''}
                onProjectChange={handleProjectChange}
                isLoading={updateProjectMutation.isPending}
                trigger={
                  <Button
                    variant="ghost-flat"
                    size="sm"
                    className="p-1 h-auto text-[var(--layout-text)]"
                  >
                    <Folder className="w-4 h-4 mr-1" />
                    {projects.find(p => p.id === localSelectedProject)?.name || "Seleccionar proyecto"}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                }
              />
            </CustomRestricted>
            
            <ChevronDown className="w-3 h-3 text-[var(--layout-text)] opacity-50" />
          </>
        )}
        
        {/* Current Section */}
        <Button
          variant="ghost-flat"
          size="sm"
          className="p-1 h-auto text-[var(--layout-text)]"
        >
          {getBreadcrumbIcon()}
          <span className="ml-1">{getCurrentSectionLabel()}</span>
        </Button>
      </div>

      {/* Center: Title and Search */}
      <div className="flex items-center space-x-4 flex-1 justify-center max-w-lg">
        {title && !isSearchOpen && (
          <div className="flex items-center space-x-2">
            {icon && (
              <div className="text-[var(--accent)]">
                {React.isValidElement(icon) ? icon : React.createElement(icon as React.ComponentType)}
              </div>
            )}
            <h1 className="text-lg font-semibold text-[var(--layout-text)]">{title}</h1>
          </div>
        )}
        
        {showSearch && (
          <div className="relative flex-1 max-w-md">
            {isSearchOpen ? (
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Buscar..."
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSearchOpen(false);
                    onSearchChange?.("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                className="w-full justify-start text-[var(--text-muted)]"
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar...
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Right: Filters and Actions */}
      <div className="flex items-center space-x-2">

        {/* Filters */}
        {showFilters && (filters.length > 0 || customFilters) && (
          <div className="flex items-center space-x-2">
            {filters.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {filters.map((filter, index) => (
                    <DropdownMenuItem key={index} onClick={filter.onClick}>
                      {filter.label}
                    </DropdownMenuItem>
                  ))}
                  {onClearFilters && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onClearFilters}>
                        <X className="w-4 h-4 mr-2" />
                        Limpiar filtros
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {customFilters}
            
            {onClearFilters && (searchValue || filters.some(f => f.label.includes("activo"))) && (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Actions */}
        {actions.map((action, index) => (
          <div key={index}>{action}</div>
        ))}
      </div>
    </div>
  );
}