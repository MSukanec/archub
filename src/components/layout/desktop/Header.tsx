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
import { NewOrganizationModal } from "@/modals/organization/NewOrganizationModal";
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { MobileMenu } from "../mobile/MobileMenu";
import { useMobileMenuStore } from "../mobile/useMobileMenuStore";
import { MobileAvatarMenu } from "../mobile/MobileAvatarMenu";
import { useMobileAvatarMenuStore } from "../mobile/useMobileAvatarMenuStore";
import { useMobile } from "@/hooks/use-mobile";
import { ProjectSelector } from "@/components/navigation/ProjectSelector";
import { useProjectContext } from "@/stores/projectContext";
import { useEffect } from "react";

interface HeaderProps {
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

export function Header({
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
}: HeaderProps = {}) {
  const [showNewOrganizationModal, setShowNewOrganizationModal] = useState(false);
  const isMobile = useMobile();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { openModal } = useGlobalModalStore();
  const { isOpen: isMobileMenuOpen, openMenu, closeMenu } = useMobileMenuStore();
  const { isOpen: isMobileAvatarMenuOpen, openMenu: openAvatarMenu, closeMenu: closeAvatarMenu } = useMobileAvatarMenuStore();

  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjects(userData?.preferences?.last_organization_id);
  const { setSidebarContext, currentSidebarContext, setActiveSidebarSection } = useNavigationStore();
  const { selectedProjectId, setSelectedProject } = useProjectContext();
  
  // Estado local para tracking inmediato del proyecto seleccionado - NO más sincronización automática
  const [localSelectedProject, setLocalSelectedProject] = useState<string | null>(selectedProjectId);
  
  // Sincronizar localSelectedProject con userData cuando cambie desde otras páginas
  useEffect(() => {
    if (userData?.preferences?.last_project_id !== undefined) {
      setLocalSelectedProject(userData.preferences.last_project_id);
    }
  }, [userData?.preferences?.last_project_id]); // Sincronizar cuando cambie last_project_id

  // Initialize project context ONLY on first load - don't override user selections
  useEffect(() => {
    if (userData?.preferences !== undefined && selectedProjectId === null) {
      // Only restore if user hasn't explicitly chosen General mode
      const hasExplicitGeneralSelection = localStorage.getItem('explicit-general-mode') === 'true'
      if (!hasExplicitGeneralSelection && userData?.preferences?.last_project_id) {
        setSelectedProject(userData.preferences.last_project_id);
      }
    }
  }, [userData?.preferences?.last_project_id]); // Remove selectedProjectId from deps to prevent override

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
    mutationFn: async (projectId: string | null) => {
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

  const handleProjectSelect = (projectId: string | null) => {
    // Don't change selection if clicking the same project/state
    if (localSelectedProject === projectId) {
      return;
    }
    
    // Mark when user explicitly selects General mode
    if (projectId === null) {
      localStorage.setItem('explicit-general-mode', 'true')
    } else {
      localStorage.removeItem('explicit-general-mode')
    }
    
    // Actualizar estado local INMEDIATAMENTE para UI responsiva
    setLocalSelectedProject(projectId);
    
    // Luego actualizar context y BD en background
    setSelectedProject(projectId);
    selectProjectMutation.mutate(projectId);
  };

  const currentOrganization = userData?.organization;
  // Usar estado local para display inmediato, NO usar last_project_id como fallback
  const currentProject = localSelectedProject 
    ? projects.find(p => p.id === localSelectedProject)
    : null;

  // Function to get main sidebar section name based on current context
  const getMainSidebarSection = (context: string) => {
    const sectionMap: { [key: string]: string } = {
      'organization': 'Organización',
      'project': 'Proyecto',
      'design': 'Diseño', 
      'construction': 'Obra',
      'finances': 'Finanzas',
      'commercialization': 'Comercialización',
      'data': 'Datos Básicos',
      'postsale': 'Post-Venta',
      'admin': 'Administración'
    };
    
    return sectionMap[context] || null;
  };

  // Function to get accordion parent name based on current route
  const getAccordionParent = (path: string) => {
    // Map routes to their accordion parent names
    const routeParentMap: { [key: string]: string } = {
      // Finanzas accordion
      '/finance/dashboard': 'Finanzas',
      '/movimientos': 'Finanzas',
      
      // Obra accordion - NO mostrar "Obra" para páginas principales ya que está en el contexto de etapa
      '/construction/logs': null,
      '/construction/budgets': null,
      '/construction/materials': null,
      '/construction/personnel': null,
      // Galería NO debe tener accordion parent - el breadcrumb se forma con ORGANIZACIÓN / PROYECTO / ETAPA (Obra) / Galería
      // '/construction/gallery': removed - no accordion parent
      
      // Proyecto accordion (Design) - dashboard no debe mostrar "Proyecto" como accordion parent
      '/design/moodboard': 'Proyecto',
      '/design/documentacion': 'Proyecto',
      
      // Comercialización accordion
      '/commercialization/dashboard': 'Comercialización',
      '/commercialization/unidades': 'Comercialización',
      '/commercialization/clientes': 'Comercialización',
      '/commercialization/estadisticas': 'Comercialización'
    };
    
    return routeParentMap[path] || null;
  };

  const mainSidebarSection = getMainSidebarSection(currentSidebarContext);
  const accordionParent = getAccordionParent(location);
  const hasFilters = filters.length > 0 || customFilters;

  return (
    <>
    <header className="sticky top-0 z-50 h-14 md:h-9 border-b border-[var(--menues-border)] bg-[var(--menues-bg)] flex items-center justify-between gap-2">
      {/* Left side - Breadcrumb only */}
      <div className="flex items-center gap-2">

        {/* Mobile Avatar Button - visible only on mobile, positioned left */}
        <div className="md:hidden pl-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={openAvatarMenu}
            className="h-10 w-10 p-0 hover:bg-transparent"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={userData?.user?.avatar_url || ""} />
              <AvatarFallback className="text-sm bg-[var(--accent)] text-[var(--accent-foreground)]">
                {userData?.user_data?.first_name?.charAt(0) || userData?.user?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>

        {/* Mobile Title - visible only on mobile, positioned center */}
        <div className="md:hidden absolute left-1/2 transform -translate-x-1/2 max-w-[200px]">
          <h1 className="text-sm font-medium text-[var(--menues-fg)] truncate">
            {title || 'Archub'}
          </h1>
        </div>

        {/* Breadcrumb - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 px-3">
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
                    onClick={() => {
                      selectOrganizationMutation.mutate(org.id);
                      setSidebarContext('organization');
                      setActiveSidebarSection('organizacion');
                      navigate('/organization/dashboard');
                    }}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{org.name}</span>
                    {org.id === userData?.preferences?.last_organization_id && (
                      <div className="h-2 w-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/organizaciones')}>
                  <Building className="mr-2 h-4 w-4" />
                  Gestión de Organizaciones
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Project Breadcrumb - Show when there's a selected project or global view */}
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
                {localSelectedProject === null 
                  ? "General"
                  : currentProject?.name || "General"}
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
                    Cambiar proyecto...
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Lista de proyectos */}
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => handleProjectSelect(project.id)}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        <span className="truncate">{project.name}</span>
                      </div>
                      {localSelectedProject === project.id && (
                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                      )}
                    </DropdownMenuItem>
                  ))}
                  
                  {/* Separador */}
                  <DropdownMenuSeparator />
                  
                  {/* Opción General */}
                  <DropdownMenuItem
                    onClick={() => handleProjectSelect(null)}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">General</span>
                    </div>
                    {localSelectedProject === null && (
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>

          {/* Stage Breadcrumb - Show ONLY if in stage context (not project context) */}
          {['design', 'construction', 'finances', 'commercialization'].includes(currentSidebarContext) && (
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
                    else if (currentSidebarContext === 'finances') navigate('/finances/dashboard');
                    else if (currentSidebarContext === 'commercialization') navigate('/commercialization/dashboard');
                  }}
                >
                  {currentSidebarContext === 'design' && 'Diseño'}
                  {currentSidebarContext === 'construction' && 'Obra'}
                  {currentSidebarContext === 'finances' && 'Finanzas'}
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
                      Diseño
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
                        setSidebarContext('finances');
                        navigate('/finances/dashboard');
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

          {/* Section Navigation - Always show between PROJECT and PAGE */}
          <>
            <span className="text-[var(--menues-fg)] opacity-70">/</span>
            
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="h-8 px-2 text-sm font-medium text-[var(--menues-fg)] hover:bg-transparent hover:text-[var(--menues-fg)]"
                onClick={() => {
                  // Navigate to current section dashboard
                  if (currentSidebarContext === 'organization') navigate('/organization/dashboard');
                  else if (currentSidebarContext === 'project') navigate('/project/dashboard');
                  else if (currentSidebarContext === 'design') navigate('/design/dashboard');
                  else if (currentSidebarContext === 'construction') navigate('/construction/dashboard');
                  else if (currentSidebarContext === 'finances') navigate('/finances/dashboard');
                  else if (currentSidebarContext === 'commercialization') navigate('/commercialization/dashboard');
                  else if (currentSidebarContext === 'postsale') navigate('/postsale/dashboard');
                  else if (currentSidebarContext === 'admin') navigate('/admin/dashboard');
                }}
              >
                {currentSidebarContext === 'organization' && 'Organización'}
                {currentSidebarContext === 'project' && 'Proyecto'}
                {currentSidebarContext === 'design' && 'Diseño'}
                {currentSidebarContext === 'construction' && 'Obra'}
                {currentSidebarContext === 'finances' && 'Finanzas'}
                {currentSidebarContext === 'commercialization' && 'Comercialización'}
                {currentSidebarContext === 'postsale' && 'Post-Venta'}
                {currentSidebarContext === 'admin' && 'Administración'}
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
                    Seleccionar sección...
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSidebarContext('organization');
                      navigate('/organization/dashboard');
                    }}
                  >
                    Organización
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSidebarContext('project');
                      navigate('/project/dashboard');
                    }}
                  >
                    Proyecto
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSidebarContext('design');
                      navigate('/design/dashboard');
                    }}
                  >
                    <CustomRestricted functionName="Diseño">
                      Diseño
                    </CustomRestricted>
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
                      setSidebarContext('finances');
                      navigate('/finances/dashboard');
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
                    <CustomRestricted functionName="Comercialización">
                      Comercialización
                    </CustomRestricted>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSidebarContext('postsale');
                      navigate('/postsale/dashboard');
                    }}
                  >
                    <CustomRestricted functionName="Post-Venta">
                      Post-Venta
                    </CustomRestricted>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSidebarContext('admin');
                      navigate('/admin/dashboard');
                    }}
                  >
                    <CustomRestricted functionName="Administración">
                      Administración
                    </CustomRestricted>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>

          {/* Page Title - Show if title is provided */}
          {title && (
            <>
              <span className="text-[var(--menues-fg)] opacity-70">/</span>
              <div className="flex items-center gap-1">
                {icon && React.isValidElement(icon) && (
                  <span className="text-[var(--menues-fg)]">
                    {React.cloneElement(icon as React.ReactElement, { className: "h-3 w-3" })}
                  </span>
                )}
                {icon && typeof icon === 'function' && (
                  React.createElement(icon, { className: "h-3 w-3 text-[var(--menues-fg)]" })
                )}
                <span className="text-sm font-medium text-[var(--menues-fg)]">{title}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side - Search, Filters, Actions */}
      <div className="flex items-center gap-2 ml-auto pr-2">
        {/* Mobile Menu Button - visible on mobile only, positioned on the right */}
        <Button
          variant="ghost"
          size="icon"
          onClick={openMenu}
          className="md:hidden h-10 w-10 p-0 hover:bg-transparent"
        >
          <Menu className="h-10 w-10 text-[var(--menues-fg)]" />
        </Button>
        {/* Search, Filters, and Actions - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          {showSearch && (
            <div className="relative">
              {!isSearchOpen ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="h-8 w-8 hover:bg-[var(--button-ghost-hover-bg)]"
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
                    className="absolute right-1 h-6 w-6 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
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
                  className="h-8 w-8 hover:bg-[var(--button-ghost-hover-bg)]"
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
              className="h-8 w-8 hover:bg-[var(--button-ghost-hover-bg)]"
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          {actions && actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action, index) => (
                <div key={index} className="[&>button]:h-8 [&>button]:px-3 [&>button]:text-sm [&>button]:font-medium">
                  {action}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>

    {/* New Organization Modal */}
    {showNewOrganizationModal && (
      <NewOrganizationModal
        open={showNewOrganizationModal}
        onClose={() => setShowNewOrganizationModal(false)}
      />
    )}



    {/* Mobile Menu */}
    {isMobileMenuOpen && <MobileMenu onClose={closeMenu} isOpen={isMobileMenuOpen} />}
    
    {/* Mobile Avatar Menu */}
    {isMobileAvatarMenuOpen && <MobileAvatarMenu onClose={closeAvatarMenu} isOpen={isMobileAvatarMenuOpen} />}
    </>
  );
}