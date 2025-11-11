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
import { useUnreadSupportMessages } from '@/hooks/use-unread-support-messages';
import ButtonSidebar from "../desktop-layout-classic/ButtonSidebar";
import { SidebarIconButton } from "../desktop/SidebarIconButton";
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
  BarChart3,
  Folder,
  TrendingUp,
  MapPin
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
  
  // Contador de mensajes sin leer (solo para admins)
  const { data: unreadCount = 0 } = useUnreadSupportMessages();
  
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
      default: return '';
    }
  };

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
            <div className="px-0 pt-6 pb-6 overflow-y-auto flex-1">
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

                  {/* Divisor */}
                  <div className="my-3 w-8 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />

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

                  {/* Divisor */}
                  <div className="my-3 w-8 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />

                  {/* Botón Comunidad */}
                  <PlanRestricted reason="coming_soon">
                    <SidebarIconButton
                      icon={<Users className="h-5 w-5" />}
                      isActive={sidebarLevel === 'community'}
                      onClick={() => setSidebarLevel('community')}
                      testId="button-sidebar-community"
                    />
                  </PlanRestricted>

                  {/* Botón Capacitaciones */}
                  <SidebarIconButton
                    icon={<GraduationCap className="h-5 w-5" />}
                    isActive={sidebarLevel === 'learning'}
                    onClick={() => setSidebarLevel('learning')}
                  />

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
                </div>
              </div>
          </div>

          {/* SIDEBAR DERECHO - NAVEGACIÓN ESPECÍFICA (240px, aparece en hover) */}
          {isHovered && sidebarLevel !== 'general' && (
            <div className="w-[240px] h-full px-[9px] pt-6 pb-6 flex flex-col">
              {/* Título del contexto */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[var(--main-sidebar-fg)] px-2">
                  {getContextTitle()}
                </h2>
              </div>

              {/* Botones de navegación */}
              <div className="flex flex-col gap-[2px] flex-1 overflow-y-auto">
                {navigationItems.map((item) => {
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
                })}
              </div>

              {/* Botón de anclaje en la parte inferior */}
              <div className="mt-6 flex flex-col gap-[2px]">
                <ButtonSidebar
                  icon={isDocked ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
                  label={isDocked ? "Desanclar" : "Anclar"}
                  isActive={false}
                  isExpanded={true}
                  onClick={handleDockToggle}
                  variant="secondary"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
