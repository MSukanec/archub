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
  TableIcon
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import SidebarButton from "./SidebarButton";
import PlanRestricted from "@/components/ui-custom/security/PlanRestricted";
import { useProjectContext } from "@/stores/projectContext";

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
    if (location.startsWith('/recursos')) return 'recursos';
    if (location.startsWith('/analysis')) return 'analisis';
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
    if (['construccion', 'finanzas', 'diseno'].includes(sectionId)) {
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
        icon: HardHat,
        label: 'Proyecto',
        defaultRoute: '/construction/dashboard',
        isActive: location.startsWith('/design') || location.startsWith('/construction') || location.startsWith('/finances')
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
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Database, label: 'Datos Básicos', href: '/organization/data' },
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
      }
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
      {/* Header Section - Dinámico según el nivel */}
      <div className="h-9 flex items-center bg-[var(--main-sidebar-bg)]">
        {isExpanded ? (
          <div className="ml-3 text-lg font-bold text-[var(--main-sidebar-fg)]">
            {sidebarLevel === 'main' ? 'ARCHUB' : 
             sidebarLevel === 'organization' ? 'ORGANIZACIÓN' :
             sidebarLevel === 'project' ? 'PROYECTO' :
             sidebarLevel === 'provider' ? 'PROVEEDOR' :
             sidebarLevel === 'admin' ? 'ADMINISTRACIÓN' : 'ARCHUB'}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <div className="text-lg font-bold text-[var(--main-sidebar-fg)]">
              {sidebarLevel === 'main' ? 'A' :
               sidebarLevel === 'organization' ? 'O' :
               sidebarLevel === 'project' ? 'P' :
               sidebarLevel === 'provider' ? 'PR' :
               sidebarLevel === 'admin' ? 'AD' : 'A'}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-1 pt-3">
        <div className="flex flex-col gap-[2px] h-full">
          <div className={`flex-1 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {/* Botón Volver (solo en niveles secundarios) */}
            {sidebarLevel !== 'main' && (
              <div>
                <div className="mb-[2px]">
                  <SidebarButton
                    icon={<ArrowLeft className="w-[18px] h-[18px]" />}
                    label="Volver"
                    isActive={false}
                    isExpanded={isExpanded}
                    onClick={goToMainLevel}
                    variant="main"
                  />
                </div>
                {/* Línea divisoria después del botón Volver */}
                <div className="h-px bg-white/20 my-2"></div>
              </div>
            )}
            
            {/* Renderizar contenido según el nivel actual */}
            {getCurrentSidebarItems().map((item, index) => {
              const itemKey = 'id' in item ? item.id : item.label;
              const isActive = 'isActive' in item ? item.isActive : ('href' in item && location === item.href);
              const hasRestriction = 'generalModeRestricted' in item && item.generalModeRestricted;
              const isDashboard = 'id' in item && item.id === 'dashboard';
              const hasSubmenu = 'submenu' in item && item.submenu;
              
              const buttonElement = (
                <SidebarButton
                  icon={<item.icon className="w-[18px] h-[18px]" />}
                  label={item.label}
                  isActive={isActive || false}
                  isExpanded={isExpanded}
                  onClick={() => {
                    if ('defaultRoute' in item && 'id' in item) {
                      if (hasSubmenu) {
                        handleSubSectionClick(item.id, item.defaultRoute);
                      } else {
                        handleMainSectionClick(item.id, item.defaultRoute);
                      }
                    } else if ('href' in item) {
                      navigate(item.href);
                    }
                  }}
                  href={'href' in item ? item.href : undefined}
                  variant="main"
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