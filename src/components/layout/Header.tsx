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
  
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjects(userData?.organization?.id);
  
  const currentProject = projects?.find(p => p.id === userData?.preferences?.last_project_id);

  // Mutation for project selection
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('user_id', userData?.user?.id);
        
      if (error) throw error;
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });

  const handleProjectSelect = (projectId: string) => {
    selectProjectMutation.mutate(projectId);
    setSidebarContext('project');
    navigate('/project/dashboard');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-10 bg-[var(--menues-bg)] border-b border-[var(--menues-border)] flex items-center">
        {/* Logo */}
        <div className="w-[40px] h-9 flex items-center justify-center border-r border-[var(--menues-border)]">
          <span className="text-base font-bold leading-none text-[var(--menues-fg)]">A</span>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          {/* Project Breadcrumb - First level breadcrumb */}
          {currentProject && (
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
          )}

          {/* Finance Breadcrumb - Show when in finance context */}
          {currentSidebarContext === 'finance' && (
            <>
              <span className="text-[var(--menues-fg)] opacity-70">/</span>
              <Button
                variant="ghost"
                className="h-8 px-2 text-sm font-medium text-[var(--menues-fg)] hover:bg-transparent hover:text-[var(--menues-fg)]"
                onClick={() => navigate('/finance/dashboard')}
              >
                Finanzas
              </Button>
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
                    else if (currentSidebarContext === 'commercialization') navigate('/commercialization/dashboard');
                  }}
                >
                  {currentSidebarContext === 'design' && 'Proyecto'}
                  {currentSidebarContext === 'construction' && 'Obra'}
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
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => {
                      setSidebarContext('design');
                      navigate('/design/dashboard');
                    }}>
                      <Folder className="mr-2 h-4 w-4" />
                      Proyecto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSidebarContext('construction');
                      navigate('/construction/dashboard');
                    }}>
                      <Building className="mr-2 h-4 w-4" />
                      Obra
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSidebarContext('commercialization');
                      navigate('/commercialization/dashboard');
                    }}>
                      <Folder className="mr-2 h-4 w-4" />
                      Comercialización
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          {/* Page Title - Show if title provided */}
          {title && (
            <>
              <span className="text-[var(--menues-fg)] opacity-70">/</span>
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 text-[var(--menues-fg)]" />}
                <span className="text-sm font-medium text-[var(--menues-fg)]">{title}</span>
              </div>
            </>
          )}
        </div>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-2 pr-4">
          {/* Search */}
          {showSearch && (
            <div className="relative">
              {isSearchOpen ? (
                <div className="absolute right-0 top-0 flex items-center">
                  <Input
                    type="text"
                    placeholder="Buscar..."
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="w-64 h-8 text-sm"
                    autoFocus
                    onBlur={() => setIsSearchOpen(false)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-1"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Filters */}
          {showFilters && (filters.length > 0 || customFilters) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {customFilters || (
                  <>
                    {filters.map((filter, index) => (
                      <DropdownMenuItem key={index} onClick={filter.onClick}>
                        {filter.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Clear Filters */}
          {onClearFilters && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClearFilters}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Actions */}
          {actions.map((action, index) => (
            <div key={index}>{action}</div>
          ))}
        </div>
      </header>

      {/* Modals */}
      <NewOrganizationModal 
        open={showNewOrganizationModal}
        onClose={() => setShowNewOrganizationModal(false)}
      />
      <NewProjectModal 
        open={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </>
  );
}