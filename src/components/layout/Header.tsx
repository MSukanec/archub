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
import { CustomRestricted } from "@/components/ui-custom/CustomRestricted";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";
import { NewOrganizationModal } from "@/modals/NewOrganizationModal";
import { NewProjectModal } from "@/modals/NewProjectModal";

interface HeaderProps {
  icon?: React.ComponentType<any>;
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

export function Header({
  icon: Icon,
  title,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  showFilters = true,
  filters = [],
  customFilters,
  onClearFilters,
  actions = [],
}: HeaderProps = {}) {
  const [showNewOrganizationModal, setShowNewOrganizationModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
      // No auto-redirect, just update selection
    }
  });

  const handleProjectSelect = (projectId: string) => {
    selectProjectMutation.mutate(projectId);
  };

  const currentOrganization = userData?.organization;
  const currentProject = projects.find(p => p.id === userData?.preferences?.last_project_id);
  const hasFilters = filters.length > 0 || customFilters;

  return (
    <>
    <header className="sticky top-0 z-50 h-9 border-b border-[var(--menues-border)] bg-[var(--menues-bg)] flex items-center justify-between gap-2">
      {/* Left side - Logo + Breadcrumb */}
      <div className="flex items-center gap-2">
        {/* Logo - exact same width as sidebar when collapsed */}
        <div className="w-[40px] h-9 flex items-center justify-center border-r border-[var(--menues-border)]">
          <span className="text-base font-bold leading-none text-[var(--menues-fg)]">A</span>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          {/* Organization Button - ALWAYS visible */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="h-8 px-2 text-sm font-medium text-[var(--menues-fg)] hover:bg-transparent hover:text-[var(--menues-fg)]"
              onClick={() => {
                setSidebarContext('organization');
                navigate('/organization/dashboard');
              }}
            >
              {userData?.organizations?.find(org => org.id === userData?.preferences?.last_organization_id)?.name || 'Sin organización'}
            </Button>
          
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-6 p-0 hover:bg-transparent"
                >
                  <ChevronDown className="h-3 w-3 text-[var(--menues-fg)]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="px-2 py-1.5 text-xs text-[var(--menues-fg)] opacity-70 font-medium">
                  Buscar organización...
                </div>
                <DropdownMenuSeparator />
                {userData?.organizations?.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => selectOrganizationMutation.mutate(org.id)}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{org.name}</span>
                    {org.id === userData?.preferences?.last_organization_id && (
                      <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div
                  className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-[var(--accent-bg)] focus:bg-[var(--accent-bg)]"
                  onClick={() => {
                    setShowNewOrganizationModal(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva organización
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/organizaciones')}>
                  <Building className="mr-2 h-4 w-4" />
                  Gestión de Organizaciones
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Project Breadcrumb - Show when there's a selected project */}
          {currentProject && (
            <>
              <span className="text-[var(--menues-fg)] opacity-70">/</span>
              
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-sm font-medium text-[var(--menues-fg)] hover:bg-transparent hover:text-[var(--menues-fg)]"
                  onClick={() => {
                    setSidebarContext('project');
                    navigate('/project/dashboard');
                  }}
                >
                  {currentProject?.name || 'Sin proyecto'}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-6 p-0 hover:bg-transparent"
                    >
                      <ChevronDown className="h-3 w-3 text-[var(--menues-fg)]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="px-2 py-1.5 text-xs text-[var(--menues-fg)] opacity-70 font-medium">
                      Buscar proyecto...
                    </div>
                    <DropdownMenuSeparator />
                    {projects.map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => handleProjectSelect(project.id)}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate">{project.name}</span>
                        {project.id === currentProject?.id && (
                          <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <CustomRestricted feature="max_projects" current={projects?.length || 0}>
                      <DropdownMenuItem 
                        className="text-sm"
                        onClick={() => setShowNewProjectModal(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo proyecto
                      </DropdownMenuItem>
                    </CustomRestricted>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          {/* Stage Breadcrumb - Show ONLY if in stage context (not project context) */}
          {['design', 'construction', 'commercialization'].includes(currentSidebarContext) && (
            <>
              <span className="text-[var(--menues-fg)] opacity-70">/</span>
              
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-sm font-medium text-[var(--menues-fg)] hover:bg-transparent hover:text-[var(--menues-fg)]"
                  onClick={() => {
                    // Navigate to current stage dashboard
                    if (currentSidebarContext === 'design') navigate('/design/dashboard');
                    else if (currentSidebarContext === 'construction') navigate('/construction/dashboard');
                    else if (currentSidebarContext === 'finance') navigate('/finance/dashboard');
                    else if (currentSidebarContext === 'commercialization') navigate('/commercialization/dashboard');
                  }}
                >
                  {currentSidebarContext === 'design' && 'Proyecto'}
                  {currentSidebarContext === 'construction' && 'Obra'}
                  {currentSidebarContext === 'finance' && 'Finanzas'}
                  {currentSidebarContext === 'commercialization' && 'Comercialización'}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-6 p-0 hover:bg-transparent"
                    >
                      <ChevronDown className="h-3 w-3 text-[var(--menues-fg)]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <div className="px-2 py-1.5 text-xs text-[var(--menues-fg)] opacity-70 font-medium">
                      Seleccionar etapa...
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSidebarContext('design');
                        navigate('/design/dashboard');
                      }}
                    >
                      Proyecto
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSidebarContext('construction');
                        navigate('/construction/dashboard');
                      }}
                    >
                      Obra
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSidebarContext('finance');
                        navigate('/finance/dashboard');
                      }}
                    >
                      Finanzas
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSidebarContext('commercialization');
                        navigate('/commercialization/dashboard');
                      }}
                    >
                      Comercialización
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          {/* Page Title - Show if title is provided */}
          {title && (
            <>
              <span className="text-[var(--menues-fg)] opacity-70">/</span>
              <span className="text-sm font-medium text-[var(--menues-fg)]">{title}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side - Search, Filters, Actions */}
      <div className="flex items-center gap-2 ml-auto pr-4">
        {showSearch && (
          <div className="relative">
            {!isSearchOpen ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="h-8 w-8"
              >
                <Search className="h-3 w-3" />
              </Button>
            ) : (
              <div className="relative flex items-center">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[var(--menues-fg)] opacity-50" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="h-8 pl-7 pr-8 text-sm w-48"
                  autoFocus
                  onBlur={() => {
                    if (!searchValue) {
                      setIsSearchOpen(false)
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onSearchChange?.("")
                    setIsSearchOpen(false)
                  }}
                  className="absolute right-1 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {hasFilters && (
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

        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <div key={index}>{action}</div>
            ))}
          </div>
        )}
      </div>
    </header>

    {/* New Organization Modal */}
    {showNewOrganizationModal && (
      <NewOrganizationModal
        open={showNewOrganizationModal}
        onClose={() => setShowNewOrganizationModal(false)}
      />
    )}

    {/* New Project Modal */}
    {showNewProjectModal && (
      <NewProjectModal
        open={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    )}
    </>
  );
}