import { useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { useProject } from "@/hooks/use-projects";
import { cn } from "@/lib/utils";
import { useProjectContext } from '@/stores/projectContext';
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ButtonSidebar from "./ButtonSidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Settings, 
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  FolderOpen,
  Mail,
  Activity,
  PanelLeftOpen,
  PanelLeftClose,
  Calculator,
  History,
  Crown,
  Package,
  Layers,
  ListTodo,
  User,
  GraduationCap,
  BookOpen,
  ChevronDown,
  ArrowLeft,
  MessageCircle,
  Wallet,
  CreditCard,
  Headphones,
  BarChart3
} from "lucide-react";
import { SiDiscord } from 'react-icons/si';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  adminOnly?: boolean;
  restricted?: "coming_soon" | string;
}

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { selectedProjectId, currentOrganizationId, setSelectedProject, setCurrentOrganization } = useProjectContext();
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const { isDocked, isHovered, setHovered, setDocked } = useSidebarStore();
  const { toast } = useToast();
  
  // Estados simples
  const isExpanded = isDocked || isHovered;

  // Get projects data
  const { data: projectsLite = [] } = useProjectsLite(currentOrganizationId || undefined);
  const { data: currentProject } = useProject(selectedProjectId || undefined);
  const currentProjectName = currentProject?.name || "Seleccionar Proyecto";

  // PROJECT CHANGE MUTATION
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !currentOrganizationId) {
        throw new Error('Required data not available');
      }
      
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert({
          user_id: userData.user.id,
          organization_id: currentOrganizationId,
          last_project_id: projectId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,organization_id'
        })
      
      if (error) throw error
      return projectId;
    },
    onSuccess: (projectId) => {
      setSelectedProject(projectId, currentOrganizationId);
      setSidebarLevel('project');
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, currentOrganizationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    onError: (error) => {
      console.error('❌ Project selection error:', error)
      toast({
        title: "Error",
        description: "No se pudo seleccionar el proyecto",
        variant: "destructive"
      })
    }
  });

  const handleProjectChange = (projectId: string) => {
    selectProjectMutation.mutate(projectId);
  };

  // Navegación según el nivel del sidebar
  const getNavigationItems = (): SidebarItem[] => {
    if (sidebarLevel === 'general') {
      // Sidebar general - hub central
      return [];
    } else if (sidebarLevel === 'organization') {
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
        { id: 'basic-data', label: 'Datos Básicos', icon: FileText, href: '/project' },
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

  const handleDockToggle = () => {
    setDocked(!isDocked);
  };

  return (
    <div className="flex flex-row h-screen">
      {/* SIDEBAR PRINCIPAL */}
      <div 
        className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-r border-[var(--main-sidebar-border)] transition-all duration-150 z-10 overflow-hidden relative h-screen"
        style={{
          width: isDocked 
            ? '240px' 
            : (isHovered ? '240px' : '50px')
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <aside 
          className={cn(
            "grid h-screen grid-rows-[1fr_auto]",
            isExpanded ? "w-60" : "w-[50px]"
          )}
        >
          {/* SECCIÓN SUPERIOR: Navegación principal con scroll */}
          <div className="px-0 overflow-y-auto">
            {sidebarLevel === 'general' ? (
              /* SIDEBAR GENERAL - HUB CENTRAL */
              <div className={cn(
                "flex flex-col gap-[2px]",
                isExpanded ? "px-[9px]" : "items-center"
              )}>
                {/* Logo - altura igual al MainHeader para alineación perfecta */}
                <button
                  onClick={() => navigate('/home')}
                  className={cn(
                    "h-[50px] rounded-md cursor-pointer transition-colors flex items-center group overflow-hidden",
                    isExpanded ? "w-full" : "w-8"
                  )}
                >
                  {/* Logo siempre en la misma posición */}
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    <img 
                      src="/ArchubLogo.png" 
                      alt="Archub Logo" 
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                  
                  {/* Texto que aparece cuando se expande */}
                  {isExpanded && (
                    <div className="flex items-center overflow-hidden min-w-0 ml-3">
                      <span className="text-lg font-normal text-[var(--main-sidebar-fg)] group-hover:text-white truncate">
                        Archub
                      </span>
                    </div>
                  )}
                </button>
                
                {/* Espacio después del logo */}
                <div className="h-3"></div>
                
                {/* Botón Inicio */}
                <button
                  onClick={() => {
                    navigate('/home');
                  }}
                  className={cn(
                    "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                    isExpanded ? "w-full" : "w-8",
                    location === '/home' && "bg-[var(--main-sidebar-button-active-bg)]"
                  )}
                  data-testid="button-sidebar-home"
                >
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                      <Home className={cn(
                        "h-4 w-4 transition-colors",
                        location === '/home' ? "text-[var(--accent)]" : "text-[var(--main-sidebar-fg)]",
                        "group-hover:text-[var(--accent)]"
                      )} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="flex flex-col justify-center overflow-hidden min-w-0 ml-3">
                      <span className={cn(
                        "text-sm font-medium truncate text-left",
                        location === '/home' ? "text-white" : "text-[var(--main-sidebar-fg)]",
                        "group-hover:text-white"
                      )}>
                        Inicio
                      </span>
                      <span className={cn(
                        "text-xs truncate text-left",
                        location === '/home' ? "text-white opacity-100" : "text-[var(--main-sidebar-fg)] opacity-60",
                        "group-hover:text-white group-hover:opacity-100"
                      )}>
                        Página principal
                      </span>
                    </div>
                  )}
                </button>

                {/* Divisor "Profesionales" */}
                <div className="my-3 h-[12px] flex items-center justify-center w-full">
                  {isExpanded ? (
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                      <span className="text-[10px] font-medium text-[var(--main-sidebar-fg)] opacity-60 px-1 leading-none">
                        Profesionales
                      </span>
                      <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                    </div>
                  ) : (
                    <div className="w-8 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                  )}
                </div>
                
                {/* Botón Organización */}
                <button
                  onClick={() => {
                    setSidebarLevel('organization');
                    navigate('/organization/dashboard');
                  }}
                  className={cn(
                    "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                    isExpanded ? "w-full" : "w-8",
                    (location.startsWith('/organization') || location.startsWith('/contacts') || location.startsWith('/movements') || location.startsWith('/finances') || location.startsWith('/analysis')) && "bg-[var(--main-sidebar-button-active-bg)]"
                  )}
                >
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                      <Building className={cn(
                        "h-4 w-4 transition-colors",
                        (location.startsWith('/organization') || location.startsWith('/contacts') || location.startsWith('/movements') || location.startsWith('/finances') || location.startsWith('/analysis')) ? "text-[var(--accent)]" : "text-[var(--main-sidebar-fg)]",
                        "group-hover:text-[var(--accent)]"
                      )} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="flex flex-col justify-center overflow-hidden min-w-0 ml-3">
                      <span className={cn(
                        "text-sm font-medium truncate text-left",
                        (location.startsWith('/organization') || location.startsWith('/contacts') || location.startsWith('/movements') || location.startsWith('/finances') || location.startsWith('/analysis')) ? "text-white" : "text-[var(--main-sidebar-fg)]",
                        "group-hover:text-white"
                      )}>
                        Organización
                      </span>
                      <span className={cn(
                        "text-xs truncate text-left",
                        (location.startsWith('/organization') || location.startsWith('/contacts') || location.startsWith('/movements') || location.startsWith('/finances') || location.startsWith('/analysis')) ? "text-white opacity-100" : "text-[var(--main-sidebar-fg)] opacity-60",
                        "group-hover:text-white group-hover:opacity-100"
                      )}>
                        Gestión empresarial
                      </span>
                    </div>
                  )}
                </button>

                {/* Botón Proyecto */}
                <button
                  onClick={() => {
                    if (projectsLite.length === 0) {
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
                    navigate('/project/dashboard');
                  }}
                  disabled={projectsLite.length === 0}
                  className={cn(
                    "h-10 rounded-md transition-colors flex items-center group overflow-hidden",
                    isExpanded ? "w-full" : "w-8",
                    projectsLite.length === 0 
                      ? "opacity-50 cursor-not-allowed" 
                      : "cursor-pointer hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white",
                    (location.startsWith('/project') || location.startsWith('/budgets') || location.startsWith('/construction') || location.startsWith('/clients')) && "bg-[var(--main-sidebar-button-active-bg)]"
                  )}
                >
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                      <FolderOpen className={cn(
                        "h-4 w-4 transition-colors",
                        projectsLite.length === 0 
                          ? "text-[var(--main-sidebar-fg)] opacity-50"
                          : (location.startsWith('/project') || location.startsWith('/budgets') || location.startsWith('/construction') || location.startsWith('/clients')) 
                            ? "text-[var(--accent)]" 
                            : "text-[var(--main-sidebar-fg)]",
                        projectsLite.length > 0 && "group-hover:text-[var(--accent)]"
                      )} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="flex flex-col justify-center overflow-hidden min-w-0 ml-3">
                      <span className={cn(
                        "text-sm font-medium truncate text-left",
                        projectsLite.length === 0
                          ? "text-[var(--main-sidebar-fg)] opacity-50"
                          : (location.startsWith('/project') || location.startsWith('/budgets') || location.startsWith('/construction') || location.startsWith('/clients')) 
                            ? "text-white" 
                            : "text-[var(--main-sidebar-fg)]",
                        projectsLite.length > 0 && "group-hover:text-white"
                      )}>
                        Proyecto
                      </span>
                      <span className={cn(
                        "text-xs truncate text-left",
                        projectsLite.length === 0
                          ? "text-[var(--main-sidebar-fg)] opacity-30"
                          : (location.startsWith('/project') || location.startsWith('/budgets') || location.startsWith('/construction') || location.startsWith('/clients')) 
                            ? "text-white opacity-100" 
                            : "text-[var(--main-sidebar-fg)] opacity-60",
                        projectsLite.length > 0 && "group-hover:text-white group-hover:opacity-100"
                      )}>
                        {projectsLite.length === 0 ? "Crea un proyecto primero" : "Gestión de obras"}
                      </span>
                    </div>
                  )}
                </button>

                {/* Divisor "Comunidad" */}
                <div className="my-3 h-[12px] flex items-center justify-center w-full">
                  {isExpanded ? (
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                      <span className="text-[10px] font-medium text-[var(--main-sidebar-fg)] opacity-60 px-1 leading-none">
                        Comunidad
                      </span>
                      <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                    </div>
                  ) : (
                    <div className="w-8 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                  )}
                </div>

                {/* Botón Capacitaciones */}
                <button
                  onClick={() => {
                    setSidebarLevel('learning');
                    navigate('/learning/dashboard');
                  }}
                  className={cn(
                    "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                    isExpanded ? "w-full" : "w-8",
                    location.startsWith('/learning') && "bg-[var(--main-sidebar-button-active-bg)]"
                  )}
                >
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                      <GraduationCap className={cn(
                        "h-4 w-4 transition-colors",
                        location.startsWith('/learning') ? "text-[var(--accent)]" : "text-[var(--main-sidebar-fg)]",
                        "group-hover:text-[var(--accent)]"
                      )} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="flex flex-col justify-center overflow-hidden min-w-0 ml-3">
                      <span className={cn(
                        "text-sm font-medium truncate text-left",
                        location.startsWith('/learning') ? "text-white" : "text-[var(--main-sidebar-fg)]",
                        "group-hover:text-white"
                      )}>
                        Capacitaciones
                      </span>
                      <span className={cn(
                        "text-xs truncate text-left",
                        location.startsWith('/learning') ? "text-white opacity-100" : "text-[var(--main-sidebar-fg)] opacity-60",
                        "group-hover:text-white group-hover:opacity-100"
                      )}>
                        Cursos y formación
                      </span>
                    </div>
                  )}
                </button>

                {/* Botón Analytics - solo si es admin */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setSidebarLevel('admin');
                      navigate('/admin/dashboard');
                    }}
                    className={cn(
                      "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                      isExpanded ? "w-full" : "w-8",
                      location === '/admin/dashboard' && "bg-[var(--main-sidebar-button-active-bg)]"
                    )}
                    data-testid="sidebar-button-analytics"
                  >
                    <div className="flex items-center justify-center w-8 flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                        <BarChart3 className={cn(
                          "h-4 w-4 transition-colors",
                          location === '/admin/dashboard' ? "text-[var(--accent)]" : "text-[var(--main-sidebar-fg)]",
                          "group-hover:text-[var(--accent)]"
                        )} />
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="flex flex-col justify-center overflow-hidden min-w-0 ml-3">
                        <span className={cn(
                          "text-sm font-medium truncate text-left",
                          location === '/admin/dashboard' ? "text-white" : "text-[var(--main-sidebar-fg)]",
                          "group-hover:text-white"
                        )}>
                          Analytics
                        </span>
                        <span className={cn(
                          "text-xs truncate text-left",
                          location === '/admin/dashboard' ? "text-white opacity-100" : "text-[var(--main-sidebar-fg)] opacity-60",
                          "group-hover:text-white group-hover:opacity-100"
                        )}>
                          Métricas y análisis
                        </span>
                      </div>
                    )}
                  </button>
                )}

                {/* Botón Administración - solo si es admin */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setSidebarLevel('admin');
                      navigate('/admin/administration');
                    }}
                    className={cn(
                      "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                      isExpanded ? "w-full" : "w-8",
                      location.startsWith('/admin') && location !== '/admin/dashboard' && "bg-[var(--main-sidebar-button-active-bg)]"
                    )}
                    data-testid="sidebar-button-administration"
                  >
                    <div className="flex items-center justify-center w-8 flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                        <Settings className={cn(
                          "h-4 w-4 transition-colors",
                          (location.startsWith('/admin') && location !== '/admin/dashboard') ? "text-[var(--accent)]" : "text-[var(--main-sidebar-fg)]",
                          "group-hover:text-[var(--accent)]"
                        )} />
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="flex flex-col justify-center overflow-hidden min-w-0 ml-3">
                        <span className={cn(
                          "text-sm font-medium truncate text-left",
                          (location.startsWith('/admin') && location !== '/admin/dashboard') ? "text-white" : "text-[var(--main-sidebar-fg)]",
                          "group-hover:text-white"
                        )}>
                          Administración
                        </span>
                        <span className={cn(
                          "text-xs truncate text-left",
                          (location.startsWith('/admin') && location !== '/admin/dashboard') ? "text-white opacity-100" : "text-[var(--main-sidebar-fg)] opacity-60",
                          "group-hover:text-white group-hover:opacity-100"
                        )}>
                          Panel de control
                        </span>
                      </div>
                    )}
                  </button>
                )}
              </div>
            ) : (
              /* SIDEBARS ESPECÍFICOS */
              <div className={cn(
                "flex flex-col gap-[2px]",
                isExpanded ? "px-[9px]" : "items-center"
              )}>
                {/* Logo - altura igual al MainHeader para alineación perfecta */}
                <button
                  onClick={() => {
                    setSidebarLevel('general');
                    navigate('/home');
                  }}
                  className={cn(
                    "h-[50px] rounded-md cursor-pointer transition-colors flex items-center group overflow-hidden",
                    isExpanded ? "w-full justify-between" : "w-8"
                  )}
                >
                  <div className="flex items-center overflow-hidden">
                    {/* Logo siempre en la misma posición */}
                    <div className="flex items-center justify-center w-8 flex-shrink-0">
                      <img 
                        src="/ArchubLogo.png" 
                        alt="Archub Logo" 
                        className="h-8 w-auto object-contain"
                      />
                    </div>
                    
                    {/* Texto que aparece cuando se expande - Nombre de la sección */}
                    {isExpanded && (
                      <div className="flex items-center overflow-hidden min-w-0 ml-3">
                        <span className="text-lg font-normal text-[var(--main-sidebar-fg)] group-hover:text-white truncate">
                          {sidebarLevel === 'organization' ? 'Organización' :
                           sidebarLevel === 'project' ? 'Proyecto' :
                           sidebarLevel === 'learning' ? 'Capacitaciones' :
                           sidebarLevel === 'admin' ? 'Administración' : 'Archub'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Icono de volver - solo se muestra cuando está expandido */}
                  {isExpanded && (
                    <ArrowLeft className="h-4 w-4 text-[var(--main-sidebar-fg)] opacity-60 group-hover:text-white group-hover:opacity-100 flex-shrink-0" />
                  )}
                </button>
                
                {/* Espacio después del logo */}
                <div className="h-3"></div>

                {/* {/* Selector de Organización - solo en sidebar de organización */}
                {/* {sidebarLevel === 'organization' && (
                  <div className="h-16 flex items-center justify-center mb-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                            isExpanded ? "w-full" : "w-8"
                          )}
                        >
                          {/* Icono siempre centrado */}
                          {/* <div className="flex items-center justify-center w-8 flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                              <Building className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                            </div>
                          </div> */}
                          
                          {/* Texto que aparece cuando se expande */}
                          {/* {isExpanded && (
                            <div className="flex flex-1 items-center justify-between overflow-hidden min-w-0 ml-3">
                              <div className="flex flex-col justify-center overflow-hidden min-w-0">
                                <span className="text-sm font-medium text-[var(--main-sidebar-fg)] group-hover:text-white truncate text-left">
                                  {userData?.organization?.name || "Sin organización"}
                                </span>
                                <span className="text-xs text-[var(--main-sidebar-fg)] opacity-60 group-hover:text-white group-hover:opacity-100 truncate text-left">
                                  Cambiar organización
                                </span>
                              </div>
                              <ChevronDown className="h-4 w-4 text-[var(--main-sidebar-fg)] opacity-60 group-hover:text-white group-hover:opacity-100 flex-shrink-0 ml-2" />
                            </div>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        side="right" 
                        align="start"
                        className="w-64 p-2"
                      >
                        <div className="space-y-1">
                          <div className="px-2 py-1.5">
                            <p className="text-xs font-semibold text-muted-foreground">Organizaciones</p>
                          </div>
                          {!userData?.organizations || userData.organizations.length === 0 ? (
                            <div className="px-2 py-4 text-center">
                              <p className="text-sm text-muted-foreground">No hay organizaciones disponibles</p>
                            </div>
                          ) : (
                            userData.organizations.map((org: any) => (
                              <button
                                key={org.id}
                                onClick={() => {
                                  setCurrentOrganization(org.id);
                                  queryClient.invalidateQueries({ queryKey: ['current-user'] });
                                  queryClient.invalidateQueries({ queryKey: ['projects'] });
                                }}
                                className={cn(
                                  "w-full px-2 py-2 text-left text-sm rounded-md transition-colors",
                                  org.id === currentOrganizationId
                                    ? "bg-accent/10 text-accent font-medium"
                                    : "hover:bg-accent/5"
                                )}
                              >
                                {org.name}
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )} */}
                
                {/* {/* Selector de Proyecto - solo en sidebar de proyecto */}
                {/* {sidebarLevel === 'project' && (
                  <div className="h-16 flex items-center justify-center mb-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                            isExpanded ? "w-full" : "w-8"
                          )}
                        >
                          {/* Icono siempre centrado */}
                          {/* <div className="flex items-center justify-center w-8 flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                              <FolderOpen className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                            </div>
                          </div> */}
                          
                          {/* Texto que aparece cuando se expande */}
                          {/* {isExpanded && (
                            <div className="flex flex-1 items-center justify-between overflow-hidden min-w-0 ml-3">
                              <div className="flex flex-col justify-center overflow-hidden min-w-0">
                                <span className="text-sm font-medium text-[var(--main-sidebar-fg)] group-hover:text-white truncate text-left">
                                  {currentProjectName}
                                </span>
                                <span className="text-xs text-[var(--main-sidebar-fg)] opacity-60 group-hover:text-white group-hover:opacity-100 truncate text-left">
                                  Cambiar proyecto
                                </span>
                              </div>
                              <ChevronDown className="h-4 w-4 text-[var(--main-sidebar-fg)] opacity-60 group-hover:text-white group-hover:opacity-100 flex-shrink-0 ml-2" />
                            </div>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        side="right" 
                        align="start"
                        className="w-64 p-2"
                      >
                        <div className="space-y-1">
                          <div className="px-2 py-1.5">
                            <p className="text-xs font-semibold text-muted-foreground">Proyectos</p>
                          </div>
                          {projectsLite.length === 0 ? (
                            <div className="px-2 py-4 text-center">
                              <p className="text-sm text-muted-foreground">No hay proyectos disponibles</p>
                            </div>
                          ) : (
                            projectsLite.map((project) => (
                              <button
                                key={project.id}
                                onClick={() => handleProjectChange(project.id)}
                                className={cn(
                                  "w-full px-2 py-2 text-left text-sm rounded-md transition-colors",
                                  project.id === selectedProjectId
                                    ? "bg-accent/10 text-accent font-medium"
                                    : "hover:bg-accent/5"
                                )}
                              >
                                {project.name}
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )} */}
                
                {navigationItems.map((item, index) => {
                if (item.adminOnly && !isAdmin) return null;
                
                const isActive = location === item.href;
                // Configuración de divisores con texto
                const getDividerInfo = () => {
                  if (sidebarLevel === 'organization') {
                    if (item.id === 'dashboard') return { show: true, text: 'Gestión' };
                    if (item.id === 'analysis') return { show: true, text: 'Finanzas' };
                    if (item.id === 'activity') return { show: true, text: 'Organización' };
                  } else if (sidebarLevel === 'project') {
                    if (item.id === 'dashboard') return { show: true, text: 'Planificación' };
                    if (item.id === 'basic-data') return { show: true, text: 'Recursos' };
                    if (item.id === 'subcontracts') return { show: true, text: 'Ejecución' };
                    if (item.id === 'logs') return { show: true, text: 'Comercialización' };
                  } else if (sidebarLevel === 'learning') {
                    if (item.id === 'dashboard') return { show: true, text: 'Capacitaciones' };
                  } else if (sidebarLevel === 'admin') {
                    if (item.id === 'community') return { show: true, text: 'Administración' };
                    if (item.id === 'general') return { show: true, text: 'Construcción' };
                  }
                  return { show: false, text: '' };
                };

                const dividerInfo = getDividerInfo();
                
                // Botón con o sin restricción
                const isExternalLink = item.href.startsWith('http');
                const button = (
                  <ButtonSidebar
                    icon={<item.icon className="w-[18px] h-[18px]" />}
                    label={item.label}
                    isActive={isActive}
                    isExpanded={isExpanded}
                    onClick={() => {
                      if (isExternalLink) {
                        window.open(item.href, '_blank', 'noopener,noreferrer');
                      } else {
                        navigate(item.href);
                      }
                    }}
                    href={item.href}
                    variant="secondary"
                  />
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
                      <div className="my-3 h-[12px] flex items-center justify-center w-full">
                        {isExpanded ? (
                          // Divisor con texto cuando está expandido
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                            <span className="text-[10px] font-medium text-[var(--main-sidebar-fg)] opacity-60 px-1 leading-none">
                              {dividerInfo.text}
                            </span>
                            <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                          </div>
                        ) : (
                          // Línea simple cuando está colapsado - centrada en los 32px del botón
                          <div className="w-8 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* SECCIÓN INFERIOR: Controles y Avatar (siempre pegados al fondo) */}
          <div className={cn(
            "pt-3 pb-3 flex flex-col gap-[2px]",
            isExpanded ? "px-[9px]" : "items-center"
          )}>
            {/* Botón de Anclar */}
            <ButtonSidebar
              icon={isDocked ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
              label={isDocked ? "Desanclar" : "Anclar"}
              isActive={false}
              isExpanded={isExpanded}
              onClick={handleDockToggle}
              variant="secondary"
            />

            {/* Notificaciones - Ahora está en el header */}
            {/* <NotificationBell isExpanded={isExpanded} /> */}

            {/* Avatar del Usuario - Ahora está en el header */}
            {/* <button
              className={cn(
                "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                isExpanded ? "w-full" : "w-8"
              )}
              onClick={() => navigate('/profile')}
            >
              <div className="flex items-center justify-center w-8 flex-shrink-0">
                <Avatar className="h-8 w-8 flex-shrink-0 ring-0 border-0">
                  <AvatarFallback className="bg-[var(--accent)] text-white text-sm font-semibold border-0">
                    {userData?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {isExpanded && (
                <div className="flex flex-col justify-center overflow-hidden min-w-0 ml-3">
                  <span className="text-sm font-medium text-[var(--main-sidebar-fg)] group-hover:text-white truncate text-left">
                    {userData?.user?.full_name || 'Usuario'}
                  </span>
                  <span className="text-xs text-[var(--main-sidebar-fg)] opacity-60 group-hover:text-white group-hover:opacity-100 truncate text-left">
                    Ver perfil
                  </span>
                </div>
              )}
            </button> */}
          </div>

        </aside>
      </div>
    </div>
  );
}