import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Building,
  FolderOpen,
  Folder,
  UserCircle,
  CheckSquare,
  Shield,
  Home,
  Mail,
  Activity,
  Users,
  Settings,
  DollarSign,
  Calculator,
  Package,
  Package2,
  FileText,
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  History,
  Contact,
  Database,
  Layout,
  Images,
  BookOpen,
  HandCoins,
  HardHat,
  Brush,
  NotebookPen,
  FileImage,
  FileCode,
  Crown,
  User,
  BarChart3,
  Handshake,
  Search,
  Tag,
  TrendingUp,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useMobileMenuStore } from "./useMobileMenuStore";
import { useProjects } from "@/hooks/use-projects";
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted";
import { useProjectContext } from "@/stores/projectContext";

interface MobileMenuProps {
  onClose: () => void;
  isOpen: boolean;
}

export function MobileMenu({ onClose }: MobileMenuProps): React.ReactPortal {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { currentSidebarContext, setSidebarContext, setActiveSidebarSection } = useNavigationStore();
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  const [expandedProjectSelector, setExpandedProjectSelector] = useState(false);

  // Estado local para forzar re-render
  const [isClosing, setIsClosing] = useState(false);
  
  // Estado para determinar si estamos en menu principal o submenu
  // Detectar automáticamente la sección basada en la ruta actual
  const getInitialView = () => {
    if (location === '/dashboard') return 'main';
    if (location.startsWith('/organization')) return 'organization';
    if (location.startsWith('/design') || location.startsWith('/construction') || location.startsWith('/finances')) return 'project';
    if (location.startsWith('/library')) return 'library';
    if (location.startsWith('/proveedor')) return 'provider';
    if (location.startsWith('/admin')) return 'admin';
    return 'main';
  };
  
  const [currentView, setCurrentView] = useState<'main' | string>(getInitialView());
  
  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  // Actualizar vista cuando cambie la ubicación
  useEffect(() => {
    const newView = getInitialView();
    setCurrentView(newView);
  }, [location]);

  const queryClient = useQueryClient();

  // Obtener organizaciones y proyectos
  const currentOrganization = userData?.organization;
  const sortedOrganizations = userData?.organizations || [];
  const { data: projectsData } = useProjects(currentOrganization?.id);
  
  // Usar project context en lugar de last_project_id directamente
  const { selectedProjectId, setSelectedProject, setCurrentOrganization } = useProjectContext();
  const effectiveCurrentProject = selectedProjectId;
  
  // Obtener el proyecto actual para mostrar su nombre
  const currentProject = projectsData?.find((p: any) => p.id === selectedProjectId);
  const currentProjectName = currentProject?.name || "Seleccionar proyecto";
  const isAdmin = useIsAdmin();

  // Organization selection mutation - Updated to use new system
  const organizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('No user preferences available');
      }

      // Update organization in user_preferences (this stays the same)
      const { error: orgError } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('id', userData.preferences.id);

      if (orgError) throw orgError;

      // Get projects for the new organization
      const { data: newOrgProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1);

      const firstProjectId = newOrgProjects?.[0]?.id || null;

      // Check if user already has preferences for this organization
      const { data: existingOrgPrefs } = await supabase
        .from('user_organization_preferences')
        .select('last_project_id')
        .eq('user_id', userData.user.id)
        .eq('organization_id', organizationId)
        .single();

      let projectToSelect = firstProjectId;

      if (existingOrgPrefs?.last_project_id) {
        // Verify the saved project still exists
        const projectExists = newOrgProjects?.some(p => p.id === existingOrgPrefs.last_project_id);
        if (projectExists) {
          projectToSelect = existingOrgPrefs.last_project_id;
        }
      }

      // If we have a project to select, save it in organization preferences
      if (projectToSelect) {
        await supabase
          .from('user_organization_preferences')
          .upsert(
            {
              user_id: userData.user.id,
              organization_id: organizationId,
              last_project_id: projectToSelect,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id,organization_id' }
          );
      }

      return { organizationId, firstProjectId: projectToSelect };
    },
    onSuccess: ({ organizationId, firstProjectId }) => {
      // Usar el nuevo método setCurrentOrganization que automáticamente carga el último proyecto
      setCurrentOrganization(organizationId);
      
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
      setExpandedProjectSelector(false);
      setSidebarContext('organization');
      setActiveSidebarSection('organizacion');
      navigate('/organization/dashboard');
    }
  });

  // Project selection mutation - Updated to use new system
  const projectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !userData?.organization?.id) {
        throw new Error('No user or organization available');
      }

      // Save project in organization preferences
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert(
          {
            user_id: userData.user.id,
            organization_id: userData.organization.id,
            last_project_id: projectId,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,organization_id' }
        );

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      // Actualizar el project context y las preferencias
      setSelectedProject(projectId);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
      setExpandedProjectSelector(false);
    }
  });

  const handleNavigationWithAnimation = (href: string, newContext?: string, direction?: 'left' | 'right') => {
    if (newContext && direction) {
      // Cambio inmediato sin animación
      setSidebarContext(newContext as any);
      navigate(href);
      // Scroll to top on mobile navigation
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else {
      // Para navegación normal (sin cambio de contexto), cerrar menú
      if (newContext) {
        setSidebarContext(newContext as any);
      }
      navigate(href);
      onClose();
      // Scroll to top on mobile navigation
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  const handleNavigation = (href: string, newContext?: string) => {
    if (newContext) {
      // Si hay cambio de contexto, no cerrar menú
      setSidebarContext(newContext as any);
      navigate(href);
      // Scroll to top on mobile navigation
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else {
      // Si no hay cambio de contexto, cerrar menú
      navigate(href);
      onClose();
      // Scroll to top on mobile navigation
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  // Function to check if a button is active based on current location
  const isButtonActive = (href: string) => {
    if (!href || href === '#') return false;
    // Special case for organization dashboard - should be active when on /dashboard or /organization/dashboard
    if (href === '/organization/dashboard') {
      return location === '/organization/dashboard' || location === '/dashboard';
    }
    return location === href || location.startsWith(href + '/');
  };

  const handleOrganizationSelect = (organizationId: string) => {
    organizationMutation.mutate(organizationId);
    // Clear project selection when organization changes (like desktop header)
    if (userData?.preferences?.id) {
      projectMutation.mutate('');
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    projectMutation.mutate(projectId);
  };

  const toggleAccordion = (key: string) => {
    setExpandedAccordion(prev => prev === key ? null : key);
  };

  // Definir contenido para cada nivel del sidebar móvil
  const mobileMenuContent = {
    main: [
      {
        id: 'dashboard',
        icon: Home,
        label: 'Dashboard',
        defaultRoute: '/dashboard',
        isActive: location === '/dashboard'
      },
      {
        id: 'organizacion',
        icon: Building,
        label: 'Organización',
        defaultRoute: '/organization',
        isActive: location.startsWith('/organization')
      },
      {
        id: 'proyecto',
        icon: HardHat,
        label: 'Proyecto',
        defaultRoute: '/construction/dashboard',
        isActive: location.startsWith('/design') || location.startsWith('/construction') || location.startsWith('/finances')
      },
      {
        id: 'biblioteca',
        icon: FolderOpen,
        label: 'Biblioteca',
        defaultRoute: '/library/documentation',
        isActive: location.startsWith('/library')
      },
      {
        id: 'proveedor',
        icon: Package,
        label: 'Proveedor',
        defaultRoute: '/proveedor/productos',
        isActive: location.startsWith('/proveedor')
      },
      ...(isAdmin ? [{
        id: 'administracion',
        icon: Crown,
        label: 'Administración',
        defaultRoute: '/admin/dashboard',
        isActive: location.startsWith('/admin')
      }] : [])
    ],
    organization: [
      { icon: Folder, label: 'Proyectos', href: '/organization/projects' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Database, label: 'Datos Básicos', href: '/organization/data' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Settings, label: 'Preferencias', href: '/organization/preferences' }
    ],
    project: [
      {
        id: 'diseno',
        icon: Brush,
        label: 'Diseño',
        defaultRoute: '/design/dashboard',
        restricted: true,
        submenu: [
          { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard' }
        ]
      },
      {
        id: 'construccion',
        icon: HardHat,
        label: 'Construcción',
        defaultRoute: '/construction/dashboard',
        submenu: [
          { icon: Home, label: 'Resumen', href: '/construction/dashboard' },
          { icon: CheckSquare, label: 'Tareas', href: '/construction/tasks' },
          { icon: Users, label: 'Personal', href: '/construction/personnel' },
          { icon: Handshake, label: 'Subcontratos', href: '/construction/subcontracts' },
          { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
          { icon: Package2, label: 'Materiales', href: '/construction/materials' },
          { icon: FileText, label: 'Bitácora', href: '/construction/logs' }
        ]
      },
      {
        id: 'finanzas',
        icon: DollarSign,
        label: 'Finanzas',
        defaultRoute: '/finances/dashboard',
        submenu: [
          { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
          { icon: DollarSign, label: 'Movimientos', href: '/finances/movements' },
          { icon: Users, label: 'Clientes', href: '/finances/clients' },
          { icon: BarChart3, label: 'Análisis de Obra', href: '/finances/analysis', restricted: true },
          { icon: TrendingUp, label: 'Movimientos de Capital', href: '/finances/capital-movements', restricted: true }
        ]
      }
    ],
    library: [
      { icon: FileText, label: 'Documentación', href: '/library/documentation' },
      { icon: Contact, label: 'Contactos', href: '/library/contacts' },
      { icon: Images, label: 'Galería', href: '/library/gallery' },
      { icon: Layout, label: 'Tablero', href: '/library/board' },
      { 
        id: 'analysis',
        icon: BarChart3, 
        label: 'Análisis', 
        defaultRoute: '/library/analysis',
        submenu: [
          { icon: CheckSquare, label: 'Tareas', href: '/library/analysis/tasks' },
          { icon: Package2, label: 'Materiales', href: '/library/analysis/materials' },
          { icon: Users, label: 'Mano de obra', href: '/library/analysis/labor' },
          { icon: TrendingUp, label: 'Gastos generales', href: '/library/analysis/overheads' }
        ]
      }
    ],
    provider: [
      { icon: Package, label: 'Productos', href: '/proveedor/productos' }
    ],
    admin: [
      { icon: Crown, label: 'Comunidad', href: '/admin/dashboard' },
      { icon: ListTodo, label: 'Tareas', href: '/admin/tasks' },
      { icon: Database, label: 'Materiales', href: '/admin/materials' },
      { icon: Settings, label: 'General', href: '/admin/general' }
    ]
  };


  // Función para obtener el título de la vista actual
  const getCurrentViewTitle = () => {
    if (currentView === 'main') return 'Menú Principal';
    
    const titleMap = {
      'organization': 'Organización',
      'project': 'Proyecto',
      'library': 'Biblioteca', 
      'provider': 'Proveedor',
      'admin': 'Administración'
    };
    
    return titleMap[currentView as keyof typeof titleMap] || 'Menú';
  };
  
  // Función para manejar navegación desde menu principal a submenu
  const handleMenuItemClick = (menuId: string, defaultRoute: string) => {
    // Dashboard no tiene submenu, navegar directamente y cerrar
    if (menuId === 'dashboard') {
      navigate(defaultRoute);
      handleCloseMenu();
      return;
    }
    
    // Cambiar al nivel correspondiente
    setCurrentView(menuId);
  };
  
  // Función para volver al menu principal
  const handleBackToMain = () => {
    setCurrentView('main');
  };

  const { closeMenu } = useMobileMenuStore();
  
  const handleCloseMenu = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeMenu();
    onClose();
  };

  const menuContent = (
    <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9999 }} onClick={handleCloseMenu}>
      <div 
        className="fixed inset-0 flex flex-col overflow-hidden"
        style={{ 
          backgroundColor: 'var(--menues-bg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con título ARCHUB y botón de cierre */}
        <div className="flex justify-between items-center h-14 px-4 pr-6 border-b border-[var(--menues-border)]">
          <h1 className="text-lg font-semibold text-[var(--menues-fg)]">
            ARCHUB
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseMenu}
            className="text-[var(--menues-fg)] p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-4 py-2 overflow-y-auto">
          {/* Título de la sección actual */}
          <div className="mb-4 pb-2 border-b border-[var(--menues-border)]">
            {currentView !== 'main' ? (
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--menues-fg)]">
                  {getCurrentViewTitle()}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToMain}
                  className="text-[var(--menues-fg)] p-2 hover:bg-[var(--card-hover-bg)]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-[var(--menues-fg)]">
                {getCurrentViewTitle()}
              </h2>
            )}
          </div>
          {currentView === 'main' ? (
            // Menu principal
            <nav className="space-y-2">
              {mobileMenuContent.main.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => handleMenuItemClick(item.id, item.defaultRoute)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                      item.isActive 
                        ? "bg-[hsl(76,100%,40%)] text-white" 
                        : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {item.id !== 'dashboard' && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </button>
                </div>
              ))}
            </nav>
          ) : (
            // Submenu - mostrar opciones de la sección seleccionada
            <nav className="space-y-2">
              {mobileMenuContent[currentView as keyof typeof mobileMenuContent]?.map((item, index) => {
                const hasSubmenu = 'submenu' in item && item.submenu;
                const isExpanded = expandedAccordion === ('id' in item ? item.id : null);
                
                return (
                  <div key={index}>
                    {('restricted' in item && item.restricted) ? (
                      <PlanRestricted reason="coming_soon" functionName={item.label}>
                        <button
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] opacity-50 shadow-button-normal"
                          disabled
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                          {hasSubmenu && <ChevronRight className="h-4 w-4 ml-auto" />}
                        </button>
                      </PlanRestricted>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (hasSubmenu && 'id' in item) {
                              toggleAccordion(item.id);
                            } else if ('href' in item) {
                              navigate(item.href);
                              handleCloseMenu();
                            } else if ('defaultRoute' in item) {
                              navigate(item.defaultRoute);
                              handleCloseMenu();
                            }
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                            (('href' in item && location === item.href) || ('defaultRoute' in item && location.startsWith(item.defaultRoute.split('/').slice(0, 2).join('/'))))
                              ? "bg-[hsl(76,100%,40%)] text-white" 
                              : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)]"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                          {hasSubmenu && (
                            <ChevronRight className={cn(
                              "h-4 w-4 ml-auto transition-transform duration-200",
                              isExpanded && "rotate-90"
                            )} />
                          )}
                        </button>
                        
                        {/* Submenu expandido */}
                        {hasSubmenu && isExpanded && (
                          <div className="ml-6 mt-2 space-y-1">
                            {item.submenu.map((subItem, subIndex) => (
                              <div key={subIndex}>
                                {('restricted' in subItem && subItem.restricted) ? (
                                  <PlanRestricted reason="coming_soon" functionName={subItem.label}>
                                    <button
                                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] opacity-50"
                                      disabled
                                    >
                                      <subItem.icon className="h-4 w-4" />
                                      {subItem.label}
                                    </button>
                                  </PlanRestricted>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      navigate(subItem.href);
                                      handleCloseMenu();
                                    }}
                                    className={cn(
                                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium rounded-lg transition-all duration-150",
                                      location === subItem.href
                                        ? "bg-[hsl(76,100%,40%)] text-white" 
                                        : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)]"
                                    )}
                                  >
                                    <subItem.icon className="h-4 w-4" />
                                    {subItem.label}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              }) || (
                <div className="text-center py-4 text-[var(--menues-fg)] opacity-60">
                  No hay opciones disponibles
                </div>
              )}
            </nav>
          )}
        </div>

        {/* Footer with project selector and avatar - Fixed at bottom */}
        <div className="px-4 pb-4 border-t border-[var(--card-border)] pt-4 flex-shrink-0">
          {/* Project Selector and Avatar Row */}
          <div className="flex items-center gap-3">
            {/* Project Selector Button - Takes most space */}
            <div className="relative flex-1">
              <button
                onClick={() => {
                  setExpandedProjectSelector(!expandedProjectSelector);
                }}
                className="w-full h-12 flex items-center justify-between px-3 rounded-xl transition-all duration-150 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)] shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5"
              >
                <span className="text-sm font-medium truncate">{currentProjectName}</span>
                <FolderOpen className="h-5 w-5 ml-2 flex-shrink-0" />
              </button>

              {expandedProjectSelector && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setExpandedProjectSelector(false)}>
                  <div 
                    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 border overflow-y-auto"
                    style={{ 
                      backgroundColor: 'var(--menues-bg)',
                      borderColor: 'var(--menues-border)',
                      width: 'calc(100vw - 32px)',
                      maxWidth: '400px',
                      maxHeight: '50vh',
                      zIndex: 60
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--menues-fg)' }}>Proyectos</h3>
                      <button
                        onClick={() => setExpandedProjectSelector(false)}
                        className=" rounded hover:bg-[var(--menues-hover-bg)] flex items-center justify-center"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--menues-fg)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {projectsData?.map((project: any) => (
                        <button
                          key={project.id}
                          onClick={() => {
                            projectMutation.mutate(project.id);
                            setExpandedProjectSelector(false);
                          }}
                          className="w-full px-3 py-3 text-left text-base hover:bg-[var(--menues-hover-bg)] transition-all duration-150 rounded-lg"
                          style={{ color: 'var(--menues-fg)' }}
                        >
                          {project.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar Button - Direct circular avatar as button */}
            <button
              onClick={() => {
                navigate('/profile');
                handleCloseMenu();
              }}
              className="p-0 border-0 bg-transparent hover:scale-105 transition-transform duration-150"
            >
              <Avatar className="h-12 w-12 shadow-button-normal hover:shadow-button-hover transition-shadow duration-150">
                {(userData?.user?.avatar_url && userData.user.avatar_url.trim() !== '') && (
                  <AvatarImage 
                    src={userData.user.avatar_url} 
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="text-sm font-medium bg-[var(--accent)] text-white">
                  {userData?.user?.email?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}