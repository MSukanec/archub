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
import { useProjects } from "@/hooks/use-projects";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import SidebarButton from "./SidebarButton";
import PlanRestricted from "@/components/ui-custom/security/PlanRestricted";
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
  
  // Preparar items para el selector
  const selectorItems = projects.map((project: any) => ({
    id: project.id,
    name: project.name,
    logo_url: project.logo_url,
    type: "Proyecto" as const,
    color: project.color
  }));

  return (
    <SelectorPopover
      trigger={
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
            projectColor={currentProject?.color || undefined}
            rightIcon={isExpanded ? <ChevronDown className="w-3 h-3" /> : undefined}
          />
        </div>
      }
      items={selectorItems}
      selectedId={selectedProjectId}
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
  
  const handleOrganizationSelect = (organizationId: string) => {
    if (currentOrganization?.id === organizationId) return;
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
      }
      items={selectorItems}
      selectedId={currentOrganization?.id}
      onSelect={handleOrganizationSelect}
      emptyMessage="No hay organizaciones disponibles"
      getInitials={getOrganizationInitials}
    />
  );
}
export function SecondarySidebar() {
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
      } else if (location.startsWith('/project/') || location.startsWith('/general/') || location.startsWith('/design/') || location.startsWith('/finances/')) {
        setSidebarLevel('project');
      } else if (location.startsWith('/construction/')) {
        setSidebarLevel('construction');
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
      { icon: TrendingUp, label: 'Movimientos', href: '/organization/finances/movements' },
      { icon: DollarSign, label: 'Capital', href: '/organization/finances/capital' },
      { icon: CreditCard, label: 'Gastos Generales', href: '/organization/general-costs' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Database, label: 'Datos Básicos', href: '/organization/data' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Settings, label: 'Preferencias', href: '/organization/preferences' }
    ],
    project: [
      { icon: Info, label: 'Información', href: '/general/info' },
      { icon: DollarSign, label: 'Finanzas', href: '/general/finances' },
      { icon: CheckSquare, label: 'Tablero', href: '/general/calendar' },
      { icon: Users, label: 'Clientes', href: '/general/clients' },
      { icon: FileText, label: 'Media', href: '/general/media' }
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
    if (sidebarLevel === 'project') {
      return sidebarContent.project || [];
    }
    if (sidebarLevel === 'organization') {
      return sidebarContent.organization || [];
    }
    if (sidebarLevel === 'library') {
      return sidebarContent.library || [];
    }
    if (sidebarLevel === 'provider') {
      return sidebarContent.provider || [];
    }
    if (sidebarLevel === 'construction') {
      return sidebarContent.construction || [];
    }
    if (sidebarLevel === 'admin') {
      return sidebarContent.admin || [];
    }
    
    // Para la sección de inicio, mostrar contenido contextual basado en header
    switch (activeSection) {
      case 'organizacion':
        return sidebarContent.organization || [];
      case 'proyecto':
        return sidebarContent.project || [];
      case 'construccion':
        return sidebarContent.construction || [];
      case 'biblioteca':
        return sidebarContent.library || [];
      case 'proveedor':
        return sidebarContent.provider || [];
      case 'administracion':
        return sidebarContent.admin || [];
      default:
        // Por defecto, mostrar el contenido de organización
        return sidebarContent.organization || [];
    }
  };
  return (
    <aside 
      className={cn(
        "fixed top-0 left-[40px] h-screen border-r bg-[var(--secondary-sidebar-bg)] border-[var(--secondary-sidebar-border)] transition-all duration-300 z-40 flex flex-col",
        isExpanded ? "w-64" : "w-[40px]"
      )}
      style={{
        overflow: 'hidden'
      }}
      onMouseEnter={() => {
        setHovered(true);
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
      onMouseLeave={() => setHovered(false)}
    >
      {/* Espacio superior con nombre de sección - misma altura que PageHeader */}
      <div className="h-12 flex-shrink-0 flex items-center px-4">
        {isExpanded && (
          <span className="text-sm font-black text-black uppercase">
            {sidebarLevel === 'organization' && 'ORGANIZACIÓN'}
            {sidebarLevel === 'project' && 'PROYECTO'}
            {sidebarLevel === 'construction' && 'CONSTRUCCIÓN'}
            {sidebarLevel === 'library' && 'BIBLIOTECA'}
            {sidebarLevel === 'provider' && 'PROVEEDOR'}
            {sidebarLevel === 'admin' && 'ADMINISTRACIÓN'}
          </span>
        )}
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 p-1">
        <div className="flex flex-col gap-[2px] h-full">
          <div className={`flex-1 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            
            {/* Renderizar contenido según el nivel actual */}
            {getCurrentSidebarItems().map((item, index) => {
              // Si es un divisor, renderizar línea divisoria
              if ('type' in item && item.type === 'divider') {
                return (
                  <div key={`divider-${index}`} className="h-px bg-white/20 my-2"></div>
                );
              }
              
              // Si es una sección, renderizar separador de texto
              if ('type' in item && item.type === 'section') {
                return (
                  <div key={`section-${index}`} className="px-2 py-1 mt-3 mb-1">
                    {isExpanded && (
                      <div className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                        {item.label}
                      </div>
                    )}
                  </div>
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
              const navigatesToOtherSection = ('defaultRoute' in item && 'id' in item && !hasSubmenu && !isDashboard); // Solo secciones principales que no son acordeón ni dashboard
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
                  variant="secondary"
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
    </aside>
  );
}
