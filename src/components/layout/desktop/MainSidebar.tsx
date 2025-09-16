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
import { 
  Settings, 
  UserCircle,
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  FolderOpen,
  Folder,
  Mail,
  Activity,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Tag,
  ChevronDown,
  ChevronRight,
  ChevronUp,
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
  Bell
} from "lucide-react";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { SelectorPopover } from "@/components/popovers/SelectorPopover";
import { Input } from "@/components/ui/input";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { useCurrenciesLite } from "@/hooks/use-currencies-lite";
import { useWalletsLite } from "@/hooks/use-wallets-lite";
import { useMovementConceptsLite } from "@/hooks/use-movement-concepts-lite";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import ButtonSidebar from "./ButtonSidebar";
import PlanRestricted from "@/components/ui-custom/security/PlanRestricted";
import { useProjects } from "@/hooks/use-projects";
import { SidebarAvatarButton } from "./SidebarAvatarButton";
import { Plus } from 'lucide-react';

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
// Función auxiliar para generar iniciales de organizaciones
function getOrganizationInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
// Función auxiliar para generar iniciales de proyectos
function getProjectInitials(name: string): string {
  return (name?.trim()?.[0] || '').toUpperCase();
}
// Componente selector de proyectos para el header (con avatar)
function ProjectSelectorSidebarHeader({ isExpanded }: { isExpanded: boolean }) {
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjectsLite(userData?.organization?.id);
  const { selectedProjectId, setSelectedProject } = useProjectContext();
  const { setSidebarLevel } = useNavigationStore();
  
  // Ordenar proyectos: proyecto activo primero, luego el resto
  const sortedProjects = [...projects].sort((a, b) => {
    if (selectedProjectId === a.id) return -1;
    if (selectedProjectId === b.id) return 1;
    return a.name.localeCompare(b.name);
  });
  const queryClient = useQueryClient();
  
  // Encontrar proyecto actual
  const currentProject = selectedProjectId ? projects.find((p: any) => p.id === selectedProjectId) : null;
  const displayName = currentProject?.name || "Sin proyecto";
  
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
      setSidebarLevel('project'); // Switch to project mode
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
    }
  });
  
  const handleProjectSelect = (projectId: string) => {
    if (selectedProjectId === projectId) return;
    updateProjectMutation.mutate(projectId);
  };
  
  // Preparar items para el selector
  const selectorItems = projects.map((project: any) => ({
    id: project.id,
    name: project.name,
    type: "Proyecto" as const,
    color: project.color ?? undefined
  }));

  return (
    <SelectorPopover
      trigger={
        <div>
          <ButtonSidebar
            icon={<Folder className="w-[18px] h-[18px]" />}
            label={isExpanded ? displayName : ""}
            isActive={false}
            isExpanded={isExpanded}
            variant="main"
            isHeaderButton={true}
            avatarUrl={undefined}
            userFullName={currentProject ? getProjectInitials(currentProject.name) : undefined}
            projectColor={currentProject?.color ?? undefined}
            rightIcon={isExpanded ? <ChevronDown className="w-3 h-3" /> : undefined}
          />
        </div>
      }
      items={selectorItems}
      selectedId={selectedProjectId || undefined}
      onSelect={handleProjectSelect}
      emptyMessage="No hay proyectos disponibles"
      getInitials={getProjectInitials}
    />
  );
}
// Componente selector de organizaciones para el header (con avatar)
function OrganizationSelectorSidebarHeader({ isExpanded }: { isExpanded: boolean }) {
  const { data: userData } = useCurrentUser();
  const organizations = userData?.organizations || [];
  const { setCurrentOrganization } = useProjectContext();
  const { setSidebarLevel } = useNavigationStore();
  const queryClient = useQueryClient();
  
  // Encontrar organización actual
  const currentOrganization = userData?.organization;
  const displayName = currentOrganization?.name || "Sin organización";
  
  // Mutación para cambiar organización
  const updateOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!userData?.user?.id) {
        throw new Error('Usuario no disponible');
      }
      const { error } = await supabase
        .from('user_preferences')
        .update({
          last_organization_id: organizationId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userData.user.id);
      if (error) throw error;
      return organizationId;
    },
    onSuccess: (organizationId) => {
      setCurrentOrganization(organizationId);
      setSidebarLevel('organization'); // Ensure organization mode after switching
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
  
  const handleOrganizationSelect = async (organizationId: string) => {
    if (currentOrganization?.id === organizationId) return;
    
    // Prefetch critical data before switching organization to eliminate delays
    try {
      await Promise.all([
        // Prefetch projects for the new organization
        queryClient.prefetchQuery({
          queryKey: ['projects-lite', organizationId],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('projects')
              .select('id, name, color, status')
              .eq('organization_id', organizationId)
              .eq('is_active', true)
              .order('name')
            
            if (error) throw error
            return data || []
          },
          staleTime: 30 * 60 * 1000, // 30 minutes
        }),
        
        // Prefetch movement concepts for the new organization
        queryClient.prefetchQuery({
          queryKey: ['movement-concepts-lite', organizationId],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('movement_concepts')
              .select('id, name, view_mode, type')
              .or(`and(is_system.eq.true,organization_id.is.null),organization_id.eq.${organizationId}`)
              .order('name')

            if (error) throw error
            return data || []
          },
          staleTime: 30 * 60 * 1000, // 30 minutes
        }),
        
        // Prefetch currencies (global data, but cache it anyway)
        queryClient.prefetchQuery({
          queryKey: ['currencies-lite'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('currencies')
              .select('id, name, symbol, code')
              .order('name')
            
            if (error) throw error
            return data || []
          },
          staleTime: 30 * 60 * 1000, // 30 minutes
        }),
        
        // Prefetch wallets (global data, but cache it anyway)
        queryClient.prefetchQuery({
          queryKey: ['wallets-lite'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('wallets')
              .select('id, name, is_default')
              .eq('is_active', true)
              .order('name')
            
            if (error) throw error
            return data || []
          },
          staleTime: 30 * 60 * 1000, // 30 minutes
        })
      ]);
    } catch (error) {
      console.warn('Prefetch failed, but proceeding with organization switch:', error);
    }
    
    // Now switch organization with data already cached
    updateOrganizationMutation.mutate(organizationId);
  };
  
  // Preparar items para el selector
  const selectorItems = organizations.map((organization: any) => ({
    id: organization.id,
    name: organization.name,
    logo_url: organization.logo_url,
    type: "Organización" as const
  }));

  return (
    <SelectorPopover
      trigger={
        <div>
          <ButtonSidebar
            icon={<Building2 className="w-[18px] h-[18px]" />}
            label={isExpanded ? displayName : ""}
            isActive={false}
            isExpanded={isExpanded}
            variant="main"
            isHeaderButton={true}
            avatarUrl={currentOrganization?.logo_url || undefined}
            userFullName={currentOrganization ? getOrganizationInitials(currentOrganization.name) : undefined}
            rightIcon={isExpanded ? <ChevronDown className="w-3 h-3" /> : undefined}
          />
        </div>
      }
      items={selectorItems}
      selectedId={currentOrganization?.id}
      onSelect={handleOrganizationSelect}
      emptyMessage="No hay organizaciones disponibles"
      getInitials={getOrganizationInitials}
    />
  );
}
export function MainSidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId, setSelectedProject } = useProjectContext();
  const { currentSidebarContext, setSidebarContext, activeSidebarSection, setActiveSidebarSection, sidebarLevel, setSidebarLevel, goToMainLevel } = useNavigationStore();
  // Mutación específica para cambiar proyecto (igual a la que funciona en Projects.tsx)
  const updatePreferencesMutation = useMutation({
    mutationFn: async ({ organizationId, lastProjectId }: { organizationId: string, lastProjectId: string | null }) => {
      if (!userData?.user?.id) {
        throw new Error('Usuario no disponible');
      }
      
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert({
          user_id: userData.user.id,
          organization_id: organizationId,
          last_project_id: lastProjectId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,organization_id'
        })
      
      if (error) throw error
      return lastProjectId;
    },
    onSuccess: (projectId) => {
      // ESTO es lo crucial que me faltaba!
      setSelectedProject(projectId, userData?.organization?.id);
      setSidebarLevel('project'); // Switch to project mode
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, userData?.organization?.id] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });

  // Handlers for organization and project selection (from RightSidebar)
  const handleProjectSelect = (projectId: string) => {
    if (selectedProjectId === projectId) return;
    updatePreferencesMutation.mutate({
      organizationId: userData?.organization?.id || '',
      lastProjectId: projectId
    });
  };

  const handleOrganizationSelect = () => {
    // Clear project selection to show organization view
    if (selectedProjectId === null) return; // Already in organization view
    setSelectedProject(null);
    // Update database to clear last_project_id
    updatePreferencesMutation.mutate({
      organizationId: userData?.organization?.id || '',
      lastProjectId: null
    });
  };

  const handleCreateProject = () => {
    // TODO: Open create project modal
    console.log('Create new project');
  };
  
  // Get projects for the current organization
  const { data: projects = [] } = useProjects(currentOrganizationId || undefined);
  
  // Ordenar proyectos: proyecto activo primero, luego el resto
  const sortedProjects = [...projects].sort((a, b) => {
    if (selectedProjectId === a.id) return -1;
    if (selectedProjectId === b.id) return 1;
    return a.name.localeCompare(b.name);
  });
  
  // Find the currently selected project
  const currentProject = projects.find(p => p.id === selectedProjectId);
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isDocked, isHovered, setHovered, setDocked } = useSidebarStore();
  const { isDocked: isSecondaryDocked, isHovered: isSecondaryHovered, setDocked: setSecondarySidebarDocked } = useSecondarySidebarStore();
  
  // Define if secondary sidebar is expanded
  const isSecondaryExpanded = isSecondaryDocked || isSecondaryHovered || isHovered;
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Initialize theme from user preferences
  useEffect(() => {
    const currentTheme = (userData?.preferences?.theme as 'light' | 'dark') || 'light';
    setTheme(currentTheme);
    
    // Apply theme to document
    const rootElement = document.documentElement;
    if (currentTheme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
  }, [userData?.preferences?.theme]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: { sidebar_docked?: boolean; theme?: 'light' | 'dark' }) => {
      if (!userData?.user?.id) throw new Error('User not found');
      
      const { error } = await supabase
        .from('user_preferences')
        .update(preferences)
        .eq('user_id', userData.user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });

  // Handle dock toggle
  const handleDockToggle = () => {
    const newDocked = !isDocked;
    setDocked(newDocked);
    setSecondarySidebarDocked(newDocked);
    savePreferencesMutation.mutate({ sidebar_docked: newDocked });
    
    toast({
      title: newDocked ? "Sidebar anclado" : "Sidebar desanclado",
      description: newDocked ? "El sidebar permanecerá visible" : "El sidebar se ocultará automáticamente"
    });
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Apply theme to document
    const rootElement = document.documentElement;
    if (newTheme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
    
    // Save theme preference
    savePreferencesMutation.mutate({ theme: newTheme });
    
    toast({
      title: `Modo ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`,
      description: `La interfaz ahora está en modo ${newTheme === 'dark' ? 'oscuro' : 'claro'}`
    });
  };
  
  // Define if the main sidebar should be expanded (docked or hovered)
  const isExpanded = isDocked || isHovered;
  
  // Sync sidebar state with user preferences
  useEffect(() => {
    if (userData?.preferences?.sidebar_docked !== undefined) {
      setDocked(userData.preferences.sidebar_docked);
    }
  }, [userData?.preferences?.sidebar_docked, setDocked]);
  
  // Sidebar level is now managed entirely through Zustand stores
  // No URL-based detection needed - components update stores directly
  
  // Estado para acordeones - solo uno abierto a la vez
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(() => {
    const saved = localStorage.getItem('sidebar-accordion');
    return saved || null;
  });

  // Estado para controlar el popover de selección de proyecto
  const [isProjectPopoverOpen, setIsProjectPopoverOpen] = useState(false);
  // Estado para transiciones
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Función para navegación con transición hacia adelante
  const navigateForward = (newContext: string, href: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSidebarContext(newContext as any);
      navigate(href);
      setIsTransitioning(false);
    }, 150);
  };
  // Función para navegación con transición hacia atrás
  const navigateBackward = (newContext: string, href: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSidebarContext(newContext as any);
      navigate(href);
      setIsTransitioning(false);
    }, 150);
  };
  // Guardar estado de acordeón en localStorage
  useEffect(() => {
    if (expandedAccordion) {
      localStorage.setItem('sidebar-accordion', expandedAccordion);
    } else {
      localStorage.removeItem('sidebar-accordion');
    }
  }, [expandedAccordion]);
  
  // Estado para búsqueda de proyectos
  const [projectSearchValue, setProjectSearchValue] = useState('');
  const prevContextRef = useRef(currentSidebarContext);
  
  // Handle fade animation when context changes
  useEffect(() => {
    prevContextRef.current = currentSidebarContext;
  }, [currentSidebarContext]);
  
  // Project selector removed as requested
  
  const toggleAccordion = (key: string) => {
    setExpandedAccordion(prev => prev === key ? null : key);
  };
  // Context titles - removing all titles as requested
  const sidebarContextTitles = {
    organization: null,
    organizations: null,
    project: null,
    design: null,
    construction: null,
    finances: null,
    commercialization: null,
    admin: null // Admin title removed as requested
  };
  // Función para detectar qué sección debería estar expandida basándose en la ubicación actual
  
  const getActiveSectionFromLocation = () => {
    if (location.startsWith('/organization')) return 'organizacion';
    if (location.startsWith('/design')) return 'diseno';
    if (location.startsWith('/construction')) return 'construction';
    if (location.startsWith('/finances')) return 'finanzas';
    if (location.startsWith('/proveedor')) return 'proveedor';
    if (location.startsWith('/admin')) return 'administracion';
    if (location === '/organization/dashboard') return null; // Dashboard es independiente
    return null;
  };
  // Función para manejar clicks en botones principales
  const handleMainSectionClick = (sectionId: string, defaultRoute: string) => {
    // Dashboard no tiene submenu, navegar directamente
    if (sectionId === 'dashboard') {
      navigate(defaultRoute);
      return;
    }
    
    // Cambiar al nivel correspondiente del sidebar
    switch (sectionId) {
      case 'organizacion':
        setSidebarLevel('organization');
        break;
      case 'proyecto':
        setSidebarLevel('project');
        break;
      case 'proveedor':
        setSidebarLevel('provider');
        break;
      case 'administracion':
        setSidebarLevel('admin');
        break;
      default:
        // Para otros casos, navegar directamente
        navigate(defaultRoute);
    }
  };
  // Función para manejar acordeón en subniveles
  const handleSubSectionClick = (sectionId: string, defaultRoute: string) => {
    // Si es una sección con submenu, toggle acordeón
    if (['construction', 'finanzas', 'diseno', 'analysis'].includes(sectionId)) {
      setExpandedAccordion(prev => prev === sectionId ? null : sectionId);
    } else {
      // Si no tiene submenu, navegar directamente
      navigate(defaultRoute);
    }
  };
  // Función para determinar qué sección está activa en el header
  const getActiveHeaderSection = () => {
    if (location.includes('/construction')) return 'construction';
    if (location === '/' || location.includes('/organization') || location.includes('/finances') || location.includes('/design') || location.includes('/resources') || location.includes('/members')) return 'organizacion';
    if (location.includes('/project')) return 'proyecto';
    if (location.includes('/proveedor')) return 'proveedor';
    if (location.includes('/admin')) return 'administracion';
    return 'organizacion'; // Default to organization instead of inicio
  };

  // Definir contenido para cada nivel del sidebar
  const sidebarContent = {
    organization: [
      { icon: Folder, label: 'Proyectos', href: '/organization/projects' },
      { icon: HandCoins, label: 'Capital', href: '/finances/capital' },
      { icon: CreditCard, label: 'Gastos Generales', href: '/finances/general-costs' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Settings, label: 'Preferencias', href: '/organization/preferences' }
    ],
    finances: [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
      { icon: HandCoins, label: 'Capital', href: '/finances/capital' },
      { icon: CreditCard, label: 'Gastos Generales', href: '/finances/general-costs' }
    ],
    project: [],
    commercialization: [
      { icon: Users, label: 'Clientes', href: '/general/clients' }
    ],
    construction: [
      { icon: CheckSquare, label: 'Tareas', href: '/construction/tasks' },
      { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
      { icon: Users, label: 'Mano de Obra', href: '/construction/personnel' },
      { icon: Package2, label: 'Materiales', href: '/construction/materials' },
      { icon: TrendingUp, label: 'Indirectos', href: '/construction/indirects' },
      { icon: Handshake, label: 'Subcontratos', href: '/construction/subcontracts' },
      { icon: FileText, label: 'Bitácora', href: '/construction/logs' }
    ],
    provider: [
      { icon: Package, label: 'Productos', href: '/proveedor/productos' }
    ],
    admin: [
      { icon: Crown, label: 'Comunidad', href: '/admin/dashboard' },
      { icon: ListTodo, label: 'Tareas', href: '/admin/tasks' },
      { icon: Database, label: 'Costos', href: '/admin/materials' },
      { icon: Settings, label: 'General', href: '/admin/general' },
      { icon: Package, label: 'Productos', href: '/providers/products' }
    ]
  };
  // Función para obtener el contenido del sidebar basado en el sidebarLevel
  const getTertiarySidebarItems = () => {
    if (sidebarLevel === 'project') {
      // Vista PROYECTO: cuando hay un proyecto seleccionado
      const projectItems = [
        {
          type: 'button',
          id: 'project-summary',
          icon: Home,
          label: 'Resumen de Proyecto',
          href: '/project/dashboard'
        },
        // Botones de construcción
        {
          type: 'section',
          label: 'CONSTRUCCIÓN'
        },
        ...(sidebarContent.construction || []).map(item => ({
          type: 'button',
          id: `construction-${item.href.split('/').pop()}`,
          icon: item.icon,
          label: item.label,
          href: item.href
        })),
        // Botones de comercialización
        {
          type: 'section',
          label: 'COMERCIALIZACIÓN'
        },
        ...(sidebarContent.commercialization || []).map(item => ({
          type: 'button',
          id: `commercialization-${item.href.split('/').pop()}`,
          icon: item.icon,
          label: item.label,
          href: item.href
        }))
      ];
      return projectItems;
    } else if (sidebarLevel === 'organization') {
      // Vista ORGANIZACIÓN
      const organizationItems = [
        {
          type: 'button',
          id: 'organization-summary',
          icon: Home,
          label: 'Resumen de Organización',
          href: '/organization/dashboard'
        },
        // Botones de administración
        {
          type: 'section',
          label: 'ADMINISTRACIÓN'
        },
        ...(sidebarContent.organization || []).map(item => ({
          type: 'button',
          id: `organization-${item.href.split('/').pop()}`,
          icon: item.icon,
          label: item.label,
          href: item.href
        })),
      ];
      return organizationItems;
    } else if (sidebarLevel === 'admin') {
      // Vista ADMINISTRACIÓN
      return [
        {
          type: 'button',
          id: 'admin-dashboard',
          icon: Crown,
          label: 'Comunidad',
          href: '/admin/dashboard'
        },
        {
          type: 'button',
          id: 'admin-tasks',
          icon: ListTodo,
          label: 'Tareas',
          href: '/admin/tasks'
        },
        {
          type: 'button',
          id: 'admin-materials',
          icon: Database,
          label: 'Costos',
          href: '/admin/materials'
        },
        {
          type: 'button',
          id: 'admin-general',
          icon: Settings,
          label: 'General',
          href: '/admin/general'
        },
        {
          type: 'button',
          id: 'admin-products',
          icon: Package,
          label: 'Productos',
          href: '/providers/products'
        }
      ];
    } else {
      // Default fallback para otros estados del sidebar
      return [];
    }
  };

  // Función para determinar qué acordeón está activo basado en la URL
  const getActiveAccordion = () => {
    // No activar acordeón cuando estemos en la página de resumen
    if (location === '/organization/dashboard') return null;
    // Solo activar acordeón "Administración" para rutas específicas de organización (no dashboard)
    if (location.startsWith('/organization/') && location !== '/organization/dashboard') return 'organization';
    if (location.startsWith('/general')) return 'general';  
    if (location.startsWith('/construction')) return 'construction';
    if (location.startsWith('/finances')) return 'finances';
    if (location.startsWith('/admin')) return 'admin';
    // Agregar más rutas según sea necesario
    return null;
  };

  const activeAccordion = getActiveAccordion();

  // Sincronizar el estado del acordeón con la URL actual
  useEffect(() => {
    const currentActiveAccordion = getActiveAccordion();
    if (currentActiveAccordion !== expandedAccordion) {
      setExpandedAccordion(currentActiveAccordion);
    }
  }, [location]);

  return (
    <>
    <aside 
      className={cn(
        "bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-r border-[var(--main-sidebar-border)] transition-all duration-150 z-30 flex overflow-visible",
        isExpanded ? "w-64" : "w-12"
      )}
      style={{
        height: 'calc(100vh - 3rem)' // 3rem = 48px del header h-12
      }}
      onMouseEnter={() => {
        setHovered(true);
        // En el nivel proyecto, expandir automáticamente la sección basada en la ubicación
        if (sidebarLevel === 'project') {
          if (location.startsWith('/general')) {
            setExpandedAccordion('general');
          } else if (location.startsWith('/construction')) {
            setExpandedAccordion('construction');
          } else if (location.startsWith('/finances')) {
            setExpandedAccordion('finanzas');
          } else if (location.startsWith('/design')) {
            setExpandedAccordion('diseno');
          } else if (location.startsWith('/project/')) {
            setExpandedAccordion('recursos');
          }
        }
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
    >
      {/* Left Column - Organization and Projects */}
      <div className="w-12 flex-shrink-0 flex flex-col h-full">
        {/* Organization Button */}
        <div className="pt-3 px-2">
          <SidebarAvatarButton
            avatarUrl={userData?.organization?.logo_url}
            backgroundColor="var(--accent)"
            borderColor="rgba(255, 255, 255, 0.3)"
            letter={userData?.organization?.name ? getOrganizationInitials(userData.organization.name) : 'O'}
            primaryText={userData?.organization?.name || 'Organización'}
            secondaryText="Organización"
            isExpanded={isExpanded}
            isActive={selectedProjectId === null}
            shape="rounded"
            onClick={handleOrganizationSelect}
          />
        </div>
        
        {/* Create New Project Button */}
        <div className="px-2 mt-2">
          <div
            className={cn(
              "flex items-center cursor-pointer rounded-lg transition-colors duration-200",
              "hover:bg-white/10 justify-center py-2"
            )}
            onClick={handleCreateProject}
            data-testid="create-project-button"
          >
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>
            
            {isExpanded && (
              <div className={cn(
                "flex-1 min-w-0 leading-tight overflow-hidden transition-[max-width,opacity,transform] duration-300",
                "ml-3 max-w-[220px] opacity-100 translate-x-0"
              )}>
                <p className="text-sm font-medium text-white truncate leading-tight whitespace-nowrap">
                  Nuevo Proyecto
                </p>
                <p className="text-xs text-white/60 truncate leading-tight -mt-0.5 whitespace-nowrap">
                  Crear proyecto
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Separator */}
        {sortedProjects.length > 0 && (
          <div className="h-px bg-white/20 mx-4 my-3"></div>
        )}
        
        {/* Project Buttons */}
        <div className="px-2 space-y-2 flex-1">
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
      </div>
      
      {/* Right Column - Navigation (only visible when expanded) */}
      {isExpanded && (
        <div className="flex-1 flex flex-col h-full">
          {/* Header with back button and title if needed */}
          <div className={cn(
            "h-12 flex-shrink-0 flex items-center px-4",
            sidebarLevel === 'organization' ? "hidden" : ""
          )}>
            {sidebarLevel !== 'organization' && (
              <button 
                onClick={() => {
                  switch (sidebarLevel) {
                    case 'project':
                    case 'admin':
                    case 'provider':
                      setSidebarLevel('organization');
                      break;
                    default:
                      goToMainLevel();
                  }
                }}
                className="flex items-center space-x-2 text-sm text-white/70 hover:text-white transition-colors"
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
            )}
          </div>
          
          {/* Navigation Items - Scrollable Content */}
          <div className="flex-1 overflow-y-auto pt-3 pb-2 px-0 min-h-0">
            <div className="flex flex-col gap-[2px] h-full">
              {getTertiarySidebarItems().map((item: any, index: number) => {
                  // Type guard to ensure we're working with a proper item
                  if (!item || typeof item !== 'object') {
                    return null;
                  }

                  // Si es un divisor, renderizar línea divisoria
                  if ('type' in item && item.type === 'divider') {
                    return (
                      <div key={`divider-${index}`} className="h-px bg-white/20 my-2"></div>
                    );
                  }
                  
                  // Si es una sección, renderizar con líneas divisorias como Supabase
                  if ('type' in item && item.type === 'section') {
                    return (
                      <div key={`section-${index}`} className="h-5 flex items-center my-1">
                        {/* Expandido: línea + texto centrado + línea */}
                        <div className="flex items-center w-full">
                          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--main-sidebar-button-fg)', opacity: 0.15 }}></div>
                          <div className="mx-3 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--main-sidebar-button-fg)', opacity: 0.6 }}>
                            {item.label}
                          </div>
                          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--main-sidebar-button-fg)', opacity: 0.15 }}></div>
                        </div>
                      </div>
                    );
                  }

                  // Si es un botón simple, renderizar ButtonSidebar directo
                  if ('type' in item && item.type === 'button') {
                    return (
                      <ButtonSidebar
                        key={`button-${item.id}`}
                        icon={<item.icon className="w-[18px] h-[18px]" />}
                        label={item.label}
                        isActive={location === item.href}
                        isExpanded={isExpanded}
                        onClick={() => navigate(item.href)}
                        variant="secondary"
                      />
                    );
                  }

                  // Si es un acordeón, renderizar acordeón con elementos expandibles
                  if ('type' in item && item.type === 'accordion') {
                    const accordionItem = item as any;
                    const isAccordionExpanded = expandedAccordion === accordionItem.id;
                    
                    return (
                      <div key={`accordion-${accordionItem.id}`}>
                        {/* Botón del acordeón */}
                        <ButtonSidebar
                          icon={<accordionItem.icon className="w-[18px] h-[18px]" />}
                          label={accordionItem.label}
                          isActive={accordionItem.id === activeAccordion}
                          isExpanded={isExpanded}
                          onClick={() => toggleAccordion(accordionItem.id)}
                          variant="secondary"
                          disableHover={true}
                          rightIcon={(
                            <div className="transition-transform duration-200">
                              {isAccordionExpanded ? 
                                <ChevronUp className="w-3 h-3" /> : 
                                <ChevronDown className="w-3 h-3" />
                              }
                            </div>
                          )}
                        />
                        
                        {/* Elementos del acordeón expandidos */}
                        {isAccordionExpanded && (
                          <div className="relative">
                            <div 
                              className="absolute top-1 bottom-1 w-[1px] left-[16px]"
                              style={{
                                backgroundColor: 'var(--main-sidebar-button-fg)',
                                opacity: 0.3,
                                zIndex: 1
                              }}
                            />
                            
                            <div className="ml-[32px]">
                              {(accordionItem.items || []).map((subItem: any, subIndex: number) => {
                                const isSubItemActive = Boolean(subItem.href && location === subItem.href);
                                return (
                                  <ButtonSidebar
                                    key={`${accordionItem.id}-${subIndex}`}
                                    icon={<subItem.icon className="w-[16px] h-[16px]" />}
                                    label={subItem.label}
                                    isActive={isSubItemActive}
                                    isExpanded={isExpanded}
                                    onClick={() => {
                                      if (subItem.href) {
                                        navigate(subItem.href);
                                      }
                                    }}
                                    href={subItem.href}
                                    variant="secondary"
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // For basic sidebar items
                  const sidebarItem = item as SidebarItem;
                  
                  if (!sidebarItem.icon || !sidebarItem.label) {
                    return null;
                  }
                  
                  const itemKey = sidebarItem.label || `item-${index}`;
                  const isActive = Boolean('href' in sidebarItem && location === sidebarItem.href);
                  
                  return (
                    <div key={`${itemKey}-${index}`}>
                      <ButtonSidebar
                        icon={<sidebarItem.icon className="w-[18px] h-[18px]" />}
                        label={sidebarItem.label}
                        isActive={isActive}
                        isExpanded={isExpanded}
                        onClick={() => {
                          if (sidebarItem.href) {
                            navigate(sidebarItem.href);
                          }
                        }}
                        href={sidebarItem.href}
                        variant="secondary"
                      />
                    </div>
                  );
              })}
            </div>
          </div>
          
          {/* Settings row - Always at bottom */}
          <div className="mt-auto px-4 pb-4 flex items-center justify-between">
            <button
              onClick={handleThemeToggle}
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-white/70" />
              ) : (
                <Sun className="w-5 h-5 text-white/70" />
              )}
            </button>
            
            <button
              onClick={handleDockToggle}
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              title={isDocked ? "Desanclar sidebar" : "Anclar sidebar"}
            >
              {isDocked ? (
                <PanelLeftClose className="w-5 h-5 text-white/70" />
              ) : (
                <PanelLeftOpen className="w-5 h-5 text-white/70" />
              )}
            </button>
          </div>
        </div>
      )}
    </aside>

    </>
  );
}
