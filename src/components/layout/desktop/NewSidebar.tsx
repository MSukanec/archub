import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useProjectContext } from '@/stores/projectContext';
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  UserCircle,
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  FolderOpen,
  Mail,
  Activity,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Tag,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Folder,
  Search,
  Crown,
  Package,
  Package2,
  Shield,
  Star,
  Zap,
  Sun,
  Moon,
  PanelLeftOpen,
  PanelLeftClose,
  CheckSquare,
  Calculator,
  FileCode,
  History,
  Contact,
  Images,
  Database,
  Layout,
  Receipt,
  Info,
  CreditCard,
  Handshake,
  Brush,
  HardHat,
  NotebookPen,
  FileImage,
  BookOpen,
  BarChart3,
  HandCoins,
  TrendingUp,
  ListTodo,
  TableIcon,
  Library,
  Building2,
  Bell,
  Plus
} from "lucide-react";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { SelectorPopover } from "@/components/popovers/SelectorPopover";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import ButtonSidebar from "./ButtonSidebar";
import PlanRestricted from "@/components/ui-custom/security/PlanRestricted";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { useProjects } from "@/hooks/use-projects";
import { SidebarAvatarButton } from './SidebarAvatarButton';
import { getOrganizationInitials, getProjectInitials } from "@/utils/initials";

// Define types for sidebar items
interface SidebarItem {
  icon: any;
  label: string;
  href: string;
}

interface SidebarItemWithSubmenu {
  id: string;
  icon: any;
  label: string;
  defaultRoute: string;
  submenu?: SidebarSubItem[];
  generalModeRestricted?: boolean;
}

interface SidebarSubItem {
  icon: any;
  label: string;
  href: string;
  generalModeRestricted?: boolean;
}

interface SidebarDivider {
  type: 'divider';
}

interface SidebarSection {
  type: 'section';
  label: string;
}

type AnySidebarItem = SidebarItem | SidebarItemWithSubmenu | SidebarDivider | SidebarSection;

// Left sidebar component for avatars
function LeftAvatarSidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const { data: userData } = useCurrentUser();
  const { selectedProjectId: contextProjectId, setSelectedProject } = useProjectContext();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: isLoadingProjects } = useProjects(
    userData?.organization?.id || ''
  );

  const selectedProjectId = contextProjectId || userData?.preferences?.last_project_id || null;

  // Sort projects to show active project first
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.id === selectedProjectId) return -1;
    if (b.id === selectedProjectId) return 1;
    return 0;
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (projectId: string | null) => {
      if (!userData?.user?.id || !userData?.organization?.id) {
        throw new Error('Usuario u organización no disponibles');
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
    }
  });

  const handleProjectSelect = (projectId: string) => {
    if (selectedProjectId === projectId) return;
    updateProjectMutation.mutate(projectId);
  };

  const handleOrganizationSelect = () => {
    // Clear project selection to show organization view
    if (selectedProjectId === null) return; // Already in organization view
    setSelectedProject(null);
    // Update database to clear last_project_id
    updateProjectMutation.mutate(null);
  };

  const handleCreateProject = () => {
    // TODO: Open create project modal
    console.log('Create new project');
  };

  const isExpanded = isHovered;

  return (
    <aside 
      className={cn(
        "bg-[var(--main-sidebar-bg)] transition-[width] duration-300 z-30 flex flex-col h-full",
        isExpanded ? "w-64" : "w-[60px]"
      )}
      style={{
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* All Buttons Section */}
      <div className="flex-1 pt-3 space-y-2 px-2">
        {/* Organization Button */}
        <SidebarAvatarButton
          avatarUrl={userData?.organization?.logo_url}
          backgroundColor="var(--accent)"
          borderColor="rgba(255, 255, 255, 0.3)"
          letter={getOrganizationInitials(userData?.organization?.name || '')}
          primaryText={userData?.organization?.name || 'Organización'}
          secondaryText="Organización"
          isExpanded={isExpanded}
          isActive={selectedProjectId === null}
          shape="rounded"
          onClick={handleOrganizationSelect}
        />

        {/* Create New Project Button */}
        <div
          className={cn(
            "flex items-center cursor-pointer rounded-lg transition-colors duration-200",
            "hover:bg-white/10",
            isExpanded ? "justify-start px-2 py-2" : "justify-center px-0 py-2"
          )}
          onClick={handleCreateProject}
          data-testid="create-project-button"
        >
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className={cn(
            "flex-1 min-w-0 leading-tight overflow-hidden transition-[max-width,opacity,transform] duration-300",
            isExpanded ? "ml-3 max-w-[220px] opacity-100 translate-x-0" : "ml-0 max-w-0 opacity-0 -translate-x-1"
          )}>
            <p className="text-sm font-medium text-white truncate leading-tight whitespace-nowrap">
              Nuevo Proyecto
            </p>
            <p className="text-xs text-white/60 truncate leading-tight -mt-0.5 whitespace-nowrap">
              Crear proyecto
            </p>
          </div>
        </div>

        {/* Separator */}
        {sortedProjects.length > 0 && (
          <div className="h-px bg-white/20 mx-2 my-3"></div>
        )}
        
        {/* Project Buttons */}
        {sortedProjects.map((project: any) => {
          const isActive = selectedProjectId === project.id;
          return (
            <SidebarAvatarButton
              key={project.id}
              backgroundColor={project.color || 'var(--main-sidebar-button-bg)'}
              letter={getProjectInitials(project.name)}
              primaryText={project.name}
              secondaryText={project.project_data?.project_type?.name || 'Sin tipo'}
              isExpanded={isExpanded}
              isActive={isActive}
              shape="circular"
              onClick={() => handleProjectSelect(project.id)}
              testId={`project-avatar-${project.id}`}
            />
          );
        })}
      </div>
    </aside>
  );
}

// Right menu sidebar component
function RightMenuSidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId, setSelectedProject } = useProjectContext();
  const { currentSidebarContext, setSidebarContext, activeSidebarSection, setActiveSidebarSection, sidebarLevel, setSidebarLevel, goToMainLevel } = useNavigationStore();
  
  // Obtener proyectos de la organización actual - ahora usa ProjectContext automáticamente
  const { data: projects = [] } = useProjectsLite();
  
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Sidebar store state
  const { isDocked, toggleDocked } = useSidebarStore();
  
  // Mutación para cambiar proyecto
  const updateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userData?.user?.id || !userData?.organization?.id) {
        throw new Error('Usuario u organización no disponibles');
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
      setSidebarLevel('project');
      // Optimistic update: don't invalidate current-user to avoid 1000ms delay
      // The context state is already updated, no need to refetch user data
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
    }
  });
  
  const handleProjectSelect = (projectId: string) => {
    // Siempre cambiar al nivel de proyecto cuando se clickea un proyecto
    setSidebarLevel('project');
    
    if (selectedProjectId === projectId) return;
    updateProjectMutation.mutate(projectId);
  };

  // Define menu items based on context
  const getMenuItems = (): AnySidebarItem[] => {
    const isProjectContext = selectedProjectId && sidebarLevel === 'project';

    if (isProjectContext) {
      // Project menu items
      return [
        { type: 'section', label: 'DISEÑO' },
        {
          id: 'design',
          icon: Brush,
          label: 'Diseño',
          defaultRoute: `/project/${selectedProjectId}/design`,
          submenu: [
            { icon: FileImage, label: 'Imágenes', href: `/project/${selectedProjectId}/design/images` },
            { icon: FileText, label: 'Documentos', href: `/project/${selectedProjectId}/design/documents` },
          ]
        },
        { type: 'section', label: 'CONSTRUCCIÓN' },
        {
          id: 'construction',
          icon: HardHat,
          label: 'Construcción',
          defaultRoute: `/project/${selectedProjectId}/construction`,
          submenu: [
            { icon: ListTodo, label: 'Tareas', href: `/project/${selectedProjectId}/construction/tasks` },
            { icon: Package, label: 'Personal', href: `/project/${selectedProjectId}/construction/personnel` },
            { icon: Package2, label: 'Materiales', href: `/project/${selectedProjectId}/construction/materials` },
            { icon: Handshake, label: 'Subcontratos', href: `/project/${selectedProjectId}/construction/subcontracts` },
            { icon: Calculator, label: 'Presupuesto', href: `/project/${selectedProjectId}/construction/estimates` },
            { icon: FileCode, label: 'Indirectos', href: `/project/${selectedProjectId}/construction/indirects` },
            { icon: History, label: 'Bitácora', href: `/project/${selectedProjectId}/construction/logs` },
          ]
        },
        { type: 'section', label: 'FINANZAS' },
        {
          id: 'finances',
          icon: DollarSign,
          label: 'Finanzas',
          defaultRoute: `/project/${selectedProjectId}/finances`,
          submenu: [
            { icon: TrendingUp, label: 'Movimientos', href: `/project/${selectedProjectId}/finances/movements` },
            { icon: HandCoins, label: 'Conversiones', href: `/project/${selectedProjectId}/finances/conversions` },
            { icon: CreditCard, label: 'Transferencias', href: `/project/${selectedProjectId}/finances/transfers` },
            { icon: Receipt, label: 'Presupuestos', href: `/project/${selectedProjectId}/finances/budgets` },
            { icon: Contact, label: 'Clientes', href: `/project/${selectedProjectId}/finances/clients` },
          ]
        },
        { type: 'section', label: 'RECURSOS' },
        {
          id: 'resources',
          icon: FolderOpen,
          label: 'Recursos',
          defaultRoute: `/project/${selectedProjectId}/resources`,
          submenu: [
            { icon: FileText, label: 'Documentación', href: `/project/${selectedProjectId}/resources/documentation` },
            { icon: Images, label: 'Galería', href: `/project/${selectedProjectId}/resources/gallery` },
            { icon: Contact, label: 'Contactos', href: `/project/${selectedProjectId}/resources/contacts` },
          ]
        }
      ];
    } else {
      // Organization menu items
      return [
        { type: 'section', label: 'ORGANIZACIÓN' },
        { icon: Home, label: 'Dashboard', href: '/organization' },
        { icon: Building2, label: 'Proyectos', href: '/organization/projects' },
        { icon: Activity, label: 'Actividad', href: '/organization/activity' },
        { icon: Settings, label: 'Preferencias', href: '/organization/preferences' },
        { type: 'divider' },
        { type: 'section', label: 'FINANZAS' },
        {
          id: 'finances',
          icon: DollarSign,
          label: 'Finanzas',
          defaultRoute: '/organization/finances',
          submenu: [
            { icon: TrendingUp, label: 'Movimientos', href: '/organization/finances/movements' },
            { icon: HandCoins, label: 'Conversiones', href: '/organization/finances/conversions' },
            { icon: CreditCard, label: 'Transferencias', href: '/organization/finances/transfers' },
            { icon: Receipt, label: 'Presupuestos', href: '/organization/finances/budgets' },
            { icon: Contact, label: 'Clientes', href: '/organization/finances/clients' },
          ]
        },
        { type: 'section', label: 'RECURSOS' },
        {
          id: 'resources',
          icon: FolderOpen,
          label: 'Recursos',
          defaultRoute: '/organization/resources',
          submenu: [
            { icon: FileText, label: 'Documentación', href: '/organization/resources/documentation' },
            { icon: Images, label: 'Galería', href: '/organization/resources/gallery' },
            { icon: Contact, label: 'Contactos', href: '/organization/resources/contacts' },
          ]
        }
      ];
    }
  };

  const menuItems = getMenuItems();

  const isActiveRoute = (href: string): boolean => {
    return location === href || location.startsWith(href + '/');
  };

  const renderMenuItem = (item: AnySidebarItem, index: number) => {
    if (item.type === 'divider') {
      return <DropdownMenuSeparator key={index} className="my-2" />;
    }

    if (item.type === 'section') {
      return (
        <div key={index} className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {item.label}
        </div>
      );
    }

    if ('submenu' in item) {
      const isExpanded = activeSidebarSection === item.id;
      const isAnySubmenuActive = item.submenu?.some(subItem => isActiveRoute(subItem.href)) || false;

      return (
        <div key={item.id}>
          <ButtonSidebar
            icon={item.icon}
            label={item.label}
            isActive={isAnySubmenuActive}
            isExpanded={true}
            rightIcon={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            onClick={() => {
              if (isExpanded) {
                setActiveSidebarSection('');
              } else {
                setActiveSidebarSection(item.id);
                if (!isAnySubmenuActive) {
                  navigate(item.defaultRoute);
                }
              }
            }}
          />
          {isExpanded && item.submenu && (
            <div className="ml-4 space-y-1">
              {item.submenu.map((subItem, subIndex) => (
                <ButtonSidebar
                  key={subIndex}
                  icon={subItem.icon}
                  label={subItem.label}
                  isActive={isActiveRoute(subItem.href)}
                  isExpanded={true}
                  isChild={true}
                  href={subItem.href}
                />
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <ButtonSidebar
          key={index}
          icon={item.icon}
          label={item.label}
          isActive={isActiveRoute(item.href)}
          isExpanded={true}
          href={item.href}
        />
      );
    }
  };

  return (
    <aside className="bg-background/95 w-64 border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedProjectId && sidebarLevel === 'project' ? 'Proyecto' : 'Organización'}
          </h2>
          <button
            onClick={() => setSidebarLevel(sidebarLevel === 'project' ? 'organization' : 'project')}
            className="p-1 hover:bg-muted rounded"
          >
            {sidebarLevel === 'project' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="space-y-1 px-2">
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-2">
        {isAdmin && (
          <ButtonSidebar
            icon={Crown}
            label="Administración"
            isActive={location.startsWith('/admin')}
            isExpanded={true}
            href="/admin"
          />
        )}
        
        <div className="flex items-center justify-between">
          <ButtonSidebar
            icon={Settings}
            label="Configuración"
            isActive={location === '/settings'}
            isExpanded={true}
            href="/settings"
          />
          
          <button
            onClick={toggleDocked}
            className="p-2 hover:bg-muted rounded"
            title={isDocked ? "Desanclar sidebar" : "Anclar sidebar"}
          >
            {isDocked ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}

// Main double sidebar component
export function NewSidebar() {
  return (
    <div className="flex h-full">
      <LeftAvatarSidebar />
      <RightMenuSidebar />
    </div>
  );
}

export { NewSidebar as MainSidebar };