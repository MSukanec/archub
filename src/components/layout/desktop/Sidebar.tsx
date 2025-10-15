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
  MessageCircle
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
  const { selectedProjectId, currentOrganizationId, setSelectedProject } = useProjectContext();
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
        { id: 'community', label: 'Comunidad', icon: MessageCircle, href: 'https://discord.com/channels/868615664070443008' },
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
          <div className="pt-3 px-0 overflow-y-auto">
            {sidebarLevel === 'general' ? (
              /* SIDEBAR GENERAL - HUB CENTRAL */
              <div className={cn(
                "flex flex-col gap-[2px]",
                isExpanded ? "px-[9px]" : "items-center"
              )}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-center mb-2">
                  <img 
                    src="/ArchubLogo.png" 
                    alt="Archub Logo" 
                    className={cn(
                      "object-contain transition-all duration-150",
                      isExpanded ? "h-12 w-auto" : "h-8 w-8"
                    )}
                  />
                </div>
                
                {/* Botón Organización */}
                <button
                  onClick={() => {
                    setSidebarLevel('organization');
                    navigate('/organization/dashboard');
                  }}
                  className={cn(
                    "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                    isExpanded ? "w-full" : "w-8"
                  )}
                >
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                      <Building className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="flex flex-col justify-center overflow-hidden min-w-0 ml-3">
                      <span className="text-sm font-medium text-[var(--main-sidebar-fg)] group-hover:text-white truncate text-left">
                        Organización
                      </span>
                      <span className="text-xs text-[var(--main-sidebar-fg)] opacity-60 group-hover:text-white group-hover:opacity-100 truncate text-left">
                        Gestión empresarial
                      </span>
                    </div>
                  )}
                </button>

                {/* Botón Proyecto */}
                <button
                  onClick={() => {
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
                  className={cn(
                    "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                    isExpanded ? "w-full" : "w-8"
                  )}
                >
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                      <FolderOpen className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="flex flex-col justify-center overflow-hidden min-w-0 ml-3">
                      <span className="text-sm font-medium text-[var(--main-sidebar-fg)] group-hover:text-white truncate text-left">
                        Proyecto
                      </span>
                      <span className="text-xs text-[var(--main-sidebar-fg)] opacity-60 group-hover:text-white group-hover:opacity-100 truncate text-left">
                        Gestión de obras
                      </span>
                    </div>
                  )}
                </button>

                {/* Botón Capacitaciones */}
                <button
                  onClick={() => {
                    setSidebarLevel('learning');
                    navigate('/learning/dashboard');
                  }}
                  className={cn(
                    "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                    isExpanded ? "w-full" : "w-8"
                  )}
                >
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="flex flex-col justify-center overflow-hidden min-w-0 ml-3">
                      <span className="text-sm font-medium text-[var(--main-sidebar-fg)] group-hover:text-white truncate text-left">
                        Capacitaciones
                      </span>
                      <span className="text-xs text-[var(--main-sidebar-fg)] opacity-60 group-hover:text-white group-hover:opacity-100 truncate text-left">
                        Cursos y formación
                      </span>
                    </div>
                  )}
                </button>
              </div>
            ) : (
              /* SIDEBARS ESPECÍFICOS */
              <div className={cn(
                "flex flex-col gap-[2px]",
                isExpanded ? "px-[9px]" : "items-center"
              )}>
                {/* Selector de Proyecto - solo en sidebar de proyecto */}
                {sidebarLevel === 'project' && (
                  <div className="h-16 flex items-center justify-center mb-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "h-12 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                            isExpanded ? "w-full px-2" : "w-10"
                          )}
                        >
                          <div className="flex items-center justify-center flex-shrink-0" style={{ width: isExpanded ? '32px' : '40px' }}>
                            <div className={cn(
                              "rounded-full bg-[var(--accent)]/10 flex items-center justify-center",
                              isExpanded ? "h-8 w-8" : "h-10 w-10"
                            )}>
                              <FolderOpen className={cn(isExpanded ? "h-4 w-4" : "h-5 w-5")} style={{ color: 'var(--accent)' }} />
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="flex flex-1 items-center justify-between overflow-hidden min-w-0 ml-2">
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
                )}
                
                {/* Botón Volver al hub general */}
                <ButtonSidebar
                  icon={<ArrowLeft className="w-[18px] h-[18px]" />}
                  label="Volver"
                  isActive={false}
                  isExpanded={isExpanded}
                  onClick={() => {
                    setSidebarLevel('general');
                  }}
                  variant="secondary"
                />
                
                {/* Divisor después del botón Volver */}
                <div className="my-3 h-[12px] flex items-center justify-center w-full">
                  {isExpanded ? (
                    <div className="w-full h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                  ) : (
                    <div className="w-8 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                  )}
                </div>
                
                {navigationItems.map((item, index) => {
                if (item.adminOnly && !isAdmin) return null;
                
                const isActive = location === item.href;
                // Configuración de divisores con texto
                const getDividerInfo = () => {
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
            
            {/* Botón de Administración - solo si es admin */}
            {isAdmin && (
              <ButtonSidebar
                icon={<Crown className="w-[18px] h-[18px]" />}
                label="Administración"
                isActive={sidebarLevel === 'admin'}
                isExpanded={isExpanded}
                onClick={() => {
                  const { setSidebarLevel } = useNavigationStore.getState();
                  if (sidebarLevel === 'admin') {
                    setSidebarLevel('organization');
                  } else {
                    setSidebarLevel('admin');
                  }
                }}
                variant="secondary"
              />
            )}

            {/* Notificaciones */}
            <NotificationBell isExpanded={isExpanded} />

            {/* Avatar del Usuario */}
            <button
              className={cn(
                "h-10 rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white flex items-center group overflow-hidden",
                isExpanded ? "w-full" : "w-8"
              )}
              onClick={() => navigate('/profile')}
            >
              {/* Avatar siempre centrado */}
              <div className="flex items-center justify-center w-8 flex-shrink-0">
                <Avatar className="h-8 w-8 flex-shrink-0 ring-0 border-0">
                  <AvatarFallback className="bg-[var(--accent)] text-white text-sm font-semibold border-0">
                    {userData?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Texto que aparece cuando se expande */}
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
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
}