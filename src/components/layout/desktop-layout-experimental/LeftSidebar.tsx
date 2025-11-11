import { useState, useEffect } from "react";
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
import { useUnreadSupportMessages } from '@/hooks/use-unread-support-messages';
import ButtonSidebar from "../desktop-layout-classic/ButtonSidebar";
import { SidebarIconButton } from "../desktop/SidebarIconButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { getUnreadCount, subscribeUserNotifications } from '@/lib/notifications';
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
  BarChart3,
  Folder,
  TrendingUp,
  MapPin,
  LogOut,
  Bell
} from "lucide-react";
import { SiDiscord } from 'react-icons/si';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuthStore } from "@/stores/authStore";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  adminOnly?: boolean;
  restricted?: "coming_soon" | string;
}

export function LeftSidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { selectedProjectId, currentOrganizationId, setSelectedProject, setCurrentOrganization } = useProjectContext();
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const { isDocked, isHovered, setHovered, setDocked } = useSidebarStore();
  const { toast } = useToast();
  
  // Contador de mensajes sin leer (solo para admins)
  const { data: unreadCount = 0 } = useUnreadSupportMessages();
  
  // Estado para popover de notificaciones
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const userId = userData?.user?.id;
  
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
        { id: 'projects', label: 'Gestión de Proyectos', icon: Folder, href: '/organization/projects' },
        { id: 'contacts', label: 'Contactos', icon: Users, href: '/contacts' },
        { id: 'analysis', label: 'Análisis de Costos', icon: BarChart3, href: '/analysis' },
        { id: 'finances', label: 'Movimientos', icon: DollarSign, href: '/movements' },
        { id: 'capital', label: 'Capital', icon: TrendingUp, href: '/finances/capital' },
        { id: 'expenses', label: 'Gastos Generales', icon: CreditCard, href: '/finances/general-costs' },
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
        { id: 'logs', label: 'Bitácora de Obra', icon: History, href: '/construction/logs', restricted: 'coming_soon' },
        { id: 'clients', label: 'Clientes', icon: Users, href: '/clients', restricted: 'coming_soon' },
      ];
    } else if (sidebarLevel === 'admin' && isAdmin) {
      return [
        { id: 'dashboard', label: 'Analytics', icon: BarChart3, href: '/admin/dashboard' },
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
    } else if (sidebarLevel === 'community') {
      return [
        { id: 'dashboard', label: 'Visión General', icon: Home, href: '/community/dashboard' },
        { id: 'map', label: 'Mapa', icon: MapPin, href: '/community/map' },
      ];
    } else if (sidebarLevel === 'learning') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/learning/dashboard' },
        { id: 'courses', label: 'Cursos', icon: GraduationCap, href: '/learning/courses' },
        { id: 'community', label: 'Comunidad Discord', icon: MessageCircle, href: 'https://discord.com/channels/868615664070443008' },
      ];
    } else if (sidebarLevel === 'user') {
      return [
        { id: 'profile', label: 'Mi Perfil', icon: User, href: '/profile' },
        { id: 'landing', label: 'Página de Inicio', icon: Home, href: '/' },
      ];
    }
    
    return [];
  };

  const navigationItems = getNavigationItems();

  const handleDockToggle = () => {
    setDocked(!isDocked);
  };

  // Helper to get context title
  const getContextTitle = () => {
    switch (sidebarLevel) {
      case 'organization': return 'Organización';
      case 'project': return 'Proyecto';
      case 'community': return 'Comunidad';
      case 'learning': return 'Capacitaciones';
      case 'admin': return 'Administración';
      case 'user': return 'Usuario';
      default: return '';
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Fetch notification unread count
  const fetchNotificationUnreadCount = async () => {
    if (!userId) return;
    
    try {
      const count = await getUnreadCount(userId);
      setNotificationUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotificationUnreadCount();

    const unsubscribe = subscribeUserNotifications(userId, () => {
      fetchNotificationUnreadCount();
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return (
    <div className="flex flex-row h-full">
      {/* WRAPPER CON FRAME EFFECT */}
      <div className="h-full p-1 rounded-lg bg-[var(--content-bg)]">
        <div 
          className="flex flex-row h-full"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* SIDEBAR IZQUIERDO - CONTEXTOS (siempre visible, 50px, altura total) */}
          <div className="bg-[var(--main-sidebar-bg)] w-[50px] h-full rounded-lg flex flex-col">
            {/* SECCIÓN: Botones de contexto con scroll */}
            <div className="px-0 pt-3 overflow-y-auto flex-1">
                <div className="flex flex-col gap-[2px] items-center">
                  {/* Logo */}
                  <div className="h-[50px] flex items-center justify-center w-8 mb-3">
                    <img 
                      src="/Seencel512.png" 
                      alt="Seencel Logo" 
                      className="h-8 w-auto object-contain"
                    />
                  </div>

                  {/* Botón Inicio */}
                  <SidebarIconButton
                    icon={<Home className="h-5 w-5" />}
                    isActive={sidebarLevel === 'general'}
                    onClick={() => {
                      setSidebarLevel('general');
                      navigate('/home');
                    }}
                    testId="button-sidebar-home"
                  />

                  {/* Botón Organización */}
                  <SidebarIconButton
                    icon={<Building className="h-5 w-5" />}
                    isActive={sidebarLevel === 'organization'}
                    onClick={() => setSidebarLevel('organization')}
                  />

                  {/* Botón Proyecto */}
                  {selectedProjectId && (
                    <SidebarIconButton
                      icon={<FolderOpen className="h-5 w-5" />}
                      isActive={sidebarLevel === 'project'}
                      onClick={() => setSidebarLevel('project')}
                    />
                  )}

                  {/* Botón Capacitaciones */}
                  <SidebarIconButton
                    icon={<GraduationCap className="h-5 w-5" />}
                    isActive={sidebarLevel === 'learning'}
                    onClick={() => setSidebarLevel('learning')}
                  />

                  {/* Botón Comunidad */}
                  <PlanRestricted reason="coming_soon">
                    <SidebarIconButton
                      icon={<Users className="h-5 w-5" />}
                      isActive={sidebarLevel === 'community'}
                      onClick={() => setSidebarLevel('community')}
                      testId="button-sidebar-community"
                    />
                  </PlanRestricted>
                </div>
              </div>

            {/* SECCIÓN INFERIOR: Administración, Notificaciones y Avatar del usuario */}
            <div className="px-0 pt-3 pb-3 flex flex-col gap-[2px] items-center">
              {/* Botón Administración - solo si es admin */}
              {isAdmin && (
                <SidebarIconButton
                  icon={<Crown className="h-5 w-5" />}
                  isActive={sidebarLevel === 'admin'}
                  onClick={() => setSidebarLevel('admin')}
                  badge={unreadCount}
                  testId="sidebar-button-administration"
                />
              )}

              {/* Botón de Notificaciones con Popover */}
              <Popover open={notificationPopoverOpen} onOpenChange={setNotificationPopoverOpen}>
                <PopoverTrigger asChild>
                  <div>
                    <SidebarIconButton
                      icon={<Bell className="h-5 w-5" />}
                      onClick={() => setNotificationPopoverOpen(!notificationPopoverOpen)}
                      badge={notificationUnreadCount}
                      title="Notificaciones"
                      testId="button-notifications-left"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  side="right" 
                  align="start"
                  className="w-[380px] p-0"
                  sideOffset={8}
                >
                  {userId && (
                    <NotificationDropdown
                      userId={userId}
                      onRefresh={fetchNotificationUnreadCount}
                      onClose={() => setNotificationPopoverOpen(false)}
                    />
                  )}
                </PopoverContent>
              </Popover>

              {/* Avatar del usuario */}
              <button
                onClick={() => setSidebarLevel('user')}
                className={cn(
                  "h-8 w-8 rounded-lg cursor-pointer transition-colors flex items-center justify-center relative",
                  "hover:bg-[var(--main-sidebar-button-hover-bg)]",
                  sidebarLevel === 'user' && "bg-[var(--main-sidebar-button-active-bg)]"
                )}
                title="Configuración de usuario"
                data-testid="button-user-menu"
              >
                <Avatar className="h-7 w-7" style={{ border: 'none', outline: 'none' }}>
                  <AvatarImage src={userData?.user?.avatar_url} />
                  <AvatarFallback className="text-xs bg-accent text-white" style={{ border: 'none' }}>
                    {userData?.user?.first_name?.[0] || userData?.user?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>

          {/* SIDEBAR DERECHO - NAVEGACIÓN ESPECÍFICA (240px, aparece en hover) */}
          {isHovered && sidebarLevel !== 'general' && (
            <div className="w-[240px] h-full px-[9px] pt-6 pb-6 flex flex-col">
              {/* Título del contexto con botón de anclar */}
              <div className="mb-6 flex items-center justify-between px-2">
                <h2 className="text-lg font-semibold text-[var(--main-sidebar-fg)]">
                  {getContextTitle()}
                </h2>
                {/* Botón de anclar inline - solo icono (no mostrar en nivel user) */}
                {sidebarLevel !== 'user' && (
                  <button
                    onClick={handleDockToggle}
                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[var(--main-sidebar-button-hover-bg)] transition-colors"
                    title={isDocked ? "Desanclar sidebar" : "Anclar sidebar"}
                    data-testid="button-dock-toggle"
                  >
                    {isDocked ? (
                      <PanelLeftClose className="w-4 h-4 text-[var(--main-sidebar-fg)]" />
                    ) : (
                      <PanelLeftOpen className="w-4 h-4 text-[var(--main-sidebar-fg)]" />
                    )}
                  </button>
                )}
              </div>

              {/* Botones de navegación */}
              <div className="flex flex-col gap-[2px] flex-1 overflow-y-auto">
                {sidebarLevel === 'user' ? (
                  // Renderizado especial para el nivel user con separador
                  <>
                    {/* Mi Perfil */}
                    <ButtonSidebar
                      icon={<User className="w-[18px] h-[18px]" />}
                      label="Mi Perfil"
                      isActive={location === '/profile'}
                      isExpanded={true}
                      onClick={() => navigate('/profile')}
                      href="/profile"
                      variant="secondary"
                    />
                    
                    {/* Espacio vacío simulando un botón */}
                    <div className="h-9"></div>
                    
                    {/* Página de Inicio */}
                    <ButtonSidebar
                      icon={<Home className="w-[18px] h-[18px]" />}
                      label="Página de Inicio"
                      isActive={location === '/'}
                      isExpanded={true}
                      onClick={() => navigate('/')}
                      href="/"
                      variant="secondary"
                    />
                    
                    {/* Cerrar Sesión */}
                    <ButtonSidebar
                      icon={<LogOut className="w-[18px] h-[18px]" />}
                      label="Cerrar Sesión"
                      isActive={false}
                      isExpanded={true}
                      onClick={handleLogout}
                      variant="secondary"
                    />
                  </>
                ) : (
                  // Renderizado normal para otros niveles
                  navigationItems.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;
                    
                    const isActive = location === item.href;
                    const isExternalLink = item.href.startsWith('http');
                    
                    const button = (
                      <ButtonSidebar
                        key={item.id}
                        icon={<item.icon className="w-[18px] h-[18px]" />}
                        label={item.label}
                        isActive={isActive}
                        isExpanded={true}
                        onClick={() => {
                          if (isExternalLink) {
                            window.open(item.href, '_blank', 'noopener,noreferrer');
                          } else {
                            navigate(item.href);
                          }
                        }}
                        href={item.href}
                        variant="secondary"
                        badgeCount={item.id === 'support' && isAdmin ? unreadCount : undefined}
                      />
                    );
                    
                    return item.restricted ? (
                      <PlanRestricted key={item.id} reason={item.restricted}>
                        {button}
                      </PlanRestricted>
                    ) : (
                      button
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
