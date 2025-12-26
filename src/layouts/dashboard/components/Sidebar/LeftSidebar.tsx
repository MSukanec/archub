import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useProjectsLite } from "@/features/projects";
import { useProject } from "@/features/projects";
import { useUserMode } from "@/hooks/use-user-mode";
import { useUserOrganizationPreferences } from "@/features/organization";
import { isButtonExcluded } from "@/config/modes";
import { ADMIN_NAVIGATION, COMMUNITY_NAVIGATION, LEARNING_NAVIGATION } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useProjectContext } from '@/stores/projectContext';
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { supabase } from '@/lib/supabase';
import { getUserByAuthId } from '@/lib/supabase-helpers';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useUnreadSupportMessages } from '@/hooks/use-unread-support-messages';
import { useUnreadUserSupportMessages } from '@/hooks/use-unread-user-support-messages';
import { useOpsAlertsCount } from '@/hooks/use-ops-alerts-count';
import ButtonSidebar from "./ButtonSidebar";
import { SidebarIconButton } from "./SidebarIconButton";
import { PlanBadge } from "@/features/organization";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationDropdown } from "@/features/users";
import { AdminSupportModal as SupportModal } from "@/features/users";
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
  Globe,
  HandHeart,
  FlaskConical,
  Award,
  Eye,
  Palette
} from "lucide-react";
import { LuContact, LuHandshake } from 'react-icons/lu';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanRestricted } from "@/components/shared/restrictions/guards/PlanRestricted";
import { RoleRestricted } from "@/components/shared/restrictions/guards/RoleRestricted";
import { ComingSoonRestricted } from "@/components/shared/restrictions/guards/ComingSoonRestricted";
import { NotificationBell } from "@/features/users";
import { useAuthStore } from "@/stores/authStore";
import { FounderBadge } from "@/components/shared/FounderBadge";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  adminOnly?: boolean;
  restricted?: "coming_soon" | string;
}

interface SidebarSection {
  type: 'section';
  title: string;
  items: SidebarItem[];
}

interface SidebarSpacer {
  type: 'spacer';
  id: string;
}

interface SidebarSectionHeader {
  type: 'section-header';
  id: string;
  label: string;
}

type NavigationItem = SidebarItem | SidebarSection | SidebarSpacer | SidebarSectionHeader;

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
  
  // Contador de alertas críticas del Ops Center (solo admins)
  const { data: opsAlertsCount = 0 } = useOpsAlertsCount(isAdmin);
  
  // Badge total para Administración: mensajes de soporte + alertas ops críticas
  const adminBadgeCount = unreadCount + opsAlertsCount;
  
  // Estado para popovers y modals
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [helpPopoverOpen, setHelpPopoverOpen] = useState(false);
  const [avatarPopoverOpen, setAvatarPopoverOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  
  // Estados simples
  const isExpanded = isDocked || isHovered;

  // Get projects data
  const { data: projectsLite = [] } = useProjectsLite(currentOrganizationId || undefined);
  const { data: currentProject } = useProject(selectedProjectId || undefined);
  const currentProjectName = currentProject?.name || "Seleccionar Proyecto";
  
  // Get user preferences to check if they explicitly chose "Organization" view
  const { data: userPreferences, isLoading: preferencesLoading } = useUserOrganizationPreferences(userId, currentOrganizationId || undefined);
  
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
  // IMPORTANT: Only auto-select for NEW users who have never made a choice
  // Do NOT auto-select if user explicitly chose "Organization" view (last_project_id === null in preferences)
  useEffect(() => {
    // Skip if preferences are still loading
    if (preferencesLoading) return;
    
    // Only run if:
    // 1. We have projects available
    // 2. No project is currently selected
    // 3. Not currently mutating
    // 4. User data is available
    // 5. User preferences don't exist yet (new user) OR preferences exist but have a valid project_id that doesn't exist anymore
    const userHasNeverChosenAnything = userPreferences === null || userPreferences === undefined;
    const userExplicitlyChoseOrganizationView = userPreferences?.last_project_id === null;
    
    // Only auto-select if it's a NEW user who has never made a choice
    if (hasProjects && !selectedProjectId && !selectProjectMutation.isPending && userData?.user?.id && userHasNeverChosenAnything) {
      const firstProject = projectsLite[0];
      if (firstProject) {
        console.log('🔧 Auto-selecting first project:', firstProject.name);
        selectProjectMutation.mutate(firstProject.id);
      }
    }
  }, [hasProjects, selectedProjectId, selectProjectMutation.isPending, projectsLite, userData?.user?.id, userPreferences, preferencesLoading]);

  // Organización y usuario para settings sections
  const organizationName = userData?.organization?.name || 'Organización';
  const isFounder = userData?.organization?.settings?.is_founder === true;

  // Navegación según el nivel del sidebar
  const getNavigationItems = (): NavigationItem[] => {
    if (sidebarLevel === 'general' || sidebarLevel === 'organization') {
      return [
        { type: 'section-header', id: 'section-gestion', label: 'Gestión' },
        { id: 'dashboard', label: 'Visión General', icon: Home, href: '/organization/dashboard' },
        { id: 'basic-data', label: 'Datos Básicos', icon: Building, href: '/organization/basic-data' },
        { id: 'projects', label: 'Gestión de Proyectos', icon: Folder, href: '/organization/projects' },
        { id: 'contacts', label: 'Contactos', icon: LuContact, href: '/contacts' },
        { id: 'settings', label: 'Ajustes', icon: Settings, href: '/organization/settings' },
        { type: 'section-header', id: 'section-finanzas', label: 'Finanzas' },
        { id: 'finances-unified', label: 'Finanzas', icon: DollarSign, href: '/finances' },
        { id: 'capital', label: 'Capital', icon: HandHeart, href: '/organization/capital' },
        { id: 'expenses', label: 'Gastos Generales', icon: CreditCard, href: '/general-costs' },
        { id: 'analysis', label: 'Análisis de Costos', icon: BarChart3, href: '/analysis', restricted: 'lab_user' },
      ];
    } else if (sidebarLevel === 'project' && selectedProjectId) {
      return [
        { type: 'section-header', id: 'section-gestion', label: 'Gestión' },
        { id: 'dashboard', label: 'Visión General', icon: Home, href: '/project/dashboard' },
        { id: 'basic-data', label: 'Datos Básicos', icon: FileText, href: '/project' },
        { id: 'media', label: 'Archivos y Media', icon: FolderOpen, href: '/media' },
        { id: 'finances', label: 'Finanzas', icon: DollarSign, href: '/project/finances', restricted: 'coming_soon' },
        { type: 'section-header', id: 'section-diseño', label: 'Diseño' },
        { id: 'moodboard', label: 'Moodboard', icon: Palette, href: '/project/moodboard', restricted: 'coming_soon' },
        { type: 'section-header', id: 'section-construccion', label: 'Construcción' },
        { id: 'budgets', label: 'Cómputo y Presupuesto', icon: Calculator, href: '/budgets', restricted: 'coming_soon' },
        { id: 'personnel', label: 'Mano de Obra', icon: Users, href: '/construction/personnel' },
        { id: 'materials', label: 'Materiales', icon: Package, href: '/construction/materials' },
        { id: 'subcontracts', label: 'Subcontratos', icon: FileText, href: '/construction/subcontracts', restricted: 'coming_soon' },
        { id: 'indirects', label: 'Indirectos', icon: Layers, href: '/construction/indirects', restricted: 'coming_soon' },
        { id: 'logs', label: 'Bitácora de Obra', icon: BookOpen, href: '/construction/logs' },
        { type: 'section-header', id: 'section-comercializacion', label: 'Comercialización y Venta' },
        { id: 'clients', label: 'Clientes', icon: LuHandshake, href: '/clients' },
      ];
    } else if (sidebarLevel === 'admin' && isAdmin) {
      return ADMIN_NAVIGATION;
    } else if (sidebarLevel === 'community') {
      return COMMUNITY_NAVIGATION;
    } else if (sidebarLevel === 'learning') {
      return LEARNING_NAVIGATION;
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
      case 'founders': return 'Fundadores';
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
      const userData = await getUserByAuthId(userId);

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
            <div className="px-0 pt-3 pb-3 flex-1 flex flex-col gap-[2px] items-center">
                  {/* Logo */}
                  <div className="h-8 w-8 flex items-center justify-center mb-3">
                    <img 
                      src="/seencel-logo-192.png" 
                      alt="Seencel Logo" 
                      className="h-8 w-auto object-contain"
                    />
                  </div>

                  {/* Espacio vacío del tamaño de un botón */}
                  <div className="h-[32px]" />

                  {/* BOTONES DE CONTEXTO - Renderizados según el modo del usuario */}
                  {(() => {
                    // Descriptor de botones de contexto con sus configuraciones
                    const contextButtons = [
                      {
                        id: 'organization' as const,
                        icon: <Building className="h-5 w-5" />,
                        onClick: () => {
                          setSidebarLevel('organization');
                          navigate('/organization/dashboard');
                        },
                        shouldRender: () => true,
                      },
                      {
                        id: 'project' as const,
                        icon: <FolderOpen className="h-5 w-5" />,
                        onClick: () => {
                          setSidebarLevel('project');
                          navigate('/project/dashboard');
                        },
                        shouldRender: () => hasProjects && !!selectedProjectId,
                      },
                      {
                        id: 'spacer-1' as const,
                        isSpacer: true,
                        shouldRender: () => true,
                      },
                      {
                        id: 'founders' as const,
                        icon: <Award className="h-5 w-5" />,
                        testId: 'button-sidebar-founders',
                        onClick: () => {
                          if (!isAdmin) return;
                          navigate('/organization/founders-portal');
                        },
                        shouldRender: () => true,
                        wrapper: (children: React.ReactNode) => (
                          <RoleRestricted requiredRole="admin" hideCompletely showAsPreview>{children}</RoleRestricted>
                        ),
                      },
                      {
                        id: 'community' as const,
                        icon: <Globe className="h-5 w-5" />,
                        testId: 'button-sidebar-community',
                        onClick: () => {
                          if (!isAdmin) return;
                          setSidebarLevel('community');
                          navigate('/community/dashboard');
                        },
                        shouldRender: () => true,
                        wrapper: (children: React.ReactNode) => (
                          <RoleRestricted requiredRole="admin" hideCompletely showAsPreview>{children}</RoleRestricted>
                        ),
                      },
                      {
                        id: 'learning' as const,
                        icon: <GraduationCap className="h-5 w-5" />,
                        onClick: () => {
                          setSidebarLevel('learning');
                          navigate('/learning/dashboard');
                        },
                        shouldRender: () => true,
                      },
                    ];

                    // Renderizar los botones de contexto usando el sistema normal
                    return contextButtons
                      .filter((button) => {
                        if (button.isSpacer) return true;
                        if (isButtonExcluded(userMode, button.id as any)) return false;
                        if (!button.shouldRender()) return false;
                        return true;
                      })
                      .map((button: any) => {
                        // Si es un spacer, renderizar un div vacío del tamaño de un botón
                        if (button.isSpacer) {
                          return <div key={button.id} className="h-[32px]" />;
                        }

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

            {/* SECCIÓN INFERIOR: Administración, Notificaciones y Avatar del usuario */}
            <div className="px-0 pt-3 pb-3 flex flex-col gap-[2px] items-center">
              {/* Botón Administración - solo si es admin */}
              {isAdmin && (
                <SidebarIconButton
                  icon={<Crown className="h-5 w-5" />}
                  isActive={sidebarLevel === 'admin'}
                  onClick={() => {
                    setSidebarLevel('admin');
                    navigate('/admin/dashboard');
                  }}
                  badge={adminBadgeCount}
                  testId="sidebar-button-administration"
                />
              )}

              {/* Badge de Organización Fundadora */}
              <FounderBadge isFounder={userData?.organization?.settings?.is_founder} size="md" />

              {/* Botón del Plan Actual */}
              <PlanBadge isExpanded={false} />

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
                >
                  <div className="flex flex-col gap-1">
                    {/* Botón Contacto */}
                    <button
                      onClick={() => {
                        navigate('/contact');
                        setHelpPopoverOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
                      data-testid="button-contact-help"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Contacto</span>
                    </button>

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
              <Popover open={avatarPopoverOpen} onOpenChange={setAvatarPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
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
                >
                  <div className="flex flex-col gap-1">
                    {/* Mi Perfil */}
                    <button
                      onClick={() => {
                        navigate('/user');
                        setAvatarPopoverOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
                      data-testid="button-profile"
                    >
                      <User className="h-4 w-4" />
                      <span>Mi Perfil</span>
                    </button>
                    
                    {/* Separador */}
                    <div className="h-px bg-border my-1" />
                    
                    {/* Página de Inicio */}
                    <button
                      onClick={() => {
                        navigate('/');
                        setAvatarPopoverOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
                      data-testid="button-home"
                    >
                      <Home className="h-4 w-4" />
                      <span>Página de Inicio</span>
                    </button>

                    {/* Contacto */}
                    <button
                      onClick={() => {
                        navigate('/contact');
                        setAvatarPopoverOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
                      data-testid="button-contact"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Contacto</span>
                    </button>
                    
                    {/* Separador */}
                    <div className="h-px bg-border my-1" />
                    
                    {/* Cambiar Modo */}
                    <button
                      onClick={() => {
                        navigate('/select-mode');
                        setAvatarPopoverOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
                      data-testid="button-change-mode"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Cambiar Modo</span>
                    </button>
                    
                    {/* Cerrar Sesión */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left text-foreground hover:text-red-600 dark:hover:text-red-500"
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
                {/* Botón de anclar inline - solo icono */}
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
              </div>

              {/* Botones de navegación */}
              <div className="flex flex-col gap-[2px] flex-1 overflow-y-auto">
                {navigationItems.map((navItem) => {
                    if ('type' in navItem && navItem.type === 'spacer') {
                      return <div key={navItem.id} className="h-9" />;
                    }
                    
                    if ('type' in navItem && navItem.type === 'section-header') {
                      return (
                        <div key={navItem.id} className="h-9 flex items-center px-2">
                          <span className="text-xs font-semibold text-[var(--main-sidebar-button-fg)] uppercase tracking-wide">
                            {navItem.label}
                          </span>
                        </div>
                      );
                    }
                    
                    if ('type' in navItem && navItem.type === 'section') return null;
                    
                    const item = navItem as SidebarItem;
                    if (item.adminOnly && !isAdmin) return null;
                    
                    const isActive = location === item.href;
                    const isExternalLink = item.href?.startsWith('http') || false;
                    
                    const buttonElement = (
                      <ButtonSidebar
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
                    
                    if (item.restricted === "coming_soon") {
                      return (
                        <ComingSoonRestricted key={item.id}>
                          {buttonElement}
                        </ComingSoonRestricted>
                      );
                    } else if (item.restricted === "lab_user") {
                      return (
                        <RoleRestricted key={item.id} requiredRole="lab_user" hideCompletely>
                          {buttonElement}
                        </RoleRestricted>
                      );
                    } else {
                      return <div key={item.id}>{buttonElement}</div>;
                    }
                  })}
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
