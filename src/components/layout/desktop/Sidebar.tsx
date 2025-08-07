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
  FileImage
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
    const currentTheme = userData?.preferences?.theme || 'light';
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
  
  const isExpanded = false; // Always collapsed - only icons

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

  // Función para manejar clicks en botones principales
  const handleMainSectionClick = (sectionId: string, defaultRoute: string) => {
    // Siempre establecer la sección activa y navegar
    setActiveSidebarSection(sectionId);
    if (location !== defaultRoute) {
      navigate(defaultRoute);
    }
  };

  // Botones principales del sidebar - solo estos se muestran
  const mainSidebarItems = [
    { 
      id: 'organizacion', 
      icon: Building, 
      label: 'Organización', 
      defaultRoute: '/organization/dashboard',
      isActive: activeSidebarSection === 'organizacion' || location.startsWith('/organization') || location === '/dashboard'
    },
    { 
      id: 'proyecto', 
      icon: FolderOpen, 
      label: 'Proyecto', 
      defaultRoute: '/project/dashboard',
      isActive: activeSidebarSection === 'proyecto' || location.startsWith('/project'),
      generalModeRestricted: true
    },
    { 
      id: 'diseno', 
      icon: Brush, 
      label: 'Diseño', 
      defaultRoute: '/design/dashboard',
      isActive: activeSidebarSection === 'diseno' || location.startsWith('/design'),
      generalModeRestricted: true
    },
    { 
      id: 'construccion', 
      icon: HardHat, 
      label: 'Construcción', 
      defaultRoute: '/construction/dashboard',
      isActive: activeSidebarSection === 'construccion' || location.startsWith('/construction')
    },
    { 
      id: 'finanzas', 
      icon: DollarSign, 
      label: 'Finanzas', 
      defaultRoute: '/finances/dashboard',
      isActive: activeSidebarSection === 'finanzas' || location.startsWith('/finances')
    },
    // Administración movida al footer
  ];



  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 h-screen border-r bg-[var(--main-sidebar-bg)] border-[var(--main-sidebar-border)] transition-all duration-300 z-50 flex flex-col",
        "w-[40px]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo Section */}
      </div>

      {/* Navigation Items */}
          <div className={`flex-1 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {/* Context Title - Removed since sidebar doesn't expand */}
            {mainSidebarItems.map((item, index) => (
                {/* Main Button with potential restriction */}
                {item.generalModeRestricted ? (
                  <CustomRestricted reason="general_mode" functionName={item.label}>
                    <SidebarButton
                      label={item.label}
                      isActive={item.isActive}
                      isExpanded={isExpanded}
                      onClick={() => handleMainSectionClick(item.id, item.defaultRoute)}
                      variant="main"
                    />
                  </CustomRestricted>
                ) : (
                  <SidebarButton
                    label={item.label}
                    isActive={item.isActive}
                    isExpanded={isExpanded}
                    onClick={() => handleMainSectionClick(item.id, item.defaultRoute)}
                    variant="main"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Fixed Buttons */}
          {/* Admin button (above Profile) */}
          {isAdmin && (
            <SidebarButton
              label="Administración"
              isActive={activeSidebarSection === 'administracion' || location.startsWith('/admin')}
              isExpanded={isExpanded}
              onClick={() => handleMainSectionClick('administracion', '/admin/dashboard')}
              variant="main"
            />
          )}
          
          {/* Settings buttons */}
            {/* Dock/Undock button */}
            <SidebarButton
              label={isDocked ? "Desanclar Sidebar" : "Anclar Sidebar"}
              isActive={false}
              isExpanded={isExpanded}
              onClick={handleDockToggle}
              variant="main"
            />
            
            {/* Theme toggle button */}
            <SidebarButton
              label={isDark ? "Modo Claro" : "Modo Oscuro"}
              isActive={false}
              isExpanded={isExpanded}
              onClick={handleThemeToggle}
              variant="main"
            />
          </div>
          
          {/* Profile */}
          <SidebarButton
            label="Mi Perfil"
            isActive={activeSidebarSection === 'perfil' || location.startsWith('/profile')}
            isExpanded={isExpanded}
            onClick={() => handleMainSectionClick('perfil', '/profile/data')}
            avatarUrl={userData?.user?.avatar_url}
            userFullName={userData?.user?.full_name}
            variant="main"
          />
        </div>
      </div>
    </aside>
  );
}