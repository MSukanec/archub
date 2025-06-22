import { useState } from "react";
import { ChevronDown, Plus, Filter, X, Search, Building, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showFilters?: boolean;
  filters?: { label: string; onClick: () => void }[];
  customFilters?: React.ReactNode;
  onClearFilters?: () => void;
  actions?: React.ReactNode;
}

export function Header({
  title,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  showFilters = false,
  filters = [],
  customFilters,
  onClearFilters,
  actions,
}: HeaderProps = {}) {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjects(userData?.preferences?.last_organization_id);
  const { setSidebarContext, currentSidebarContext } = useNavigationStore();

  // Organization selection mutation
  const selectOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('Missing required data');
      }
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('id', userData.preferences.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });

  // Project selection mutation
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('Missing required data');
      }
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('id', userData.preferences.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });

  const currentOrganization = userData?.organization;
  const currentProject = projects.find(p => p.id === userData?.preferences?.last_project_id);
  const hasFilters = filters.length > 0 || customFilters;

  return (
    <header className="sticky top-0 z-50 h-9 border-b border-[var(--menues-border)] bg-[var(--menues-bg)] flex items-center justify-between gap-2">
      {/* Left side - Logo + Breadcrumb */}
      <div className="flex items-center gap-2">
        {/* Logo - exact same width as sidebar when collapsed */}
        <div className="w-[40px] h-9 flex items-center justify-center border-r border-[var(--menues-border)]">
          <span className="text-base font-bold leading-none text-[var(--menues-fg)]">A</span>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          {title && (
            <span className="text-sm font-medium text-[var(--menues-fg)]">{title}</span>
          )}

          {/* Organization - Text clickable + Dropdown arrow */}
          {!title && (
            <>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-sm font-medium text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
                  onClick={() => {
                    setSidebarContext('organization');
                    navigate('/proyectos');
                  }}
                >
                  {currentOrganization?.name || 'Sin organización'}
                </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[var(--menues-hover-bg)]"
              >
                <ChevronDown className="h-3 w-3 text-[var(--menues-fg)]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <div className="px-2 py-1.5 text-xs text-[var(--menues-fg)] opacity-70 font-medium">
                Buscar organización...
              </div>
              <DropdownMenuSeparator />
              {userData?.organizations?.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => selectOrganizationMutation.mutate(org.id)}
                  className="flex items-center justify-between"
                >
                  <span>{org.name}</span>
                  {org.id === currentOrganization?.id && (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="mr-2 h-4 w-4" />
                Nueva organización
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
              </div>

              {/* Only show project breadcrumb if NOT in organization context */}
              {currentSidebarContext !== 'organization' && (
                <>
                  <span className="text-[var(--menues-fg)] opacity-70">›</span>

            {/* Project - Text clickable + Dropdown arrow */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="h-8 px-2 text-sm font-medium text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
                onClick={() => {
                  setSidebarContext('project');
                  navigate('/dashboard');
                }}
              >
                {currentProject?.name || 'Sin proyecto'}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-[var(--menues-hover-bg)]"
                  >
                    <ChevronDown className="h-3 w-3 text-[var(--menues-fg)]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <div className="px-2 py-1.5 text-xs text-[var(--menues-fg)] opacity-70 font-medium">
                    Buscar proyecto...
                  </div>
                  <DropdownMenuSeparator />
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => selectProjectMutation.mutate(project.id)}
                      className="flex items-center justify-between"
                    >
                      <span>{project.name}</span>
                      {project.id === currentProject?.id && (
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo proyecto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
                </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right side - Search, Filters, Actions */}
      <div className="flex items-center gap-2 ml-auto pr-4">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[var(--menues-fg)] opacity-50" />
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="h-8 pl-7 pr-3 text-sm w-48"
            />
          </div>
        )}

        {showFilters && hasFilters && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={customFilters ? "w-72 p-2 space-y-3" : "w-48"}>
              {customFilters ? (
                customFilters
              ) : (
                filters.map((filter, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={filter.onClick}
                    className="text-sm"
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onClearFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearFilters}
            className="h-8 w-8"
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}