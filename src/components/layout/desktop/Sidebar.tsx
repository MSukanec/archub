import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
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
  ChevronUp
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
import ButtonSidebar from "./ButtonSidebar.tsx";
import PlanRestricted from "@/components/ui-custom/security/PlanRestricted";
import { useProjectContext } from "@/stores/projectContext";

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
export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isDocked, isHovered, setHovered, setDocked } = useSidebarStore();
  const { setDocked: setSecondarySidebarDocked } = useSecondarySidebarStore();
  
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
  // Función para obtener el contenido actual del sidebar según la sección activa del header
  const getCurrentSidebarItems = () => {
    const activeSection = getActiveHeaderSection();
    
    // Si estamos en una subsección (project, organization), usar el sidebarLevel actual
    if (sidebarLevel === 'organization') {
      return sidebarContent.organization;
    }
    if (sidebarLevel === 'project') {
      // Obtener solo los elementos permitidos sin accordion
      const baseProjectItems = sidebarContent.project;
      const commercializationItems = sidebarContent.commercialization; 
      const constructionItems = sidebarContent.construction;
      const financesItems = sidebarContent.finances;
      
      const allItems = [
        // Sección General (siempre visible)
        { type: 'section' as const, label: 'GENERAL' },
        ...baseProjectItems,
        
        // Sección Comercialización (siempre visible pero con accordion)
        { type: 'section' as const, label: 'COMERCIALIZACIÓN' },
        ...commercializationItems,
        
        // Sección Construcción (accordion)
        { type: 'section' as const, label: 'CONSTRUCCIÓN' },
        { 
          id: 'construction',
          icon: HardHat, 
          label: 'Construcción', 
          defaultRoute: '/construction/dashboard',
          submenu: constructionItems
        },
        
        // Sección Finanzas (accordion)
        { type: 'section' as const, label: 'FINANZAS' },
        { 
          id: 'finances',
          icon: DollarSign, 
          label: 'Finanzas', 
          defaultRoute: '/finances/dashboard',
          submenu: financesItems
        }
      ];
      
      return allItems;
    }
    if (sidebarLevel === 'library') {
      return sidebarContent.library;
    }
    if (sidebarLevel === 'provider') {
      return sidebarContent.provider;
    }
    if (sidebarLevel === 'admin') {
      return sidebarContent.admin;
    }
    
    // Default: main level items
    const mainItems = [
      {
        id: 'dashboard',
        icon: Home,
        label: 'Dashboard',
        defaultRoute: '/organization/dashboard'
      },
      {
        id: 'organizacion',
        icon: Building,
        label: 'Organización',
        defaultRoute: '/organization/dashboard',
        submenu: sidebarContent.organization
      },
      {
        id: 'proyecto',
        icon: HardHat,
        label: 'Proyecto',
        defaultRoute: '/general/info'
      },
      {
        id: 'biblioteca',
        icon: Library,
        label: 'Biblioteca',
        defaultRoute: '/library/tasks',
        submenu: sidebarContent.library
      }
    ];
    
    // Agregar proveedor solo si el usuario es admin
    if (isAdmin) {
      mainItems.push({
        id: 'proveedor',
        icon: Package,
        label: 'Proveedor',
        defaultRoute: '/proveedor/productos',
        submenu: sidebarContent.provider
      });
    }
    
    // Agregar administración solo si el usuario es admin
    if (isAdmin) {
      mainItems.push({
        id: 'administracion',
        icon: Crown,
        label: 'Administración',
        defaultRoute: '/admin/dashboard',
        submenu: sidebarContent.admin
      });
    }
    
    return mainItems;
  };

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-50 h-full flex flex-col justify-between',
        'transition-all duration-300 ease-out',
        // Siempre 64px de ancho
        'w-16',
        // Fondo y bordes
        'bg-[var(--main-sidebar-bg)] border-r border-[var(--main-sidebar-border)]'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* INICIO - SECCIÓN SUPERIOR: HEADERS */}
      <div className="flex flex-col">
        {/* Header: Selector de Organización y Proyecto */}
        <div className="p-2 space-y-2 border-b border-[var(--main-sidebar-border)]">
          {/* Selector de Organización */}
          <OrganizationSelectorSidebarHeader isExpanded={isExpanded} />
          
          {/* Selector de Proyecto */}
          <ProjectSelectorSidebarHeader isExpanded={isExpanded} />
        </div>
        
        {/* Título de sección solo cuando está expandido */}
        {isExpanded && (
          <span className="text-sm font-black text-black uppercase">
            {sidebarLevel === 'organization' && 'ORGANIZACIÓN'}
            {sidebarLevel === 'project' && 'PROYECTO'}
            {sidebarLevel === 'library' && 'BIBLIOTECA'}
            {sidebarLevel === 'provider' && 'PROVEEDOR'}
            {sidebarLevel === 'admin' && 'ADMINISTRACIÓN'}
            {sidebarLevel === 'main' && 'MENU PRINCIPAL'}
          </span>
        )}
        
        {/* Sidebar content */}
        <div className={cn(
          'flex-1 overflow-hidden px-2 py-2 space-y-1',
          isTransitioning && 'opacity-50'
        )}>
          {getCurrentSidebarItems().map((item: any, index: number) => {
            // Renderizar separador de sección
            if (item.type === 'section') {
              return isExpanded ? (
                <div key={`section-${index}`} className="px-2 py-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>
              ) : null;
            }
            
            // Item con submenu (acordeón)
            if (item.submenu) {
              const isExpanded_ = expandedAccordion === item.id;
              
              return (
                <div key={item.id}>
                  {/* Botón padre del acordeón */}
                  <ButtonSidebar
                    icon={<item.icon className="w-[18px] h-[18px]" />}
                    label={item.label}
                    isActive={location.includes(item.defaultRoute)}
                    isExpanded={isExpanded}
                    onClick={() => handleSubSectionClick(item.id, item.defaultRoute)}
                    rightIcon={isExpanded ? (isExpanded_ ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : undefined}
                    disableHover={true}
                  />
                  
                  {/* Línea vertical y submenu */}
                  {isExpanded && isExpanded_ && (
                    <div className="relative ml-4 mt-1">
                      {/* Línea vertical conectora */}
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-300"></div>
                      
                      {/* Items del submenu */}
                      <div className="space-y-1">
                        {item.submenu.map((subItem: any, subIndex: number) => (
                          <div key={subIndex} className="relative">
                            {/* Línea horizontal desde la vertical */}
                            <div className="absolute left-4 top-4 w-4 h-px bg-gray-300"></div>
                            
                            <div className="ml-8">
                              <ButtonSidebar
                                icon={<subItem.icon className="w-[18px] h-[18px]" />}
                                label={subItem.label}
                                isActive={location === subItem.href}
                                isExpanded={true}
                                href={subItem.href}
                                isChild={true}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            
            // Item simple
            return (
              <ButtonSidebar
                key={item.id || index}
                icon={<item.icon className="w-[18px] h-[18px]" />}
                label={item.label}
                isActive={location === item.href || location === item.defaultRoute}
                isExpanded={isExpanded}
                onClick={() => handleMainSectionClick(item.id, item.defaultRoute || item.href)}
              />
            );
          })}
        </div>
      </div>
      {/* FIN - SECCIÓN SUPERIOR */}

      {/* INICIO - SECCIÓN INFERIOR: CONTROLES */}
      <div className="p-2 border-t border-[var(--main-sidebar-border)] space-y-2">
        {/* Botón de tema */}
        <ButtonSidebar
          icon={theme === 'light' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          label={`Modo ${theme === 'light' ? 'claro' : 'oscuro'}`}
          isActive={false}
          isExpanded={isExpanded}
          onClick={handleThemeToggle}
        />
        
        {/* Botón de anclaje */}
        <ButtonSidebar
          icon={isDocked ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
          label={isDocked ? "Desanclar sidebar" : "Anclar sidebar"}
          isActive={false}
          isExpanded={isExpanded}
          onClick={handleDockToggle}
        />
        
        {/* Botón atrás */}
        {sidebarLevel !== 'main' && (
          <ButtonSidebar
            icon={<ArrowLeft className="w-[18px] h-[18px]" />}
            label="Atrás"
            isActive={false}
            isExpanded={isExpanded}
            onClick={() => setSidebarLevel('main')}
          />
        )}
      </div>
      {/* FIN - SECCIÓN INFERIOR */}
    </div>
  );
}