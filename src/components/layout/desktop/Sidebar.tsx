import { useState, useEffect, useRef } from "react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useProjects } from "@/hooks/use-projects";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import SidebarButton from "./SidebarButton";
import PlanRestricted from "@/components/ui-custom/security/PlanRestricted";
import PlanBadge from "@/components/ui-custom/security/PlanBadge";
import { useProjectContext } from "@/stores/projectContext";
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
  const { data: projects = [] } = useProjects(userData?.organization?.id);
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
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <SidebarButton
            icon={<Folder className="w-[18px] h-[18px]" />}
            label={isExpanded ? displayName : ""}
            isActive={false}
            isExpanded={isExpanded}
            variant="main"
            isHeaderButton={true}
            avatarUrl={currentProject?.logo_url || undefined}
            userFullName={currentProject ? getProjectInitials(currentProject.name) : undefined}
            rightIcon={isExpanded ? <ChevronDown className="w-3 h-3" /> : undefined}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        side="bottom"
        align="center" 
        className="w-80 bg-[var(--main-sidebar-bg)] border-[var(--main-sidebar-border)] fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" 
        onCloseAutoFocus={(e) => e.preventDefault()}
        sideOffset={0}
        alignOffset={0}
        avoidCollisions={false}
        sticky="partial"
      >
        {projects.length > 0 ? (
          projects.map((project: any) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleProjectSelect(project.id)}
              className={cn(
                "flex items-center justify-between text-[var(--main-sidebar-fg)] hover:bg-[var(--main-sidebar-button-hover-bg)] focus:bg-[var(--main-sidebar-button-hover-bg)] p-3",
                selectedProjectId === project.id && "bg-[var(--accent)] text-white hover:bg-[var(--accent)] focus:bg-[var(--accent)]"
              )}
            >
              <div className="flex items-center gap-3">
                {project.logo_url ? (
                  <img 
                    src={project.logo_url} 
                    alt="Avatar"
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
                    {getProjectInitials(project.name)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-xs opacity-70">Proyecto</span>
                </div>
              </div>
              {selectedProjectId === project.id && (
                <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: 'var(--accent)' }} />
              )}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-3 py-4 text-center text-sm text-[var(--main-sidebar-fg)]">
            No hay proyectos disponibles
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
      // Recargar la página para aplicar el cambio de organización completamente
      window.location.reload();
    }
  });
  
  const handleOrganizationSelect = (organizationId: string) => {
    if (currentOrganization?.id === organizationId) return;
    updateOrganizationMutation.mutate(organizationId);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <SidebarButton
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
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        side="bottom"
        align="center" 
        className="w-80 bg-[var(--main-sidebar-bg)] border-[var(--main-sidebar-border)] fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" 
        onCloseAutoFocus={(e) => e.preventDefault()}
        sideOffset={0}
        alignOffset={0}
        avoidCollisions={false}
        sticky="partial"
      >
        {organizations.length > 0 ? (
          organizations.map((organization: any) => (
            <DropdownMenuItem
              key={organization.id}
              onClick={() => handleOrganizationSelect(organization.id)}
              className={cn(
                "flex items-center justify-between text-[var(--main-sidebar-fg)] hover:bg-[var(--main-sidebar-button-hover-bg)] focus:bg-[var(--main-sidebar-button-hover-bg)] p-3",
                currentOrganization?.id === organization.id && "bg-[var(--accent)] text-white hover:bg-[var(--accent)] focus:bg-[var(--accent)]"
              )}
            >
              <div className="flex items-center gap-3">
                {organization.logo_url ? (
                  <img 
                    src={organization.logo_url} 
                    alt="Avatar"
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
                    {getOrganizationInitials(organization.name)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{organization.name}</span>
                  <span className="text-xs opacity-70">Organización</span>
                </div>
              </div>
              {currentOrganization?.id === organization.id && (
                <div className="w-2 h-2 rounded-full ml-auto bg-white" />
              )}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-3 py-4 text-center text-sm text-[var(--main-sidebar-fg)]">
            No hay organizaciones disponibles
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const { isDocked, isHovered, setHovered, setDocked } = useSidebarStore();
  const { setDocked: setSecondarySidebarDocked } = useSecondarySidebarStore();
  
  // Define if the main sidebar should be expanded (docked or hovered)
  const isExpanded = isDocked || isHovered;
  
  // Sync sidebar state with user preferences
  useEffect(() => {
    if (userData?.preferences?.sidebar_docked !== undefined) {
      setDocked(userData.preferences.sidebar_docked);
    }
  }, [userData?.preferences?.sidebar_docked, setDocked]);
  const { currentSidebarContext, setSidebarContext, activeSidebarSection, setActiveSidebarSection, sidebarLevel, setSidebarLevel, goToMainLevel } = useNavigationStore();
  const queryClient = useQueryClient();
  
  // Theme state
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Initialize theme from user preferences
  useEffect(() => {
    const currentTheme = (userData?.preferences?.theme as 'light' | 'dark') || 'light';
    setTheme(currentTheme);
    setIsDark(currentTheme === 'dark');
    
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
    // Update secondary sidebar store to trigger visual changes
    setSecondarySidebarDocked(newDocked);
    savePreferencesMutation.mutate({ sidebar_docked: newDocked });
    
    // Show toast notification
    toast({
      title: newDocked ? "Sidebar anclado" : "Sidebar desanclado",
      description: newDocked ? "El sidebar permanecerá siempre visible" : "El sidebar se ocultará automáticamente",
    });
  };
  
  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setIsDark(newTheme === 'dark');
    
    // Apply theme to document immediately
    const rootElement = document.documentElement;
    if (newTheme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
    
    savePreferencesMutation.mutate({ theme: newTheme });
    
    // Show toast notification
    toast({
      title: `Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`,
      description: `La aplicación ahora utiliza el tema ${newTheme === 'dark' ? 'oscuro' : 'claro'}`,
    });
  };
  
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
  // Theme toggle mutation
  const themeToggleMutation = useMutation({
    mutationFn: async (newTheme: 'light' | 'dark') => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('No user preferences available');
      }
      const { error } = await supabase
        .from('user_preferences')
        .update({ theme: newTheme })
        .eq('id', userData.preferences.id);
      if (error) throw error;
      return newTheme;
    },
    onSuccess: (newTheme) => {
      // Apply theme to document
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Invalidate current user cache
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });
  // Sidebar toggle mutation
  const sidebarToggleMutation = useMutation({
    mutationFn: async (newDockedState: boolean) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('No user preferences available');
      }
      const { error } = await supabase
        .from('user_preferences')
        .update({ sidebar_docked: newDockedState })
        .eq('id', userData.preferences.id);
      if (error) throw error;
      return newDockedState;
    },
    onSuccess: (newDockedState) => {
      // Update local sidebar store immediately
      useSidebarStore.getState().setDocked(newDockedState);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });
  
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
    if (location === '/dashboard') return null; // Resumen es independiente
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
  // Definir contenido para cada nivel del sidebar
  const sidebarContent = {
    main: [
      {
        id: 'dashboard',
        icon: Home,
        label: 'Dashboard',
        defaultRoute: '/dashboard',
        isActive: location === '/dashboard'
      },
      {
        id: 'organizacion',
        icon: Building,
        label: 'Organización',
        defaultRoute: '/organization',
        isActive: location.startsWith('/organization')
      },
      {
        id: 'proyecto',
        icon: FolderOpen,
        label: 'Proyecto',
        defaultRoute: '/construction/dashboard',
        isActive: location.startsWith('/design') || location.startsWith('/construction') || location.startsWith('/finances')
      },
      {
        id: 'biblioteca',
        icon: Library,
        label: 'Biblioteca',
        defaultRoute: '/library/documentation',
        isActive: location.startsWith('/library')
      },
      {
        id: 'proveedor',
        icon: Package,
        label: 'Proveedor',
        defaultRoute: '/proveedor/productos',
        isActive: location.startsWith('/proveedor')
      },
      ...(isAdmin ? [{
        id: 'administracion',
        icon: Crown,
        label: 'Administración',
        defaultRoute: '/admin/dashboard',
        isActive: location.startsWith('/admin')
      }] : [])
    ],
    organization: [
      { icon: Folder, label: 'Proyectos', href: '/organization/projects' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Database, label: 'Datos Básicos', href: '/organization/data' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Settings, label: 'Preferencias', href: '/organization/preferences' }
    ],
    project: [
      {
        id: 'diseno',
        icon: Brush,
        label: 'Diseño',
        defaultRoute: '/design/dashboard',
        generalModeRestricted: true,
        submenu: [
          { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard' }
        ]
      },
      {
        id: 'construccion',
        icon: HardHat,
        label: 'Construcción',
        defaultRoute: '/construction/dashboard',
        submenu: [
          { icon: Home, label: 'Resumen', href: '/construction/dashboard' },
          { icon: CheckSquare, label: 'Tareas', href: '/construction/tasks' },
          { icon: Users, label: 'Personal', href: '/construction/personnel' },
          { icon: Handshake, label: 'Subcontratos', href: '/construction/subcontracts' },
          { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
          { icon: Package2, label: 'Materiales', href: '/construction/materials' },
          { icon: FileText, label: 'Bitácora', href: '/construction/logs' }
        ]
      },
      {
        id: 'finanzas',
        icon: DollarSign,
        label: 'Finanzas',
        defaultRoute: '/finances/dashboard',
        submenu: [
          { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
          { icon: DollarSign, label: 'Movimientos', href: '/finances/movements' },
          { icon: Users, label: 'Clientes', href: '/finances/clients' },
          { icon: BarChart3, label: 'Análisis de Obra', href: '/finances/analysis', generalModeRestricted: true },
          { icon: TrendingUp, label: 'Movimientos de Capital', href: '/finances/capital-movements', generalModeRestricted: true }
        ]
      },
      { type: 'divider' },
      { icon: FileText, label: 'Documentación', href: '/project/documentation' },
      { icon: Images, label: 'Galería', href: '/project/gallery' },
      { icon: Layout, label: 'Tablero', href: '/project/board' }
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
      { icon: Database, label: 'Materiales', href: '/admin/materials' },
      { icon: Settings, label: 'General', href: '/admin/general' }
    ]
  };
  // Función para obtener el contenido actual del sidebar según el nivel
  const getCurrentSidebarItems = () => {
    return sidebarContent[sidebarLevel] || sidebarContent.main;
  };
  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 h-screen border-r bg-[var(--main-sidebar-bg)] border-[var(--main-sidebar-border)] transition-all duration-300 z-50 flex flex-col",
        isExpanded ? "w-64" : "w-[40px]"
      )}
      style={{
        overflow: 'hidden'
      }}
      onMouseEnter={() => {
        setHovered(true);
        // En el nivel proyecto, expandir automáticamente la sección basada en la ubicación
        if (sidebarLevel === 'project') {
          if (location.startsWith('/construction')) {
            setExpandedAccordion('construccion');
          } else if (location.startsWith('/finances')) {
            setExpandedAccordion('finanzas');
          } else if (location.startsWith('/design')) {
            setExpandedAccordion('diseno');
          }
        }
      }}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Selector Section - Ahora arriba */}
      <div className="h-9 flex items-center">
        <div className="w-full p-1">
        {sidebarLevel === 'main' ? (
          <SidebarButton
            icon={null} // Sin icono para ARCHUB
            label="ARCHUB"
            isActive={false}
            isExpanded={isExpanded}
            variant="main"
            isHeaderButton={true}
          />
        ) : sidebarLevel === 'project' ? (
          <ProjectSelectorSidebarHeader isExpanded={isExpanded} />
        ) : sidebarLevel === 'organization' ? (
          <OrganizationSelectorSidebarHeader isExpanded={isExpanded} />
        ) : (
          <SidebarButton
            icon={<ArrowLeft className="w-[18px] h-[18px]" />}
            label={
              sidebarLevel === 'library' ? 'BIBLIOTECA' :
              sidebarLevel === 'provider' ? 'PROVEEDOR' :
              sidebarLevel === 'admin' ? 'ADMINISTRACIÓN' : 'SECCIÓN'
            }
            isActive={false}
            isExpanded={isExpanded}
            onClick={goToMainLevel}
            variant="main"
            isHeaderButton={true}
          />
        )}
        </div>
      </div>
      {/* Navigation Items */}
      <div className="flex-1 p-1 pt-3">
        <div className="flex flex-col gap-[2px] h-full">
          <div className={`flex-1 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {/* Botón de título - Ahora abajo */}
            {(sidebarLevel === 'project' || sidebarLevel === 'organization') && (
              <div>
                <div className="mb-[2px]">
                  <SidebarButton
                    icon={<ArrowLeft className="w-[18px] h-[18px]" />}
                    label={
                      sidebarLevel === 'organization' ? 'ORGANIZACIÓN' :
                      sidebarLevel === 'project' ? 'PROYECTO' : 'SECCIÓN'
                    }
                    isActive={false}
                    isExpanded={isExpanded}
                    onClick={goToMainLevel}
                    variant="main"
                    isHeaderButton={true}
                  />
                </div>
                {/* Línea divisoria después del botón de título */}
                <div className="h-px bg-white/20 my-2"></div>
              </div>
            )}
            
            {/* Línea divisoria después del botón header (para otros niveles) */}
            {sidebarLevel !== 'main' && sidebarLevel !== 'project' && sidebarLevel !== 'organization' && (
              <div className="h-px bg-white/20 my-2"></div>
            )}
            
            {/* Renderizar contenido según el nivel actual */}
            {getCurrentSidebarItems().map((item, index) => {
              // Si es un divisor, renderizar línea divisoria
              if ('type' in item && item.type === 'divider') {
                return (
                  <div key={`divider-${index}`} className="h-px bg-white/20 my-2"></div>
                );
              }
              const itemKey = 'id' in item ? item.id : ('label' in item ? item.label : `item-${index}`);
              const isActive = 'isActive' in item ? item.isActive : ('href' in item && location === item.href);
              const hasRestriction = 'generalModeRestricted' in item && item.generalModeRestricted;
              const isDashboard = 'id' in item && item.id === 'dashboard';
              const hasSubmenu = 'submenu' in item && item.submenu;
              
              // Verificar que tengamos icon y label antes de renderizar
              if (!('icon' in item) || !('label' in item) || !item.icon || !item.label) {
                return null;
              }
              
              // Determinar el tipo de chevron que necesita este botón
              const isAccordionExpanded = hasSubmenu && expandedAccordion === ('id' in item ? item.id : null);
              const navigatesToOtherSection = ('defaultRoute' in item && 'id' in item && !hasSubmenu); // Solo secciones principales que no son acordeón
              const needsChevronRight = navigatesToOtherSection;
              const needsAccordionChevron = hasSubmenu;
              const buttonElement = (
                <SidebarButton
                  icon={<item.icon className="w-[18px] h-[18px]" />}
                  label={item.label}
                  isActive={isActive || false}
                  isExpanded={isExpanded}
                  onClick={() => {
                    if ('defaultRoute' in item && 'id' in item) {
                      if (hasSubmenu) {
                        if (item.id) {
                          handleSubSectionClick(item.id, item.defaultRoute);
                        }
                      } else {
                        if (item.id) {
                          handleMainSectionClick(item.id, item.defaultRoute);
                        }
                      }
                    } else if ('href' in item) {
                      navigate(item.href);
                    }
                  }}
                  href={'href' in item ? item.href : undefined}
                  variant="main"
                  rightIcon={
                    isExpanded ? (
                      needsChevronRight ? <ChevronRight className="w-3 h-3" /> :
                      needsAccordionChevron ? (
                        isAccordionExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : undefined
                    ) : undefined
                  }
                />
              );
              return (
                <div key={`${itemKey}-${index}`}>
                  <div className="mb-[2px]">
                    {hasRestriction ? (
                      <PlanRestricted reason="general_mode" functionName={item.label}>
                        {buttonElement}
                      </PlanRestricted>
                    ) : (
                      buttonElement
                    )}
                  </div>
                  
                  {/* Mostrar submenu si está expandido */}
                  {hasSubmenu && isExpanded && expandedAccordion === ('id' in item ? item.id : null) && (
                    <div className="ml-4 mt-[2px] space-y-[1px]">
                      {item.submenu.map((subItem, subIndex) => (
                        <div key={subIndex}>
                          {('generalModeRestricted' in subItem && subItem.generalModeRestricted) ? (
                            <PlanRestricted reason="general_mode" functionName={subItem.label}>
                              <SidebarButton
                                icon={<subItem.icon className="w-[16px] h-[16px]" />}
                                label={subItem.label}
                                href={subItem.href}
                                isActive={location === subItem.href}
                                isExpanded={isExpanded}
                                variant="secondary"
                              />
                            </PlanRestricted>
                          ) : (
                            <SidebarButton
                              icon={<subItem.icon className="w-[16px] h-[16px]" />}
                              label={subItem.label}
                              href={subItem.href}
                              isActive={location === subItem.href}
                              isExpanded={isExpanded}
                              variant="secondary"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Línea divisoria después de Dashboard */}
                  {isDashboard && sidebarLevel === 'main' && (
                    <div className="h-px bg-white/20 my-2"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Bottom Section - Fixed Buttons */}
      <div className="p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Plan Badge - solo en nivel organization */}
          {sidebarLevel === 'organization' && (
            <div className="mb-2">
              <PlanBadge isExpanded={isExpanded} />
            </div>
          )}
          {/* Divisor */}
          <div className="h-px bg-white/20 mb-2"></div>
          
          {/* Settings buttons */}
          <div className="flex flex-col gap-[2px] mb-[2px]">
            {/* Dock/Undock button */}
            <SidebarButton
              icon={isDocked ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
              label={isDocked ? "Desanclar Sidebar" : "Anclar Sidebar"}
              isActive={false}
              isExpanded={isExpanded}
              onClick={handleDockToggle}
              variant="main"
            />
            
            {/* Theme toggle button */}
            <SidebarButton
              icon={isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              label={isDark ? "Modo Claro" : "Modo Oscuro"}
              isActive={false}
              isExpanded={isExpanded}
              onClick={handleThemeToggle}
              variant="main"
            />
          </div>
          
          {/* Profile */}
          <div className="mb-[2px]">
            <SidebarButton
              icon={<UserCircle className="w-[18px] h-[18px]" />}
              label="Mi Perfil"
              href="/profile"
              isActive={location.startsWith('/profile')}
              isExpanded={isExpanded}
              avatarUrl={userData?.user?.avatar_url}
              userFullName={userData?.user?.full_name}
              variant="main"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
