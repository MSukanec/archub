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
import { MobileMenu } from "./MobileMenu";
import { useMobileMenuStore } from "./useMobileMenuStore";
import { ProjectSelector } from "@/components/navigation/ProjectSelector";
import { useProjectContext } from "@/stores/projectContext";
import { useEffect } from "react";

interface HeaderMobileProps {
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

export function HeaderMobile({
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
}: HeaderMobileProps = {}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { openModal } = useGlobalModalStore();
  const { isOpen: isMobileMenuOpen, openMenu, closeMenu } = useMobileMenuStore();

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
      setSelectedProject(projectId || null);
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
    <>
      <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-[var(--layout-border)] bg-[var(--layout-bg)]">
        {/* Left: Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={openMenu}
          className="p-2"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Center: Title or Search */}
        <div className="flex-1 flex items-center justify-center px-4">
          {showSearch && isSearchOpen ? (
            <div className="flex items-center space-x-2 w-full max-w-sm">
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
            <div className="flex items-center space-x-2">
              {icon && (
                <div className="text-[var(--accent)]">
                  {React.isValidElement(icon) ? icon : React.createElement(icon as React.ComponentType)}
                </div>
              )}
              <h1 className="text-lg font-semibold text-[var(--layout-text)] truncate">
                {title || getCurrentSectionLabel()}
              </h1>
            </div>
          )}
        </div>

        {/* Right: Search and Actions */}
        <div className="flex items-center space-x-1">
          {showSearch && !isSearchOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="p-2"
            >
              <Search className="w-5 h-5" />
            </Button>
          )}

          {/* Filters */}
          {showFilters && (filters.length > 0 || customFilters) && !isSearchOpen && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Filter className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

          {/* Actions - Solo el primer action en mobile */}
          {actions.length > 0 && !isSearchOpen && (
            <div>{actions[0]}</div>
          )}
        </div>
      </div>

      {/* Mobile Menu renderizado desde Header.tsx - no duplicar aquí */}
    </>
  );
}