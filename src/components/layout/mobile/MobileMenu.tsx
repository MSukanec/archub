import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Building,
  FolderOpen,
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

  HandCoins,
  HardHat,
  Brush,
  NotebookPen,
  FileImage,
  FileCode,
  Crown,
  User,
  BarChart3,
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
import CustomRestricted from "@/components/ui-custom/CustomRestricted";
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
  const [currentView, setCurrentView] = useState<'main' | string>('main');
  
  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  // Resetear vista al main cuando se cierre el menú
  const { isOpen } = useMobileMenuStore();
  useEffect(() => {
    if (!isOpen && currentView !== 'main') {
      setCurrentView('main');
    }
  }, [isOpen, currentView]);

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

  // Mobile menu principal - exactamente igual que desktop sidebar
  const mainMenuItems = [
    { 
      id: 'organizacion', 
      icon: Building, 
      label: 'Organización', 
      defaultRoute: '/organization/dashboard',
      isActive: currentSidebarContext === 'organization' || location.startsWith('/organization') || location === '/dashboard' || location === '/tasks'
    },
    { 
      id: 'proyecto', 
      icon: FolderOpen, 
      label: 'Proyecto', 
      defaultRoute: '/project/dashboard',
      isActive: currentSidebarContext === 'project' || location.startsWith('/project')
    },
    { 
      id: 'diseno', 
      icon: Brush, 
      label: 'Diseño', 
      defaultRoute: '/design/dashboard',
      isActive: currentSidebarContext === 'design' || location.startsWith('/design'),
      restricted: true
    },
    { 
      id: 'construccion', 
      icon: HardHat, 
      label: 'Construcción', 
      defaultRoute: '/construction/dashboard',
      isActive: currentSidebarContext === 'construction' || location.startsWith('/construction')
    },
    { 
      id: 'finanzas', 
      icon: DollarSign, 
      label: 'Finanzas', 
      defaultRoute: '/finances/dashboard',
      isActive: currentSidebarContext === 'finances' || location.startsWith('/finances')
    },
    { 
      id: 'perfil', 
      icon: User, 
      label: 'Perfil', 
      defaultRoute: '/profile/data',
      isActive: currentSidebarContext === 'perfil' || location.startsWith('/profile')
    }
  ];

  // Submenus para cada sección principal (igual que SidebarSubmenu.tsx)
  const submenuContent = {
    perfil: [
      { icon: UserCircle, label: 'Datos Básicos', href: '/profile/data' },
      { icon: Settings, label: 'Preferencias', href: '/profile/settings' },
      { icon: Building, label: 'Gestión de Organizaciones', href: '/profile/organizations' },
    ],
    organizacion: [
      { icon: Home, label: 'Resumen de Organización', href: '/organization/dashboard' },
      { icon: FolderOpen, label: 'Proyectos', href: '/organization/projects' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: CheckSquare, label: 'Tareas', href: '/organization/tasks' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Database, label: 'Datos Básicos', href: '/organization/basic-data' },
      { icon: Settings, label: 'Preferencias', href: '/organization/preferences' },
    ],
    proyecto: [
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard' },
      { icon: NotebookPen, label: 'Datos Básicos', href: '/project/basic-data' },
      { icon: Users, label: 'Clientes', href: '/project/clients' },
      { icon: FileImage, label: 'Documentación', href: '/project/documentation' },
      { icon: Images, label: 'Galería Multimedia', href: '/project/gallery' },
    ],
    construccion: [
      { icon: Home, label: 'Resumen de Construcción', href: '/construction/dashboard' },
      { icon: CheckSquare, label: 'Tareas', href: '/construction/tasks' },
      { icon: Calendar, label: 'Cronograma', href: '/construction/schedule' },
      { icon: Package, label: 'Subcontratos', href: '/construction/subcontracts' },
      { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
      { icon: Package2, label: 'Materiales', href: '/construction/materials' },
      { icon: FileText, label: 'Bitácora', href: '/construction/logs' },
      { icon: Users, label: 'Asistencia', href: '/construction/personnel' },
      { icon: BarChart3, label: 'Análisis de Costos', href: '/construction/cost-analysis' },
    ],
    finanzas: [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
      { icon: DollarSign, label: 'Movimientos', href: '/finances/movements' },
      { icon: HandCoins, label: 'Aportes de Terceros', href: '/finances/installments' },
    ],
    diseno: [
      { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard' },
      { icon: Calendar, label: 'Cronograma', href: '/design/timeline' },
      { icon: Layout, label: 'Tablero', href: '/design/board', restricted: true },
      { icon: Calculator, label: 'Cómputo', href: '/design/compute', restricted: true },
    ],

    admin: [
      { icon: Home, label: 'Panel de Administración', href: '/admin/dashboard' },
      { icon: CheckSquare, label: 'Tareas Generadas', href: '/admin/generated-tasks' },
      { icon: Package2, label: 'Parámetros de Tareas', href: '/admin/task-parameters' },

      { icon: Package, label: 'Categorías de Tareas', href: '/admin/categories' },
      { icon: Users, label: 'Usuarios', href: '/admin/users' },
      { icon: Crown, label: 'Organizaciones', href: '/admin/organizations' },
      { icon: Shield, label: 'Roles', href: '/admin/roles' },
      { icon: DollarSign, label: 'Conceptos de Movimientos', href: '/admin/movement-concepts' },
      { icon: Package, label: 'Materiales', href: '/admin/materials' },
      { icon: FileText, label: 'Categorías de Materiales', href: '/admin/material-categories' },
    ]
  };

  // Agregar botón de administración después del menu principal (solo para admins)
  if (isAdmin) {
    mainMenuItems.push({
      id: 'admin',
      icon: Crown,
      label: 'Administración',
      defaultRoute: '/admin/dashboard',
      isActive: currentSidebarContext === 'admin' || location.startsWith('/admin')
    });
  }

  // Función para obtener el título de la vista actual
  const getCurrentViewTitle = () => {
    if (currentView === 'main') return 'Menú Principal';
    
    const titleMap = {
      'perfil': 'Perfil',
      'organizacion': 'Organización', 
      'proyecto': 'Proyecto',
      'construccion': 'Construcción',
      'finanzas': 'Finanzas',
      'diseno': 'Diseño',
      'admin': 'Administración'
    };
    
    return titleMap[currentView as keyof typeof titleMap] || 'Menú';
  };
  
  // Función para manejar navegación desde menu principal a submenu
  const handleMenuItemClick = (menuId: string, defaultRoute: string) => {
    setCurrentView(menuId);
    setSidebarContext(menuId as any);
    // NO navegar automáticamente al dashboard, solo cambiar vista a submenu
    // navigate(defaultRoute);
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
      <div 
        style={{ 
          backgroundColor: 'var(--menues-bg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con botón de cierre */}
          {currentView !== 'main' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToMain}
            >
              Volver
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseMenu}
          >
          </Button>
        </div>

        {/* Navigation Menu */}
          {/* Título de la sección actual */}
              {getCurrentViewTitle()}
            </h2>
          </div>
          {currentView === 'main' ? (
            // Menu principal - solo botones principales
              {mainMenuItems.map((item) => (
                <div key={item.id}>
                  {('restricted' in item && item.restricted) ? (
                    <CustomRestricted reason="coming_soon" functionName={item.label}>
                      <button
                        disabled
                      >
                        {item.label}
                      </button>
                    </CustomRestricted>
                  ) : (
                    <button
                      onClick={() => handleMenuItemClick(item.id, item.defaultRoute)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                        item.isActive 
                          ? "bg-[hsl(76,100%,40%)] text-white" 
                          : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)]"
                      )}
                    >
                      {item.label}
                    </button>
                  )}
                </div>
              ))}
            </nav>
          ) : (
            // Submenu - mostrar opciones de la sección seleccionada
              {submenuContent[currentView as keyof typeof submenuContent]?.map((item, index) => (
                <div key={index}>
                  {('restricted' in item && item.restricted) ? (
                    <CustomRestricted reason="coming_soon" functionName={item.label}>
                      <button
                        disabled
                      >
                        {item.label}
                      </button>
                    </CustomRestricted>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(item.href);
                        handleCloseMenu();
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                        location === item.href 
                          ? "bg-[hsl(76,100%,40%)] text-white" 
                          : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)]"
                      )}
                    >
                      {item.label}
                    </button>
                  )}
                </div>
              )) || (
                  No hay opciones disponibles
                </div>
              )}
            </nav>
          )}
        </div>

        {/* Footer with project selector - Fixed at bottom */}
          {/* Project Selector Button - Full width */}
            <button
              onClick={() => {
                setExpandedProjectSelector(!expandedProjectSelector);
              }}
            >
            </button>

            {expandedProjectSelector && (
              <div 
                style={{ 
                  backgroundColor: 'var(--menues-bg)',
                  borderColor: 'var(--menues-border)',
                }}
              >
                  Proyecto
                </div>
                {projectsData?.map((project: any) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      projectMutation.mutate(project.id);
                      setExpandedProjectSelector(false);
                    }}
                    style={{ color: 'var(--menues-fg)' }}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}