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
  Bell
} from "lucide-react";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { SelectorPopover } from "@/components/popovers/SelectorPopover";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import ButtonSidebar from "./ButtonSidebar";
import PlanRestricted from "@/components/ui-custom/security/PlanRestricted";
import { useProjectsLite } from "@/hooks/use-projects-lite";
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
      // Optimistic update: don't invalidate current-user to avoid 1000ms delay
      // The context state is already updated, no need to refetch user data
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

  // COMENTADO - SelectorPopover para organizaciones
  /*
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
  */
  
  // Placeholder temporal mientras usamos la nueva funcionalidad del sidebar
  return null;
}

export function MainSidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId, setSelectedProject } = useProjectContext();
  const { currentSidebarContext, setSidebarContext, activeSidebarSection, setActiveSidebarSection, sidebarLevel, setSidebarLevel, goToMainLevel } = useNavigationStore();
  
  // Obtener proyectos de la organización actual - ahora usa ProjectContext automáticamente
  const { data: projects = [] } = useProjectsLite();
  
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
    
    // Cerrar dropdown
    setIsDropdownOpen(false);
    
    // Solo actualizar la preferencia si es un proyecto diferente
    if (selectedProjectId !== projectId) {
      updateProjectMutation.mutate(projectId);
    } else {
      // Si es el mismo proyecto, solo asegurar que el contexto esté actualizado
      setSelectedProject(projectId);
    }
  };
  
  const handleOrganizationSelect = () => {
    setSidebarLevel('organization');
    // Cerrar dropdown
    setIsDropdownOpen(false);
  };
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
    return saved || 'CONSTRUCCIÓN'; // Por defecto "CONSTRUCCIÓN" expandida
  });

  // Estado para transiciones
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Estado para el dropdown selector
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);
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
  
  const prevContextRef = useRef(currentSidebarContext);
  
  // Handle fade animation when context changes
  useEffect(() => {
    prevContextRef.current = currentSidebarContext;
  }, [currentSidebarContext]);
  
  
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
      { icon: Users, label: 'Clientes', href: '/commercialization/clients' }
    ],
    construction: [
      { icon: CheckSquare, label: 'Cómputos', href: '/construction/tasks' },
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
        // Botones de administración (sin línea divisoria)
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
    <div 
      className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-r border-[var(--main-sidebar-border)] transition-all duration-150 z-30 flex flex-row overflow-visible"
      style={{
        height: 'calc(100vh - 3rem)', // 3rem = 48px del header h-12
        width: isHovered ? (isExpanded ? '304px' : '96px') : (isExpanded ? '256px' : '48px')
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
      
      {/* Columna derecha - Sidebar actual */}
      <aside 
        className={cn(
          "flex flex-col overflow-visible flex-1",
          isExpanded ? "w-64" : "w-12"
        )}
      >
      {/* Encabezado del contexto activo */}
      <div className={cn(
        "border-b border-[var(--main-sidebar-border)] flex items-center",
        isExpanded ? "min-h-[52px]" : "h-[52px]"
      )}>
        {isExpanded ? (
          // Expandido: mostrar dropdown selector
          <div className="w-full relative" ref={dropdownRef}>
            {/* Botón selector - muestra solo el elemento seleccionado */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center px-3 py-2 text-left w-full transition-all duration-200 hover:bg-[var(--main-sidebar-button-hover-bg)] min-h-[48px]"
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 overflow-hidden">
                  {sidebarLevel === 'organization' ? (
                    // Avatar organización
                    userData?.organization?.logo_url ? (
                      <img 
                        src={userData.organization.logo_url} 
                        alt="Organización"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white font-semibold text-xs"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        {getOrganizationInitials(userData?.organization?.name || 'O')}
                      </div>
                    )
                  ) : (
                    // Avatar proyecto seleccionado
                    selectedProjectId && projects.find(p => p.id === selectedProjectId) ? (
                      false ? (
                        <img 
                          src="" 
                          alt={projects.find(p => p.id === selectedProjectId)?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-white font-semibold text-xs"
                          style={{ 
                            backgroundColor: projects.find(p => p.id === selectedProjectId)?.color || 'var(--main-sidebar-button-bg)'
                          }}
                        >
                          {getProjectInitials(projects.find(p => p.id === selectedProjectId)?.name || 'P')}
                        </div>
                      )
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white font-semibold text-xs"
                        style={{ backgroundColor: 'var(--main-sidebar-button-bg)' }}
                      >
                        P
                      </div>
                    )
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div 
                    className="text-xs font-medium truncate"
                    style={{ color: 'var(--text-important)' }}
                  >
                    {sidebarLevel === 'organization' 
                      ? userData?.organization?.name || 'Organización'
                      : sidebarLevel === 'project' && selectedProjectId
                        ? projects.find(p => p.id === selectedProjectId)?.name || 'Proyecto'
                        : 'Proyecto'
                    }
                  </div>
                </div>
                {sidebarLevel === 'organization' && userData?.plan?.name && (
                  <Badge 
                    variant="secondary" 
                    className="h-4 px-1.5 text-xs font-medium text-white opacity-75 ml-2"
                    style={{
                      backgroundColor: userData.plan.name === 'Teams' ? 'var(--plan-teams-bg)' : 
                                      userData.plan.name === 'Pro' ? 'var(--plan-pro-bg)' : 
                                      userData.plan.name === 'Free' ? 'var(--plan-free-bg)' : 'var(--plan-free-bg)'
                    }}
                  >
                    {userData.plan.name}
                  </Badge>
                )}
                {/* Chevron */}
                <ChevronDown 
                  className={cn(
                    "w-3 h-3 ml-2 transition-transform duration-200",
                    isDropdownOpen ? "rotate-180" : ""
                  )} 
                />
              </div>
            </button>

            {/* Dropdown - aparece solo cuando isDropdownOpen es true */}
            {isDropdownOpen && (
              <div 
                className="absolute top-full left-0 right-0 z-50 border border-[var(--main-sidebar-border)] rounded-md shadow-lg"
                style={{ backgroundColor: 'var(--main-sidebar-bg)' }}
              >
                {/* Organización */}
                <button
                  onClick={handleOrganizationSelect}
                  className={cn(
                    "flex items-center px-3 py-2 text-left w-full transition-all duration-200 first:rounded-t-md",
                    sidebarLevel === 'organization' 
                      ? "bg-[var(--main-sidebar-button-active-bg)] text-[var(--main-sidebar-button-active-fg)]" 
                      : "hover:bg-[var(--main-sidebar-button-hover-bg)]"
                  )}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0 overflow-hidden">
                      {userData?.organization?.logo_url ? (
                        <img 
                          src={userData.organization.logo_url} 
                          alt="Organización"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-white font-semibold text-xs"
                          style={{ backgroundColor: 'var(--accent)' }}
                        >
                          {getOrganizationInitials(userData?.organization?.name || 'O')}
                        </div>
                      )}
                    </div>
                    <div 
                      className="text-xs font-medium truncate"
                      style={{ 
                        color: sidebarLevel === 'organization' 
                          ? 'var(--main-sidebar-button-active-fg)' 
                          : 'var(--text-important)' 
                      }}
                    >
                      {userData?.organization?.name || 'Organización'}
                    </div>
                    {sidebarLevel === 'organization' && userData?.plan?.name && (
                      <Badge 
                        variant="secondary" 
                        className="h-4 px-1.5 text-xs font-medium text-white opacity-75 ml-auto"
                        style={{
                          backgroundColor: userData.plan.name === 'Teams' ? 'var(--plan-teams-bg)' : 
                                          userData.plan.name === 'Pro' ? 'var(--plan-pro-bg)' : 
                                          userData.plan.name === 'Free' ? 'var(--plan-free-bg)' : 'var(--plan-free-bg)'
                        }}
                      >
                        {userData.plan.name}
                      </Badge>
                    )}
                  </div>
                </button>

                {/* Divisor */}
                <div className="h-px bg-[var(--main-sidebar-border)] mx-2"></div>

                {/* Proyectos */}
                <div className="max-h-40 overflow-y-auto">
                  {projects.map((project: any) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project.id)}
                      className={cn(
                        "flex items-center px-3 py-2 text-left w-full transition-all duration-200 last:rounded-b-md",
                        sidebarLevel === 'project' && selectedProjectId === project.id
                          ? "bg-[var(--main-sidebar-button-active-bg)] text-[var(--main-sidebar-button-active-fg)]" 
                          : "hover:bg-[var(--main-sidebar-button-hover-bg)]"
                      )}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0 overflow-hidden">
                          {project.project_image_url ? (
                            <img 
                              src={project.project_image_url} 
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-white font-semibold text-xs"
                              style={{ 
                                backgroundColor: project.color || 'var(--main-sidebar-button-bg)'
                              }}
                            >
                              {getProjectInitials(project.name || 'P')}
                            </div>
                          )}
                        </div>
                        <div 
                          className="text-xs font-medium truncate"
                          style={{ 
                            color: sidebarLevel === 'project' && selectedProjectId === project.id
                              ? 'var(--main-sidebar-button-active-fg)' 
                              : 'var(--text-important)' 
                          }}
                        >
                          {project.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Colapsado: mostrar avatar
          <div className="flex justify-center w-full">
            {sidebarLevel === 'organization' ? (
              // Avatar de la organización
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                {userData?.organization?.logo_url ? (
                  <img 
                    src={userData.organization.logo_url} 
                    alt="Organización"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {getOrganizationInitials(userData?.organization?.name || 'O')}
                  </div>
                )}
              </div>
            ) : (
              // Avatar del proyecto seleccionado
              selectedProjectId && projects.find(p => p.id === selectedProjectId) ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                  {false ? (
                    <img 
                      src="" 
                      alt={projects.find(p => p.id === selectedProjectId)?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-semibold text-xs"
                      style={{ backgroundColor: projects.find(p => p.id === selectedProjectId)?.color || 'var(--main-sidebar-button-bg)' }}
                    >
                      {getProjectInitials(projects.find(p => p.id === selectedProjectId)?.name || 'P')}
                    </div>
                  )}
                </div>
              ) : (
                // Fallback si no hay proyecto seleccionado
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--main-sidebar-button-bg)' }}>
                  <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs">
                    P
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
      
      {/* Navigation Items - Scrollable Content */}
      <div className="flex-1 overflow-y-auto pt-3 pb-2 px-0 min-h-0">
        <div className="flex flex-col gap-[2px] h-full">
          {(() => {
            const items = getTertiarySidebarItems();
            let currentSection: string | null = null;
            const elementsToRender: React.ReactNode[] = [];
            
            items.forEach((item: any, index: number) => {
              // Type guard to ensure we're working with a proper item
              if (!item || typeof item !== 'object') {
                return;
              }

              // Si es un divisor, renderizar línea divisoria
              if ('type' in item && item.type === 'divider') {
                elementsToRender.push(
                  <div key={`divider-${index}`} className="h-px bg-white/20 my-2"></div>
                );
                return;
              }
              
              // Si es una sección, renderizar como botón acordeón colapsable y actualizar currentSection
              if ('type' in item && item.type === 'section') {
                currentSection = item.label;
                const isAccordionExpanded = expandedAccordion === item.label;
                
                elementsToRender.push(
                  <ButtonSidebar
                    key={`section-${index}`}
                    icon={<Folder className="w-[18px] h-[18px]" />}
                    label={item.label}
                    isActive={false}
                    isExpanded={isExpanded}
                    onClick={() => toggleAccordion(item.label)}
                    variant="secondary"
                    rightIcon={isExpanded ? (
                      <div className="transition-transform duration-200">
                        {isAccordionExpanded ? 
                          <ChevronUp className="w-3 h-3" /> : 
                          <ChevronDown className="w-3 h-3" />
                        }
                      </div>
                    ) : undefined}
                  />
                );
                return;
              }

              // Si es un botón simple, renderizar solo si su sección está expandida (o si no hay sección activa)
              if ('type' in item && item.type === 'button') {
                // Si no hay currentSection o si la currentSection está expandida, mostrar el botón
                if (!currentSection || expandedAccordion === currentSection) {
                  elementsToRender.push(
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
                return;
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
                          className={cn(
                            "absolute top-1 bottom-1 w-[1px]",
                            isExpanded ? "left-[16px]" : "left-1/2 -translate-x-1/2"
                          )}
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

              // For basic sidebar items (our current structure)
              const sidebarItem = item as SidebarItem;
              
              // Verificar que tengamos icon y label antes de renderizar
              if (!sidebarItem.icon || !sidebarItem.label) {
                return;
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
              
              elementsToRender.push(
                <div key={`${itemKey}-${index}`}>
                  {buttonElement}
                </div>
              );
            });
            
            return elementsToRender;
          })()}
        </div>
      </div>
      
      
      </aside>
    </div>
    </>
  );
}
