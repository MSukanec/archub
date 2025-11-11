import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { useProject } from "@/hooks/use-projects";
import { useUserMode } from "@/hooks/use-user-mode";
import { isButtonExcluded } from "@/config/modes";
import { cn } from "@/lib/utils";
import { useProjectContext } from '@/stores/projectContext';
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useUnreadSupportMessages } from '@/hooks/use-unread-support-messages';
import { useUnreadUserSupportMessages } from '@/hooks/use-unread-user-support-messages';
import ButtonSidebar from "../desktop-layout-classic/ButtonSidebar";
import { SidebarIconButton } from "../desktop/SidebarIconButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { SupportModal } from "@/components/support/SupportModal";
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
  Bell,
  CircleHelp,
  Globe
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
  const userMode = useUserMode(); // Obtener el modo de uso actual
  const { selectedProjectId, currentOrganizationId, setSelectedProject, setCurrentOrganization } = useProjectContext();
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const { isDocked, isHovered, setHovered, setDocked } = useSidebarStore();
  const { toast } = useToast();
  
  // Usuario ID
  const userId = userData?.user?.id;
  const userFullName = userData?.user?.full_name || userData?.user?.first_name || 'Usuario';
  const userAvatarUrl = userData?.user?.avatar_url;
  
  // Contador de mensajes sin leer
  const { data: unreadCount = 0 } = useUnreadSupportMessages();
  const { data: unreadSupportCountUser = 0 } = useUnreadUserSupportMessages(userId);
  const unreadSupportCount = isAdmin ? unreadCount : unreadSupportCountUser;
  
  // Estado para popovers y modals
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [helpPopoverOpen, setHelpPopoverOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  
  // Estados simples
  const isExpanded = isDocked || isHovered;

  // Get projects data
  const { data: projectsLite = [] } = useProjectsLite(currentOrganizationId || undefined);
  const { data: currentProject } = useProject(selectedProjectId || undefined);
  const currentProjectName = currentProject?.name || "Seleccionar Proyecto";
  
  // Helper to check if there are projects available
  const hasProjects = projectsLite.length > 0;

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
  
  // AUTO-SELECT FIRST PROJECT: If organization has projects but none selected, auto-select the first one
  useEffect(() => {
    // Only run if:
    // 1. We have projects available
    // 2. No project is currently selected
    // 3. Not currently mutating
    // 4. User data is available
    if (hasProjects && !selectedProjectId && !selectProjectMutation.isPending && userData?.user?.id) {
      const firstProject = projectsLite[0];
      if (firstProject) {
        console.log('🔧 Auto-selecting first project:', firstProject.name);
        selectProjectMutation.mutate(firstProject.id);
      }
    }
  }, [hasProjects, selectedProjectId, selectProjectMutation.isPending, projectsLite, userData?.user?.id]);

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

  // SIDEBAR DOCK MUTATION - Save sidebar_docked state to backend with optimistic updates
  const saveSidebarDockedMutation = useMutation({
    onMutate: async (dockedState: boolean) => {
      const previousState = isDocked;
      setDocked(dockedState);
      return { previousState };
    },
    mutationFn: async (dockedState: boolean) => {
      if (!supabase || !userData?.user?.id) {
        throw new Error('Required data not available');
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }
      
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userData.user.id,
          sidebar_docked: dockedState,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return dockedState;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    onError: (error, variables, context) => {
      console.error('Error saving sidebar docked state:', error);
      if (context?.previousState !== undefined) {
        setDocked(context.previousState);
      }
      toast({
        title: "Error",
        description: "No se pudo guardar la preferencia del sidebar",
        variant: "destructive",
      });
    }
  });

  const handleDockToggle = () => {
    if (!userData?.user?.id) {
      toast({
        title: "Error",
        description: "Por favor espera a que se carguen tus datos",
        variant: "destructive",
      });
      return;
    }
    
    const newDockedState = !isDocked;
    saveSidebarDockedMutation.mutate(newDockedState);
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

  // 🔥 SUPABASE REALTIME - Suscripción para mensajes de soporte (para badges)
  useEffect(() => {
    if (!supabase || !userId) return;

    let channel: any = null;

    const setupRealtimeSubscription = async () => {
      // Obtener el user_id de la tabla users
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (!userData) return;

      const dbUserId = userData.id;

      // Crear canal único para este usuario/admin
      const channelName = isAdmin ? 'admin_support_badge' : `user_support_badge_${dbUserId}`;
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'support_messages',
            ...(isAdmin ? {} : { filter: `user_id=eq.${dbUserId}` }) // Admin escucha todo, usuario solo sus mensajes
          },
          (payload) => {
            console.log('🔥 Support badge Realtime update:', payload);
            
            if (isAdmin) {
              // Admin: invalidar contador Y conversaciones
              queryClient.invalidateQueries({ queryKey: ['unread-support-messages-count'] });
              queryClient.invalidateQueries({ queryKey: ['admin-support-conversations'] });
            } else {
              // Usuario: invalidar contador Y mensajes
              queryClient.invalidateQueries({ queryKey: ['unread-user-support-messages-count', userId] });
              queryClient.invalidateQueries({ queryKey: ['support-messages', userId] });
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, isAdmin]);

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
            <div className="px-0 pt-0 overflow-y-auto flex-1">
                <div className="flex flex-col gap-[2px] items-center pt-3">
                  {/* Logo */}
                  <div className="h-[32px] flex items-center justify-center w-8 mb-3">
                    <img 
                      src="/Seencel512.png" 
                      alt="Seencel Logo" 
                      className="h-8 w-auto object-contain"
                    />
                  </div>

                  {/* Espacio vacío del tamaño de un botón */}
                  <div className="h-[32px] w-full" />

                  {/* BOTONES DE CONTEXTO - Renderizados según el modo del usuario */}
                  {(() => {
                    // Descriptor de botones de contexto con sus configuraciones
                    const contextButtons = [
                      {
                        id: 'general' as const,
                        icon: <Home className="h-5 w-5" />,
                        testId: 'button-sidebar-home',
                        onClick: () => {
                          setSidebarLevel('general');
                          navigate('/home');
                        },
                        shouldRender: () => true, // Siempre visible
                      },
                      {
                        id: 'community' as const,
                        icon: <Globe className="h-5 w-5" />,
                        testId: 'button-sidebar-community',
                        onClick: () => setSidebarLevel('community'),
                        shouldRender: () => true,
                        wrapper: (children: React.ReactNode) => (
                          <PlanRestricted reason="coming_soon">{children}</PlanRestricted>
                        ),
                      },
                      {
                        id: 'organization' as const,
                        icon: <Building className="h-5 w-5" />,
                        onClick: () => setSidebarLevel('organization'),
                        shouldRender: () => true,
                      },
                      {
                        id: 'project' as const,
                        icon: <FolderOpen className="h-5 w-5" />,
                        onClick: () => setSidebarLevel('project'),
                        shouldRender: () => hasProjects && !!selectedProjectId, // Solo si hay proyectos
                      },
                      {
                        id: 'learning' as const,
                        icon: <GraduationCap className="h-5 w-5" />,
                        onClick: () => setSidebarLevel('learning'),
                        shouldRender: () => true,
                      },
                    ];

                    // Botones especiales para modo LEARNER (sin sub-sidebar)
                    const learnerDirectButtons = [
                      {
                        id: 'learner-dashboard' as const,
                        icon: <Home className="h-5 w-5" />, // Icono de casita
                        testId: 'button-sidebar-learning-dashboard',
                        onClick: () => navigate('/learning/dashboard'),
                        isActive: location === '/learning/dashboard',
                      },
                      {
                        id: 'learner-courses' as const,
                        icon: <GraduationCap className="h-5 w-5" />, // Icono de gorrito
                        testId: 'button-sidebar-learning-courses',
                        onClick: () => navigate('/learning/courses'),
                        isActive: location === '/learning/courses',
                      },
                      {
                        id: 'learner-discord' as const,
                        icon: <SiDiscord className="h-5 w-5" />, // Icono de Discord
                        testId: 'button-sidebar-learning-discord',
                        onClick: () => window.open('https://discord.gg/aHxTsPZ4', '_blank'),
                        isActive: false,
                      },
                    ];

                    // Si es modo learner, mostrar SOLO los 3 botones directos (sin submenu)
                    if (userMode === 'learner') {
                      return learnerDirectButtons.map((button) => (
                        <SidebarIconButton
                          key={button.id}
                          icon={button.icon}
                          isActive={button.isActive}
                          onClick={button.onClick}
                          testId={button.testId}
                        />
                      ));
                    }

                    // Para otros modos, usar el sistema normal
                    return contextButtons
                      .filter((button) => {
                        if (isButtonExcluded(userMode, button.id)) return false;
                        if (!button.shouldRender()) return false;
                        return true;
                      })
                      .map((button) => {
                        const buttonElement = (
                          <SidebarIconButton
                            icon={button.icon}
                            isActive={sidebarLevel === button.id}
                            onClick={button.onClick}
                            testId={button.testId}
                          />
                        );
                        
                        if (button.wrapper) {
                          return <div key={button.id}>{button.wrapper(buttonElement)}</div>;
                        }
                        return <div key={button.id}>{buttonElement}</div>;
                      });
                  })()}
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

              {/* Botón de Ayuda con Popover */}
              <Popover open={helpPopoverOpen} onOpenChange={setHelpPopoverOpen}>
                <PopoverTrigger asChild>
                  <div>
                    <SidebarIconButton
                      icon={<CircleHelp className="h-5 w-5" />}
                      onClick={() => setHelpPopoverOpen(!helpPopoverOpen)}
                      badge={unreadSupportCount}
                      title="Ayuda"
                      testId="button-help-left"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  side="right" 
                  align="end"
                  className="w-[200px] p-2"
                  sideOffset={8}
                  alignOffset={0}
                >
                  <div className="flex flex-col gap-1">
                    {/* Botón Comunidad Discord */}
                    <button
                      onClick={() => {
                        window.open('https://discord.com/channels/868615664070443008', '_blank');
                        setHelpPopoverOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
                      data-testid="button-discord-help"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Comunidad Discord</span>
                    </button>
                    
                    {/* Botón Soporte */}
                    <button
                      onClick={() => {
                        setSupportModalOpen(true);
                        setHelpPopoverOpen(false);
                        // Invalidar contador de mensajes no leídos al abrir
                        if (userId) {
                          queryClient.invalidateQueries({ queryKey: ['unread-user-support-messages-count', userId] });
                          queryClient.invalidateQueries({ queryKey: ['unread-support-messages-count'] });
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left relative"
                      data-testid="button-support-help"
                    >
                      <Headphones className="h-4 w-4" />
                      <span>Soporte</span>
                      {unreadSupportCount > 0 && (
                        <span 
                          className="ml-auto text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5 font-bold border-0"
                          style={{ backgroundColor: 'var(--accent)' }}
                        >
                          {unreadSupportCount > 99 ? '99+' : unreadSupportCount}
                        </span>
                      )}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

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
                  align="end"
                  className="w-[380px] p-0"
                  sideOffset={8}
                  alignOffset={0}
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

              {/* Avatar del usuario con Popover */}
              <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setUserPopoverOpen(!userPopoverOpen)}
                    className="group relative cursor-pointer transition-all duration-200 hover:scale-105"
                    data-testid="button-user-menu"
                    title="Menú de usuario"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userData?.user?.avatar_url} />
                      <AvatarFallback className="text-xs font-semibold uppercase bg-accent text-white border-0">
                        {userData?.user?.first_name?.[0] || userData?.user?.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  side="right" 
                  align="end"
                  className="w-[200px] p-2"
                  sideOffset={8}
                  alignOffset={0}
                >
                  <div className="flex flex-col gap-1">
                    {/* Mi Perfil */}
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setUserPopoverOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
                      data-testid="button-profile"
                    >
                      <User className="h-4 w-4" />
                      <span>Mi Perfil</span>
                    </button>
                    
                    {/* Página de Inicio */}
                    <button
                      onClick={() => {
                        navigate('/');
                        setUserPopoverOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
                      data-testid="button-home"
                    >
                      <Home className="h-4 w-4" />
                      <span>Página de Inicio</span>
                    </button>
                    
                    {/* Cambiar Modo */}
                    <button
                      onClick={() => {
                        navigate('/select-mode');
                        setUserPopoverOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
                      data-testid="button-change-mode"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Cambiar Modo</span>
                    </button>
                    
                    {/* Separador */}
                    <div className="h-px bg-border my-1" />
                    
                    {/* Cerrar Sesión */}
                    <button
                      onClick={() => {
                        handleLogout();
                        setUserPopoverOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive transition-colors text-left"
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
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
                    className="h-6 w-6 flex items-center justify-center rounded-md transition-colors group"
                    title={isDocked ? "Desanclar sidebar" : "Anclar sidebar"}
                    data-testid="button-dock-toggle"
                  >
                    {isDocked ? (
                      <PanelLeftClose className="w-4 h-4 text-[var(--main-sidebar-fg)] group-hover:text-black dark:group-hover:text-black transition-colors" />
                    ) : (
                      <PanelLeftOpen className="w-4 h-4 text-[var(--main-sidebar-fg)] group-hover:text-black dark:group-hover:text-black transition-colors" />
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
                    
                    {/* Cambiar Modo */}
                    <ButtonSidebar
                      icon={<Settings className="w-[18px] h-[18px]" />}
                      label="Cambiar Modo"
                      isActive={location === '/select-mode'}
                      isExpanded={true}
                      onClick={() => navigate('/select-mode')}
                      href="/select-mode"
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

      {/* SUPPORT MODAL */}
      {userId && (
        <SupportModal
          open={supportModalOpen}
          onOpenChange={setSupportModalOpen}
          userId={userId}
          userFullName={userFullName}
          userAvatarUrl={userAvatarUrl}
        />
      )}
    </div>
  );
}
