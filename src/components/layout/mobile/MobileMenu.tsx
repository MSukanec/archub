import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Building,
  FolderOpen,
  Home,
  Activity,
  Users,
  Settings,
  DollarSign,
  Calculator,
  Package,
  FileText,
  ChevronDown,
  History,
  Crown,
  GraduationCap,
  Layers,
  ListTodo,
  BookOpen,
  MessageCircle,
  Wallet,
  ChevronLeft,
  Headphones,
} from "lucide-react";
import { MobileMenuButton } from "./MobileMenuButton";
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface MobileMenuProps {
  onClose: () => void;
  isOpen: boolean;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  restricted?: "coming_soon" | string;
}

export function MobileMenu({ onClose }: MobileMenuProps): React.ReactPortal {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const { selectedProjectId, setSelectedProject } = useProjectContext();
  
  const [expandedProjectSelector, setExpandedProjectSelector] = useState(false);
  const [expandedOrganizationSelector, setExpandedOrganizationSelector] = useState(false);
  
  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const queryClient = useQueryClient();

  // Obtener organizaciones y proyectos
  const currentOrganization = userData?.organization;
  const { data: projectsData } = useProjects(currentOrganization?.id);
  
  // Obtener el proyecto actual para mostrar su nombre
  const currentProject = projectsData?.find((p: any) => p.id === selectedProjectId);
  const currentProjectName = currentProject?.name || "Seleccionar proyecto";
  const isAdmin = useIsAdmin();
  const { toast } = useToast();

  // Obtener notificaciones para el badge
  const { data: notifications } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    enabled: !!userData?.user?.id,
  });
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.read_at).length : 0;

  // Project selection mutation
  const projectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !userData?.organization?.id) {
        throw new Error('No user or organization available');
      }

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
      setSelectedProject(projectId);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
      setExpandedProjectSelector(false);
    }
  });

  // Function to check if a button is active
  const isButtonActive = (href: string) => {
    if (!href || href === '#') return false;
    if (href === '/organization/dashboard') {
      return location === '/organization/dashboard';
    }
    if (href.startsWith('http')) {
      return false; // External links are never "active"
    }
    return location === href || location.startsWith(href + '/');
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    projectMutation.mutate(projectId);
  };

  // Navegación según el nivel del sidebar (igual que desktop)
  const getNavigationItems = (): SidebarItem[] => {
    if (sidebarLevel === 'organization') {
      return [
        { id: 'dashboard', label: 'Visión General', icon: Home, href: '/organization/dashboard' },
        { id: 'projects', label: 'Gestión de Proyectos', icon: Building, href: '/organization/projects' },
        { id: 'contacts', label: 'Contactos', icon: Users, href: '/contacts' },
        { id: 'analysis', label: 'Análisis de Costos', icon: FileText, href: '/analysis' },
        { id: 'finances', label: 'Movimientos', icon: DollarSign, href: '/movements' },
        { id: 'capital', label: 'Capital', icon: Calculator, href: '/finances/capital' },
        { id: 'expenses', label: 'Gastos Generales', icon: FolderOpen, href: '/finances/general-costs' },
        { id: 'activity', label: 'Actividad', icon: Activity, href: '/organization/activity', restricted: 'coming_soon' },
        { id: 'preferences', label: 'Preferencias', icon: Settings, href: '/organization/preferences' },
      ];
    } else if (sidebarLevel === 'project' && selectedProjectId) {
      return [
        { id: 'dashboard', label: 'Visión General', icon: Home, href: '/project/dashboard' },
        { id: 'budgets', label: 'Cómputo y Presupuesto', icon: Calculator, href: '/budgets' },
        { id: 'personnel', label: 'Mano de Obra', icon: Users, href: '/construction/personnel', restricted: 'coming_soon' },
        { id: 'materials', label: 'Materiales', icon: Package, href: '/construction/materials', restricted: 'coming_soon' },
        { id: 'indirects', label: 'Indirectos', icon: Layers, href: '/construction/indirects', restricted: 'coming_soon' },
        { id: 'subcontracts', label: 'Subcontratos', icon: FileText, href: '/construction/subcontracts', restricted: 'coming_soon' },
        { id: 'logs', label: 'Bitácora', icon: History, href: '/construction/logs', restricted: 'coming_soon' },
        { id: 'clients', label: 'Clientes', icon: Users, href: '/clients', restricted: 'coming_soon' },
      ];
    } else if (sidebarLevel === 'admin' && isAdmin) {
      return [
        { id: 'administration', label: 'Administración', icon: Settings, href: '/admin/administration' },
        { id: 'support', label: 'Soporte', icon: Headphones, href: '/admin/support' },
        { id: 'payments', label: 'Pagos', icon: Wallet, href: '/admin/payments' },
        { id: 'courses', label: 'Cursos', icon: BookOpen, href: '/admin/courses' },
        { id: 'layout', label: 'Layout', icon: Layers, href: '/admin/layout' },
        { id: 'general', label: 'General', icon: Settings, href: '/admin/general' },
        { id: 'tasks', label: 'Tareas', icon: ListTodo, href: '/admin/tasks' },
        { id: 'costs', label: 'Costos', icon: DollarSign, href: '/admin/costs' },
        { id: 'products', label: 'Productos', icon: Package, href: '/providers/products' },
      ];
    } else if (sidebarLevel === 'learning') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/learning/dashboard' },
        { id: 'courses', label: 'Cursos', icon: GraduationCap, href: '/learning/courses' },
        { id: 'community', label: 'Comunidad Discord', icon: MessageCircle, href: 'https://discord.com/channels/868615664070443008' },
      ];
    }
    
    return [];
  };

  const navigationItems = getNavigationItems();

  const { closeMenu } = useMobileMenuStore();
  
  const handleCloseMenu = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeMenu();
    onClose();
  };

  // Función para obtener el título del menú según el nivel
  const getMenuTitle = (): string => {
    switch (sidebarLevel) {
      case 'general':
        return 'Menú';
      case 'organization':
        return 'Organización';
      case 'project':
        return 'Proyecto';
      case 'learning':
        return 'Capacitaciones';
      case 'admin':
        return 'Administración';
      default:
        return 'Menú';
    }
  };

  // Configuración de divisores con texto (igual que desktop)
  const getDividerInfo = (item: SidebarItem, index: number) => {
    if (sidebarLevel === 'organization') {
      if (item.id === 'dashboard') return { show: true, text: 'Gestión' };
      if (item.id === 'analysis') return { show: true, text: 'Finanzas' };
      if (item.id === 'activity') return { show: true, text: 'Organización' };
    } else if (sidebarLevel === 'project') {
      if (item.id === 'dashboard') return { show: true, text: 'Planificación' };
      if (item.id === 'budgets') return { show: true, text: 'Recursos' };
      if (item.id === 'subcontracts') return { show: true, text: 'Ejecución' };
      if (item.id === 'clients') return { show: true, text: 'Comercialización' };
    } else if (sidebarLevel === 'learning') {
      if (item.id === 'dashboard') return { show: true, text: 'Capacitaciones' };
    } else if (sidebarLevel === 'admin') {
      if (item.id === 'community') return { show: true, text: 'Administración' };
      if (item.id === 'general') return { show: true, text: 'Construcción' };
    }
    return { show: false, text: '' };
  };

  const menuContent = (
    <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9999 }} onClick={handleCloseMenu}>
      <div 
        className="fixed inset-0 flex flex-row overflow-hidden"
        style={{ 
          backgroundColor: 'var(--main-sidebar-bg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Menu Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center h-14 px-4 border-b border-[var(--main-sidebar-border)] bg-[var(--main-sidebar-bg)]">
            {sidebarLevel !== 'general' ? (
              <>
                <button
                  onClick={() => {
                    setSidebarLevel('general');
                  }}
                  className="flex items-center gap-2 flex-1 p-2 -ml-2 hover:bg-[var(--main-sidebar-button-hover-bg)] rounded-lg transition-colors"
                  data-testid="button-mobile-back"
                >
                  <ChevronLeft className="h-5 w-5 text-[var(--main-sidebar-fg)]" />
                  <h1 className="text-lg font-semibold !text-white">
                    {getMenuTitle()}
                  </h1>
                </button>
                <button
                  onClick={handleCloseMenu}
                  className="p-2 -mr-2 hover:bg-[var(--main-sidebar-button-hover-bg)] rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-[var(--main-sidebar-fg)]" />
                </button>
              </>
            ) : (
              <>
                <h1 className="text-lg font-semibold flex-1 !text-white">
                  {getMenuTitle()}
                </h1>
                <button
                  onClick={handleCloseMenu}
                  className="p-2 -mr-2 hover:bg-[var(--main-sidebar-button-hover-bg)] rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-[var(--main-sidebar-fg)]" />
                </button>
              </>
            )}
          </div>

          {/* Navigation Menu - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <nav>
              {sidebarLevel === 'general' ? (
                /* MENU GENERAL - NIVEL 1 */
                <>
                  <MobileMenuButton
                    icon={Home}
                    label="Inicio"
                    onClick={() => {
                      navigate('/home');
                      handleCloseMenu();
                    }}
                    isActive={location === '/home'}
                    showChevron={false}
                    testId="button-mobile-home"
                  />

                  <MobileMenuButton
                    icon={Building}
                    label="Organización"
                    onClick={() => {
                      setSidebarLevel('organization');
                    }}
                    isActive={location.startsWith('/organization') || location.startsWith('/contacts') || location.startsWith('/movements') || location.startsWith('/finances') || location.startsWith('/analysis')}
                    showChevron={true}
                    testId="button-mobile-organization"
                  />

                  <MobileMenuButton
                    icon={FolderOpen}
                    label="Proyecto"
                    onClick={() => {
                      if (!projectsData || projectsData.length === 0) {
                        toast({
                          title: "No hay proyectos creados",
                          description: "Crea un proyecto primero desde Organización",
                          variant: "destructive"
                        });
                        return;
                      }
                      if (!selectedProjectId) {
                        toast({
                          title: "No hay proyecto seleccionado",
                          description: "Selecciona un proyecto primero",
                          variant: "destructive"
                        });
                        return;
                      }
                      setSidebarLevel('project');
                    }}
                    isActive={location.startsWith('/project') || location.startsWith('/budgets') || location.startsWith('/construction') || location.startsWith('/clients')}
                    showChevron={true}
                    disabled={!projectsData || projectsData.length === 0}
                    testId="button-mobile-project"
                  />

                  <MobileMenuButton
                    icon={GraduationCap}
                    label="Capacitaciones"
                    onClick={() => {
                      setSidebarLevel('learning');
                    }}
                    isActive={location.startsWith('/learning')}
                    showChevron={true}
                    testId="button-mobile-learning"
                  />

                  {isAdmin && (
                    <MobileMenuButton
                      icon={Crown}
                      label="Administración"
                      onClick={() => {
                        setSidebarLevel('admin');
                      }}
                      isActive={location.startsWith('/admin')}
                      showChevron={true}
                      testId="button-mobile-admin"
                    />
                  )}
                </>
              ) : (
                /* MENU ESPECÍFICO - NIVEL 2 */
                <>
                  {navigationItems.map((item, index) => {
                    const isActive = isButtonActive(item.href);
                    const dividerInfo = getDividerInfo(item, index);
                    const isExternal = item.href.startsWith('http');
                    
                    const button = (
                      <MobileMenuButton
                        icon={item.icon}
                        label={item.label}
                        onClick={() => {
                          if (isExternal) {
                            window.open(item.href, '_blank');
                          } else {
                            navigate(item.href);
                            handleCloseMenu();
                          }
                        }}
                        isActive={isActive}
                        showChevron={false}
                        testId={`button-mobile-${item.id}`}
                      />
                    );
                    
                    return (
                      <div key={item.id}>
                        {/* Divisor de sección */}
                        {dividerInfo.show && (
                          <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--main-sidebar-fg)] opacity-60">
                            {dividerInfo.text}
                          </div>
                        )}
                        
                        {item.restricted ? (
                          <PlanRestricted reason={item.restricted}>
                            {button}
                          </PlanRestricted>
                        ) : (
                          button
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </nav>
          </div>

          {/* Footer con selector contextual y avatar */}
          <div className="p-4 border-t border-[var(--main-sidebar-border)]">
            <div className="flex items-center gap-3">
              {/* Selector contextual según sidebarLevel */}
              {sidebarLevel === 'organization' && (
                /* Selector de Organizaciones */
                <div className="flex-1 relative">
                  <button
                    onClick={() => setExpandedOrganizationSelector(!expandedOrganizationSelector)}
                    className="w-full p-3 text-left border-0 rounded-lg text-[var(--main-sidebar-fg)] flex items-center hover:bg-[var(--main-sidebar-button-hover-bg)] transition-colors duration-150"
                    style={{ backgroundColor: 'hsl(0, 0%, 20%)' }}
                  >
                    <Building className="h-5 w-5 mr-3" />
                    <span className="flex-1 truncate text-sm">
                      {currentOrganization?.name || "Seleccionar organización"}
                    </span>
                    <ChevronDown className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      expandedOrganizationSelector && "rotate-180"
                    )} />
                  </button>
                  
                  {/* Lista de organizaciones expandida */}
                  {expandedOrganizationSelector && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 border-0 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10" style={{ backgroundColor: 'hsl(0, 0%, 20%)' }}>
                      <button
                        className="w-full p-3 text-left text-sm bg-[hsl(76,100%,40%)] text-white"
                      >
                        {currentOrganization?.name || "Organización actual"}
                      </button>
                      <div className="p-3 text-center text-xs text-[var(--main-sidebar-fg)] opacity-60">
                        Multi-organización próximamente
                      </div>
                    </div>
                  )}
                </div>
              )}

              {sidebarLevel === 'project' && (
                /* Selector de Proyectos */
                <div className="flex-1 relative">
                  <button
                    onClick={() => setExpandedProjectSelector(!expandedProjectSelector)}
                    className="w-full p-3 text-left border-0 rounded-lg text-[var(--main-sidebar-fg)] flex items-center hover:bg-[var(--main-sidebar-button-hover-bg)] transition-colors duration-150"
                    style={{ backgroundColor: 'hsl(0, 0%, 20%)' }}
                  >
                    <FolderOpen className="h-5 w-5 mr-3" />
                    <span className="flex-1 truncate text-sm">
                      {currentProjectName}
                    </span>
                    <ChevronDown className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      expandedProjectSelector && "rotate-180"
                    )} />
                  </button>
                  
                  {/* Lista de proyectos expandida */}
                  {expandedProjectSelector && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 border-0 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10" style={{ backgroundColor: 'hsl(0, 0%, 20%)' }}>
                      {projectsData?.map((project: any) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project.id)}
                          className={cn(
                            "w-full p-3 text-left text-sm hover:bg-[var(--main-sidebar-button-hover-bg)] transition-colors duration-150 text-[var(--main-sidebar-fg)]",
                            project.id === selectedProjectId && "bg-[hsl(76,100%,40%)] text-white"
                          )}
                        >
                          {project.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Spacer para admin y learning (sin selector) */}
              {(sidebarLevel === 'admin' || sidebarLevel === 'learning' || sidebarLevel === 'general') && (
                <div className="flex-1" />
              )}

              {/* Avatar del usuario con badge de notificaciones */}
              <div className="relative">
                <Avatar 
                  className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity border-0 ring-0"
                  onClick={() => {
                    navigate('/profile');
                    handleCloseMenu();
                  }}
                >
                  <AvatarImage src={userData?.user?.avatar_url} />
                  <AvatarFallback className="bg-[var(--accent)] text-white text-sm border-0">
                    {userData?.user?.full_name?.substring(0, 2)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs border-2 border-[var(--card-bg)]"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}
