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
    .charAt(0)
    .toUpperCase();
}
// Función auxiliar para generar iniciales de proyectos
function getProjectInitials(name: string): string {
  return name
    .charAt(0)
    .toUpperCase();
}
// Componente selector de proyectos para el header (con avatar)
function ProjectSelectorSidebarHeader({ isExpanded }: { isExpanded: boolean }) {
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjectsLite(userData?.organization?.id);
  const { selectedProjectId, setSelectedProject } = useProjectContext();
  
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
export function TertiarySidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId, setSelectedProject } = useProjectContext();
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
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, userData?.organization?.id] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });
  
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
  const { currentSidebarContext, setSidebarContext, activeSidebarSection, setActiveSidebarSection, sidebarLevel, setSidebarLevel, goToMainLevel } = useNavigationStore();
  
  // Auto-detect and set correct sidebarLevel based on current location
  // Only set automatically when sidebarLevel is 'main' (initial state) to avoid interfering with user navigation
  useEffect(() => {
    if (sidebarLevel === 'main') {
      if (location.startsWith('/organization/')) {
        setSidebarLevel('organization');
      } else if (location.startsWith('/project/') || location.startsWith('/general/') || location.startsWith('/design/') || location.startsWith('/finances/') || location.startsWith('/construction/')) {
        setSidebarLevel('project');
        // Auto-expand construcción accordion when on construction routes
        if (location.startsWith('/construction/')) {
          setExpandedAccordion('construction');
        }
      } else if (location.startsWith('/library/')) {
        setSidebarLevel('library');
      } else if (location.startsWith('/proveedor/')) {
        setSidebarLevel('provider');
      } else if (location.startsWith('/admin/')) {
        setSidebarLevel('admin');
      }
    }
  }, [location, sidebarLevel, setSidebarLevel]);
  
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
    if (location.startsWith('/construction')) return 'construccion';
    if (location.startsWith('/finances')) return 'finanzas';
    if (location.startsWith('/library')) return 'biblioteca';
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
      case 'biblioteca':
        setSidebarLevel('library');
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
    if (['construccion', 'finanzas', 'diseno', 'analysis'].includes(sectionId)) {
      setExpandedAccordion(prev => prev === sectionId ? null : sectionId);
    } else {
      // Si no tiene submenu, navegar directamente
      navigate(defaultRoute);
    }
  };
  // Función para determinar qué sección está activa en el header
  const getActiveHeaderSection = () => {
    if (location.includes('/construction')) return 'construccion';
    if (location === '/' || location.includes('/organization') || location.includes('/finances') || location.includes('/design') || location.includes('/resources') || location.includes('/members')) return 'organizacion';
    if (location.includes('/project')) return 'proyecto';
    if (location.includes('/library')) return 'biblioteca';
    if (location.includes('/proveedor')) return 'proveedor';
    if (location.includes('/admin')) return 'administracion';
    return 'organizacion'; // Default to organization instead of inicio
  };

  // Definir contenido para cada nivel del sidebar
  const sidebarContent = {
    organization: [
      { icon: Home, label: 'Dashboard', href: '/organization/dashboard' },
      { icon: Folder, label: 'Proyectos', href: '/organization/projects' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Database, label: 'Datos Básicos', href: '/organization/data' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Settings, label: 'Preferencias', href: '/organization/preferences' }
    ],
    finances: [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
      { icon: DollarSign, label: 'Movimientos', href: '/finances/movements' },
      { icon: HandCoins, label: 'Capital', href: '/finances/capital' },
      { icon: CreditCard, label: 'Gastos Generales', href: '/finances/general-costs' }
    ],
    project: [
      { icon: Info, label: 'Información', href: '/general/info' },
      { icon: CheckSquare, label: 'Tablero', href: '/general/calendar' },
      { icon: FileText, label: 'Media', href: '/general/media' }
    ],
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
    library: [
      { icon: CheckSquare, label: 'Tareas', href: '/library/tasks' },
      { icon: Package2, label: 'Materiales', href: '/library/materials' },
      { icon: Users, label: 'Mano de Obra', href: '/library/labor' },
      { icon: TrendingUp, label: 'Costos Indirectos', href: '/library/indirects' }
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
  // Función para obtener el contenido fijo del tercer sidebar con 4 acordeones
  const getTertiarySidebarItems = () => {
    return [
      {
        type: 'section',
        label: 'GENERAL'
      },
      {
        type: 'accordion',
        id: 'organization',
        label: 'Organización',
        icon: Building,
        items: sidebarContent.organization || []
      },
      {
        type: 'accordion',
        id: 'finances',
        label: 'Finanzas',
        icon: DollarSign,
        items: sidebarContent.finances || []
      },
      {
        type: 'accordion',
        id: 'library',
        label: 'Biblioteca',
        icon: Library,
        items: sidebarContent.library || []
      },
      {
        type: 'section',
        label: 'PROYECTO'
      },
      {
        type: 'accordion',
        id: 'general',
        label: 'General',
        icon: FolderOpen,
        items: sidebarContent.project || []
      },
      {
        type: 'accordion', 
        id: 'construction',
        label: 'Construcción',
        icon: HardHat,
        items: sidebarContent.construction || []
      },
      {
        type: 'accordion', 
        id: 'commercialization',
        label: 'Comercialización',
        icon: Handshake,
        items: sidebarContent.commercialization || []
      },
      {
        type: 'accordion',
        id: 'admin',
        label: 'Administración',
        icon: Crown,
        items: sidebarContent.admin || []
      }
    ];
  };

  // Función para determinar qué acordeón está activo basado en la URL
  const getActiveAccordion = () => {
    if (location.startsWith('/organization')) return 'organization';
    if (location.startsWith('/general')) return 'general';  
    if (location.startsWith('/construction')) return 'construction';
    if (location.startsWith('/finances')) return 'finances';
    if (location.startsWith('/library')) return 'library';
    if (location.startsWith('/admin')) return 'admin';
    // Agregar más rutas según sea necesario
    return null;
  };

  const activeAccordion = getActiveAccordion();

  return (
    <>
    <aside 
      className={cn(
        "fixed border bg-[var(--main-sidebar-bg)] border-[var(--main-sidebar-border)] transition-all duration-300 z-30 flex flex-col rounded-2xl shadow-lg",
        isExpanded ? "w-64" : "w-[60px]"
      )}
      style={{
        left: '8px',
        top: '8px',
        bottom: '8px',
        height: 'calc(100vh - 16px)',
        overflow: 'hidden'
      }}
      onMouseEnter={() => {
        if (!isProjectPopoverOpen) {
          setHovered(true);
        }
        // En el nivel proyecto, expandir automáticamente la sección basada en la ubicación
        if (sidebarLevel === 'project') {
          if (location.startsWith('/general')) {
            setExpandedAccordion('general');
          } else if (location.startsWith('/construction')) {
            setExpandedAccordion('construccion');
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
        if (!isProjectPopoverOpen) {
          setHovered(false);
        }
      }}
    >
      {/* Project Selector Header - misma altura que PageHeader */}
      <div className={cn(
        "h-12 flex-shrink-0 flex items-center pt-3",
        "pl-[14px] pr-4 justify-start" // Siempre usar pl-[14px] para mantener el avatar fijo
      )}>
        {currentProject ? (
          <div 
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsProjectPopoverOpen(!isProjectPopoverOpen)}
          >
            {/* Avatar del proyecto */}
            <div className="flex-shrink-0">
              {currentProject.project_data?.project_image_url ? (
                <img 
                  src={currentProject.project_data.project_image_url} 
                  alt="Proyecto"
                  className="w-8 h-8 rounded-full border-2"
                  style={{ borderColor: currentProject.color || 'var(--main-sidebar-button-bg)' }}
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold border-2 text-sm"
                  style={{ 
                    backgroundColor: currentProject.color || 'var(--main-sidebar-button-bg)',
                    borderColor: currentProject.color || 'var(--main-sidebar-button-bg)'
                  }}
                >
                  {getProjectInitials(currentProject.name || 'P')}
                </div>
              )}
            </div>
            
            {/* Información del proyecto - solo cuando está expandido */}
            {isExpanded && (
              <div className="ml-3 flex-1 min-w-0">
                <div className="text-sm font-semibold text-black truncate">
                  {currentProject.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {currentProject.project_data?.project_type?.name || 'Sin tipo'}
                </div>
              </div>
            )}
          </div>
        ) : isExpanded ? (
          <span className="text-sm font-black text-black uppercase">
            MENÚ LATERAL
          </span>
        ) : null}
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 py-12 pl-[14px] pr-2">
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
              
              // Si es una sección, renderizar con la misma altura que un botón
              if ('type' in item && item.type === 'section') {
                return (
                  <div key={`section-${index}`} className="h-8 flex items-center px-2 mb-[2px]">
                    {isExpanded && (
                      <div className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                        {item.label}
                      </div>
                    )}
                  </div>
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
                      rightIcon={isExpanded ? (
                        <div className="transition-transform duration-200">
                          {isAccordionExpanded ? 
                            <ChevronUp className="w-3 h-3" /> : 
                            <ChevronDown className="w-3 h-3" />
                          }
                        </div>
                      ) : undefined}
                    />
                    
                    {/* Elementos del acordeón expandidos - solo si el sidebar está expandido Y el acordeón está expandido */}
                    {isExpanded && isAccordionExpanded && (
                      <div className="relative">
                        {/* Línea vertical que conecta los elementos hijos */}
                        <div 
                          className="absolute left-[16px] top-1 bottom-1 w-[1px]"
                          style={{
                            backgroundColor: 'var(--main-sidebar-button-hover-bg)',
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

              // For basic sidebar items (our current structure)
              const sidebarItem = item as SidebarItem;
              
              // Verificar que tengamos icon y label antes de renderizar
              if (!sidebarItem.icon || !sidebarItem.label) {
                return null;
              }
              
              const itemKey = sidebarItem.label || `item-${index}`;
              const isActive = Boolean('href' in sidebarItem && location === sidebarItem.href);
              const buttonElement = (
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
              );
              
              return (
                <div key={`${itemKey}-${index}`}>
                  {buttonElement}
                </div>
              );
          })}
        </div>
      </div>
      
      {/* Bottom Section - Fixed Buttons */}
      <div className="pb-3 pl-[14px]">
        <div className="flex flex-col gap-[2px]">
          {/* Divisor */}
          <div className="h-px bg-white/20 mb-2"></div>
          
          {/* Notifications */}
          <ButtonSidebar
            icon={<Bell className="w-[18px] h-[18px]" />}
            label="Notificaciones"
            isActive={false}
            isExpanded={isExpanded}
            onClick={() => console.log('Notificaciones clicked')}
            variant="secondary"
          />
          
          {/* User Avatar */}
          <ButtonSidebar
            icon={null}
            avatarUrl={userData?.user?.avatar_url}
            userFullName={userData?.user?.full_name}
            label={userData?.user?.full_name || 'Usuario'}
            isActive={false}
            isExpanded={isExpanded}
            onClick={() => navigate('/profile')}
            variant="secondary"
            disableHover={true}
          />
          
        </div>
      </div>
    </aside>

    {/* Popover de selección de proyecto */}
    {isProjectPopoverOpen && (
      <>
        {/* Overlay para cerrar al hacer click fuera */}
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsProjectPopoverOpen(false)}
        />
        
        {/* Popover */}
        <div
          className={cn(
            "fixed border bg-[var(--main-sidebar-bg)] border-[var(--main-sidebar-border)] z-50 flex flex-col rounded-2xl shadow-lg",
            "transition-all duration-300",
            "w-64"
          )}
          style={{
            left: '280px',
            top: '8px'
          }}
        >
          {/* Contenido del popover */}
          <div className="py-6 pl-[14px] pr-2">
            <div className="flex flex-col gap-[2px]">
              
              {/* Organización */}
              <div 
                className={cn(
                  "h-8 flex items-center px-2 mb-[2px] cursor-pointer rounded transition-colors",
                  !selectedProjectId ? "" : ""
                )}
                style={{
                  backgroundColor: 'var(--main-sidebar-button-bg)'
                }}
                onMouseEnter={(e) => {
                  if (!selectedProjectId) return;
                  e.currentTarget.style.color = 'var(--main-sidebar-button-active-fg)';
                }}
                onMouseLeave={(e) => {
                  if (!selectedProjectId) return;
                  e.currentTarget.style.color = 'var(--main-sidebar-button-fg)';
                }}
                onClick={() => {
                  if (userData?.organization?.id) {
                    updatePreferencesMutation.mutate({
                      organizationId: userData.organization.id,
                      lastProjectId: null
                    });
                  }
                  setIsProjectPopoverOpen(false);
                }}
              >
                <div className="flex items-center flex-1 min-w-0">
                  {/* Logo/Avatar de la organización */}
                  <div className="flex-shrink-0">
                    {userData?.organization?.logo_url ? (
                      <img 
                        src={userData.organization.logo_url} 
                        alt="Organización"
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        {getOrganizationInitials(userData?.organization?.name || 'O')}
                      </div>
                    )}
                  </div>
                  
                  {/* Nombre de la organización */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {userData?.organization?.name || 'Organización'}
                    </div>
                  </div>
                  
                  {/* Indicador de organización activa */}
                  {!selectedProjectId && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Divisor */}
              <div className="h-px my-2" style={{ backgroundColor: 'var(--main-sidebar-button-fg)', opacity: 0.2 }}></div>
              
              {/* Proyectos */}
              {sortedProjects.map((project: any) => (
                <div 
                  key={project.id}
                  className={cn(
                    "h-8 flex items-center px-2 mb-[2px] cursor-pointer rounded transition-colors",
                    selectedProjectId === project.id ? "" : ""
                  )}
                  style={{
                    color: selectedProjectId === project.id ? 'var(--main-sidebar-button-active-fg)' : 'var(--main-sidebar-button-fg)',
                    backgroundColor: 'var(--main-sidebar-button-bg)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProjectId === project.id) return;
                    e.currentTarget.style.color = 'var(--main-sidebar-button-active-fg)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProjectId === project.id) return;
                    e.currentTarget.style.color = 'var(--main-sidebar-button-fg)';
                  }}
                  onClick={() => {
                    if (userData?.organization?.id) {
                      updatePreferencesMutation.mutate({
                        organizationId: userData.organization.id,
                        lastProjectId: project.id
                      });
                    }
                    setIsProjectPopoverOpen(false);
                  }}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {/* Avatar del proyecto */}
                    <div className="flex-shrink-0">
                      {project.project_data?.project_image_url ? (
                        <img 
                          src={project.project_data.project_image_url} 
                          alt="Proyecto"
                          className="w-6 h-6 rounded-full border"
                          style={{ borderColor: project.color || 'var(--main-sidebar-button-bg)' }}
                        />
                      ) : (
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold border text-xs"
                          style={{ 
                            backgroundColor: project.color || 'var(--main-sidebar-button-bg)',
                            borderColor: project.color || 'var(--main-sidebar-button-bg)'
                          }}
                        >
                          {getProjectInitials(project.name || 'P')}
                        </div>
                      )}
                    </div>
                    
                    {/* Nombre del proyecto */}
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {project.name}
                      </div>
                    </div>
                    
                    {/* Indicador de proyecto activo */}
                    {selectedProjectId === project.id && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
}
