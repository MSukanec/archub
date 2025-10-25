import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
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
import { useCourseSidebarStore } from "@/stores/sidebarStore";
import { CourseSidebar } from "@/components/layout/CourseSidebar";

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
  const { selectedProjectId, setSelectedProject, setCurrentOrganization } = useProjectContext();
  
  const [expandedProjectSelector, setExpandedProjectSelector] = useState(false);
  
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

  // CourseSidebar state
  const { isVisible: isCourseSidebarVisible, modules, lessons, currentLessonId } = useCourseSidebarStore();

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
        { id: 'dashboard', label: 'Resumen de Organización', icon: Home, href: '/organization/dashboard' },
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
        { id: 'dashboard', label: 'Resumen de Proyecto', icon: Home, href: '/project/dashboard' },
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
        { id: 'community', label: 'Comunidad', icon: Users, href: '/admin/community' },
        { id: 'courses', label: 'Cursos', icon: BookOpen, href: '/admin/courses' },
        { id: 'tasks', label: 'Tareas', icon: ListTodo, href: '/admin/tasks' },
        { id: 'costs', label: 'Costos', icon: DollarSign, href: '/admin/costs' },
        { id: 'products', label: 'Productos', icon: Package, href: '/providers/products' },
        { id: 'general', label: 'General', icon: Settings, href: '/admin/general' },
      ];
    } else if (sidebarLevel === 'learning') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/learning/dashboard' },
        { id: 'courses', label: 'Cursos', icon: GraduationCap, href: '/learning/courses' },
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

  // Función para obtener el título del nivel actual
  const getCurrentTitle = () => {
    const titleMap = {
      'organization': 'Organización',
      'project': 'Proyecto',
      'admin': 'Administración',
      'learning': 'Capacitación'
    };
    return titleMap[sidebarLevel as keyof typeof titleMap] || 'Menú';
  };

  // Configuración de divisores con texto (igual que desktop)
  const getDividerInfo = (item: SidebarItem, index: number) => {
    if (sidebarLevel === 'organization') {
      if (item.id === 'dashboard') return { show: true, text: 'Gestión' };
      if (item.id === 'analysis') return { show: true, text: 'Finanzas' };
      if (item.id === 'expenses') return { show: true, text: 'Organización' };
    } else if (sidebarLevel === 'project') {
      if (item.id === 'dashboard') return { show: true, text: 'Planificación' };
      if (item.id === 'budgets') return { show: true, text: 'Recursos' };
      if (item.id === 'subcontracts') return { show: true, text: 'Ejecución' };
      if (item.id === 'logs') return { show: true, text: 'Comercialización' };
    } else if (sidebarLevel === 'learning') {
      if (item.id === 'dashboard') return { show: true, text: 'Capacitaciones' };
    } else if (sidebarLevel === 'admin') {
      if (item.id === 'courses') return { show: true, text: 'Administración' };
    }
    return { show: false, text: '' };
  };

  const menuContent = (
    <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9999 }} onClick={handleCloseMenu}>
      <div 
        className="fixed inset-0 flex flex-row overflow-hidden"
        style={{ 
          backgroundColor: 'var(--card-bg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Menu Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header con título ARCHUB y botón de cierre */}
          <div className="flex justify-between items-center h-14 px-4 pr-6 border-b border-[var(--main-sidebar-border)]">
            <h1 className="text-lg font-semibold text-[var(--main-sidebar-fg)]">
              {getCurrentTitle()}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseMenu}
              className="text-[var(--main-sidebar-fg)] p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Menu - Scrollable */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            <nav className="space-y-2">
              {navigationItems.map((item, index) => {
                const isActive = isButtonActive(item.href);
                const dividerInfo = getDividerInfo(item, index);
                
                const button = (
                  <button
                    onClick={() => {
                      navigate(item.href);
                      handleCloseMenu();
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                      isActive
                        ? "bg-[hsl(76,100%,40%)] text-white" 
                        : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--main-sidebar-fg)] hover:bg-[var(--card-hover-bg)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
                
                return (
                  <div key={item.id}>
                    {item.restricted ? (
                      <PlanRestricted reason={item.restricted}>
                        {button}
                      </PlanRestricted>
                    ) : (
                      button
                    )}
                    {dividerInfo.show && (
                      <div className="my-3 flex items-center gap-2 w-full">
                        <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                        <span className="text-[10px] font-medium text-[var(--main-sidebar-fg)] opacity-60 px-1">
                          {dividerInfo.text}
                        </span>
                        <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Bottom Controls */}
          <div className="p-4 space-y-2 border-t border-[var(--main-sidebar-border)]">
            {/* Inicio Button */}
            <button
              onClick={() => {
                setSidebarLevel('general');
                navigate('/home');
                handleCloseMenu();
              }}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                sidebarLevel === 'general'
                  ? "bg-[hsl(76,100%,40%)] text-white" 
                  : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--main-sidebar-fg)] hover:bg-[var(--card-hover-bg)]"
              )}
              data-testid="button-mobile-home"
            >
              <Home className="h-5 w-5" />
              Inicio
            </button>

            {/* Divider "Secciones" */}
            <div className="my-3 flex items-center gap-2 w-full">
              <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
              <span className="text-[10px] font-medium text-[var(--main-sidebar-fg)] opacity-60 px-1">
                Secciones
              </span>
              <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
            </div>

            {/* Organization Button */}
            <button
              onClick={() => {
                setSidebarLevel('organization');
                navigate('/organization/dashboard');
                handleCloseMenu();
              }}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                sidebarLevel === 'organization'
                  ? "bg-[hsl(76,100%,40%)] text-white" 
                  : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--main-sidebar-fg)] hover:bg-[var(--card-hover-bg)]"
              )}
            >
              <Building className="h-5 w-5" />
              Organización
            </button>

            {/* Project Button - solo si hay proyecto seleccionado */}
            {selectedProjectId && (
              <button
                onClick={() => {
                  if (sidebarLevel === 'project') {
                    setSidebarLevel('organization');
                  } else {
                    setSidebarLevel('project');
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                  sidebarLevel === 'project'
                    ? "bg-[hsl(76,100%,40%)] text-white" 
                    : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--main-sidebar-fg)] hover:bg-[var(--card-hover-bg)]"
                )}
              >
                <FolderOpen className="h-5 w-5" />
                Proyecto
              </button>
            )}

            {/* Admin Button - solo si es admin */}
            {isAdmin && (
              <button
                onClick={() => {
                  if (sidebarLevel === 'admin') {
                    setSidebarLevel('organization');
                  } else {
                    setSidebarLevel('admin');
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                  sidebarLevel === 'admin'
                    ? "bg-[hsl(76,100%,40%)] text-white" 
                    : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--main-sidebar-fg)] hover:bg-[var(--card-hover-bg)]"
                )}
              >
                <Crown className="h-5 w-5" />
                Administración
              </button>
            )}

            {/* Learning Button */}
            <button
              onClick={() => {
                if (sidebarLevel === 'learning') {
                  setSidebarLevel('organization');
                } else {
                  setSidebarLevel('learning');
                }
              }}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                sidebarLevel === 'learning'
                  ? "bg-[hsl(76,100%,40%)] text-white" 
                  : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--main-sidebar-fg)] hover:bg-[var(--card-hover-bg)]"
              )}
            >
              <GraduationCap className="h-5 w-5" />
              Capacitación
            </button>
          </div>

          {/* Footer con selector de proyecto y avatar */}
          <div className="p-4 border-t border-[var(--main-sidebar-border)]">
            <div className="flex items-center gap-3">
              {/* Selector de proyecto - lado izquierdo */}
              <div className="flex-1 relative">
                <button
                  onClick={() => setExpandedProjectSelector(!expandedProjectSelector)}
                  className="w-full p-3 text-left bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--main-sidebar-fg)] flex items-center shadow-sm hover:bg-[var(--card-hover-bg)] transition-colors duration-150"
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
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                    {projectsData?.map((project: any) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectSelect(project.id)}
                        className={cn(
                          "w-full p-3 text-left text-sm hover:bg-[var(--card-hover-bg)] transition-colors duration-150 text-[var(--main-sidebar-fg)]",
                          project.id === selectedProjectId && "bg-[hsl(76,100%,40%)] text-white"
                        )}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notificaciones */}
              <NotificationBell isExpanded={true} />

              {/* Avatar del usuario - lado derecho */}
              <Avatar 
                className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  navigate('/profile');
                  handleCloseMenu();
                }}
              >
                <AvatarImage src={userData?.user?.avatar_url} />
                <AvatarFallback className="bg-[var(--accent)] text-white text-sm">
                  {userData?.user?.full_name?.substring(0, 2)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* CourseSidebar - mostrar cuando isVisible === true */}
        {isCourseSidebarVisible && (
          <div className="w-[280px] border-l border-[var(--main-sidebar-border)]">
            <CourseSidebar 
              modules={modules}
              lessons={lessons}
              currentLessonId={currentLessonId}
            />
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}
