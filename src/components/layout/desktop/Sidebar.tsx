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
  TrendingUp
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import SidebarButton from "./SidebarButton";
import CustomRestricted from "@/components/ui-custom/CustomRestricted";
import Plan from "@/components/ui-custom/Plan";
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
  const { currentSidebarContext, setSidebarContext, activeSidebarSection, setActiveSidebarSection } = useNavigationStore();
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
    if (location.startsWith('/admin')) return 'administracion';

    if (location === '/dashboard') return 'organizacion';
    return null;
  };

  // Función para manejar clicks en botones principales - ahora tipo acordeón
  const handleMainSectionClick = (sectionId: string, defaultRoute: string) => {
    // Toggle acordeón: si ya está expandido, colapsar; si no, expandir
    setExpandedAccordion(prev => prev === sectionId ? null : sectionId);
    // NO cambiar activeSidebarSection aquí - debe basarse en la ruta actual
  };

  // Definir contenido de submenu para cada sección (copiado de SidebarSubmenu)
  const submenuContent = {
    'organizacion': [
      { icon: Home, label: 'Resumen de Organización', href: '/dashboard' },
      { icon: Folder, label: 'Proyectos', href: '/organization/projects' },
      { icon: Settings, label: 'Preferencias', href: '/organization/preferences' },
    ],
    'diseno': [
      { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard', requiresProject: true },
    ],
    'construccion': [
      { icon: Home, label: 'Resumen de Construcción', href: '/construction/dashboard', requiresProject: true },
      { icon: CheckSquare, label: 'Tareas', href: '/construction/tasks', requiresProject: true },
      { icon: Users, label: 'Personal', href: '/construction/personnel', requiresProject: true },
      { icon: Package, label: 'Subcontratos', href: '/construction/subcontracts', requiresProject: true },
      { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets', requiresProject: true },
      { icon: Package2, label: 'Materiales', href: '/construction/materials', requiresProject: true },
      { icon: FileText, label: 'Bitácora', href: '/construction/logs', requiresProject: true },
    ],
    'finanzas': [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard', requiresProject: true },
      { icon: DollarSign, label: 'Movimientos', href: '/finances/movements', requiresProject: true },
      { icon: BarChart3, label: 'Análisis de Obra', href: '/finances/analysis', generalModeRestricted: true },
      { icon: HandCoins, label: 'Aportes de Terceros', href: '/finances/installments', generalModeRestricted: true },
      { icon: TrendingUp, label: 'Movimientos de Capital', href: '/finances/capital-movements', generalModeRestricted: true },
      { icon: Users, label: 'Clientes', href: '/finances/clients', requiresProject: true },
    ],
    'recursos': [
      { icon: FileText, label: 'Documentación', href: '/recursos/documentacion' },
      { icon: Images, label: 'Galería', href: '/recursos/galeria' },
      { icon: Contact, label: 'Contactos', href: '/recursos/contactos' },
      { icon: CheckSquare, label: 'Tablero', href: '/recursos/board' },
      { icon: BarChart3, label: 'Análisis de Costos', href: '/recursos/cost-analysis' },
    ],
  };

  // Botones principales del sidebar - ahora con sistema de acordeón
  const mainSidebarItems = [
    { 
      id: 'organizacion', 
      icon: Building, 
      label: 'Organización', 
      defaultRoute: '/organization',
      isActive: (location.startsWith('/organization') && !location.startsWith('/organization/board')) || location === '/dashboard'
    },
    { 
      id: 'diseno', 
      icon: Brush, 
      label: 'Diseño', 
      defaultRoute: '/design/dashboard',
      isActive: location.startsWith('/design'),
      generalModeRestricted: true
    },
    { 
      id: 'construccion', 
      icon: HardHat, 
      label: 'Construcción', 
      defaultRoute: '/construction/dashboard',
      isActive: location.startsWith('/construction')
    },
    { 
      id: 'finanzas', 
      icon: DollarSign, 
      label: 'Finanzas', 
      defaultRoute: '/finances/dashboard',
      isActive: location.startsWith('/finances')
    },
    { 
      id: 'recursos', 
      icon: BookOpen, 
      label: 'Recursos', 
      defaultRoute: '/recursos/documentacion',
      isActive: location.startsWith('/recursos')
    },
  ];



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
        // Cuando se hace hover, expandir la sección activa basada en la ubicación actual
        const activeSection = getActiveSectionFromLocation();
        if (activeSection && submenuContent[activeSection as keyof typeof submenuContent]) {
          setExpandedAccordion(activeSection);
        }
      }}
      onMouseLeave={() => {
        setHovered(false);
        // Al salir del hover, mantener el estado de acordeón como estaba
      }}
    >
      {/* Logo Section */}
      <div className="h-9 flex items-center justify-center bg-[var(--main-sidebar-bg)]">
        <div className="text-lg font-bold text-[var(--main-sidebar-fg)]">A</div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-1 pt-3">
        <div className="flex flex-col gap-[2px] h-full">
          <div className={`flex-1 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {/* Context Title - Removed since sidebar doesn't expand */}
            {mainSidebarItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="mb-[2px]">
                {/* Main Button with potential restriction */}
                {item.generalModeRestricted ? (
                  <CustomRestricted reason="general_mode" functionName={item.label}>
                    <SidebarButton
                      icon={<item.icon className="w-[18px] h-[18px]" />}
                      label={item.label}
                      isActive={item.isActive}
                      isExpanded={isExpanded}
                      onClick={() => handleMainSectionClick(item.id, item.defaultRoute)}
                      variant="main"
                    />
                  </CustomRestricted>
                ) : (
                  <SidebarButton
                    icon={<item.icon className="w-[18px] h-[18px]" />}
                    label={item.label}
                    isActive={item.isActive}
                    isExpanded={isExpanded}
                    onClick={() => handleMainSectionClick(item.id, item.defaultRoute)}
                    variant="main"
                  />
                )}
                
                {/* Mostrar subelementos si está expandido y el sidebar está expandido */}
                {isExpanded && expandedAccordion === item.id && submenuContent[item.id as keyof typeof submenuContent] && (
                  <div className="ml-4 mt-[2px] space-y-[1px]">
                    {submenuContent[item.id as keyof typeof submenuContent].map((subItem, subIndex) => (
                      <SidebarButton
                        key={subIndex}
                        icon={<subItem.icon className="w-[16px] h-[16px]" />}
                        label={subItem.label}
                        href={subItem.href}
                        isActive={location === subItem.href}
                        isExpanded={isExpanded}
                        variant="secondary"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Fixed Buttons */}
      <div className="p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Admin button (above Profile) */}
          {isAdmin && (
            <div className="mb-[2px]">
              <SidebarButton
                icon={<Crown className="w-[18px] h-[18px]" />}
                label="Administración"
                isActive={location.startsWith('/admin')}
                isExpanded={isExpanded}
                onClick={() => handleMainSectionClick('administracion', '/admin/dashboard')}
                variant="main"
              />
              
              {/* Mostrar subelementos de administración si está expandido */}
              {isExpanded && expandedAccordion === 'administracion' && (
                <div className="ml-4 mt-[2px] space-y-[1px]">
                  <SidebarButton
                    icon={<Home className="w-[16px] h-[16px]" />}
                    label="Resumen de Administración"
                    href="/admin/dashboard"
                    isActive={location === '/admin/dashboard'}
                    isExpanded={isExpanded}
                    variant="secondary"
                  />
                  <SidebarButton
                    icon={<Building className="w-[16px] h-[16px]" />}
                    label="Organizaciones"
                    href="/admin/organizations"
                    isActive={location === '/admin/organizations'}
                    isExpanded={isExpanded}
                    variant="secondary"
                  />
                  <SidebarButton
                    icon={<Users className="w-[16px] h-[16px]" />}
                    label="Usuarios"
                    href="/admin/users"
                    isActive={location === '/admin/users'}
                    isExpanded={isExpanded}
                    variant="secondary"
                  />
                </div>
              )}
            </div>
          )}
          
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