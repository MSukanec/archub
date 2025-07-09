import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";

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
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import SidebarButton from "./SidebarButton";
import CustomRestricted from "@/components/ui-custom/misc/CustomRestricted";
import Plan from "@/components/ui-custom/misc/Plan";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { isDocked, isHovered, setHovered, setDocked } = useSidebarStore();
  
  // Sync sidebar state with user preferences
  useEffect(() => {
    if (userData?.preferences?.sidebar_docked !== undefined) {
      setDocked(userData.preferences.sidebar_docked);
    }
  }, [userData?.preferences?.sidebar_docked, setDocked]);
  const { currentSidebarContext, setSidebarContext, activeSidebarSection, setActiveSidebarSection } = useNavigationStore();
  const queryClient = useQueryClient();
  
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
      isActive: activeSidebarSection === 'organizacion' || location.startsWith('/organization')
    },
    { 
      id: 'proyecto', 
      icon: FolderOpen, 
      label: 'Proyecto', 
      defaultRoute: '/project/basic-data',
      isActive: activeSidebarSection === 'proyecto' || location.startsWith('/project')
    },
    { 
      id: 'diseno', 
      icon: Brush, 
      label: 'Diseño', 
      defaultRoute: '/design/dashboard',
      isActive: activeSidebarSection === 'diseno' || location.startsWith('/design')
    },
    { 
      id: 'obra', 
      icon: HardHat, 
      label: 'Obra', 
      defaultRoute: '/construction/dashboard',
      isActive: activeSidebarSection === 'obra' || location.startsWith('/construction')
    },
    { 
      id: 'finanzas', 
      icon: DollarSign, 
      label: 'Finanzas', 
      defaultRoute: '/finances/dashboard',
      isActive: activeSidebarSection === 'finanzas' || location.startsWith('/finances')
    },
    { 
      id: 'comercializacion', 
      icon: Handshake, 
      label: 'Comercialización', 
      defaultRoute: '/commercialization/dashboard',
      isActive: activeSidebarSection === 'comercializacion' || location.startsWith('/commercialization'),
      restricted: true
    },
    { 
      id: 'post-venta', 
      icon: CreditCard, 
      label: 'Post-Venta', 
      defaultRoute: '/postsale/dashboard',
      isActive: activeSidebarSection === 'post-venta' || location.startsWith('/postsale'),
      restricted: true
    },
    // Solo mostrar administración si es admin
    ...(isAdmin ? [{
      id: 'administracion', 
      icon: Crown, 
      label: 'Administración', 
      defaultRoute: '/admin/dashboard',
      isActive: activeSidebarSection === 'administracion' || location.startsWith('/admin')
    }] : [])
  ];



  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 h-screen border-r bg-[var(--main-sidebar-bg)] border-[var(--main-sidebar-border)] transition-all duration-300 z-40 flex flex-col",
        "w-[50px]"
      )}
    >
      {/* Logo Section */}
      <div className="h-9 flex items-center justify-center border-b border-[var(--main-sidebar-border)] bg-[var(--main-sidebar-bg)]">
        <div className="text-lg font-bold text-[var(--main-sidebar-fg)]">A</div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-1">
        <div className="flex flex-col gap-[2px] h-full">
          <div className={`flex-1 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {/* Context Title - Removed since sidebar doesn't expand */}
            {mainSidebarItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="mb-[2px]">
                {/* Main Button with potential restriction */}
                {item.restricted ? (
                  <CustomRestricted reason="coming_soon">
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
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Section - Above Divider */}
      <div className="p-1">
        <Plan isExpanded={isExpanded} />
      </div>

      {/* Bottom Section - Fixed Buttons */}
      <div className="border-t border-[var(--menues-border)] p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Profile */}
          <SidebarButton
            icon={<UserCircle className="w-[18px] h-[18px]" />}
            label="Mi Perfil"
            isActive={location === '/profile'}
            isExpanded={isExpanded}
            onClick={() => navigate('/profile')}
            avatarUrl={userData?.user?.avatar_url}
            variant="main"
          />
        </div>
      </div>
    </aside>
  );
}