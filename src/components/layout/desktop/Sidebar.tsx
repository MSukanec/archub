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
  Handshake
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import SidebarButton from "./SidebarButton";
import CustomRestricted from "@/components/ui-custom/misc/CustomRestricted";

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
  
  const isExpanded = isDocked || isHovered;

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
    // Si ya está activa la sección, cerrar
    if (activeSidebarSection === sectionId) {
      setActiveSidebarSection(null);
    } else {
      // Abrir nueva sección y navegar si es necesario
      setActiveSidebarSection(sectionId);
      if (location !== defaultRoute) {
        navigate(defaultRoute);
      }
    }
  };

  // Botones principales del sidebar - solo estos se muestran
  const mainSidebarItems = [
    { 
      id: 'organizacion', 
      icon: Users, 
      label: 'Organización', 
      defaultRoute: '/organization/dashboard',
      isActive: activeSidebarSection === 'organizacion' || location.startsWith('/organization')
    },
    { 
      id: 'datos-basicos', 
      icon: Database, 
      label: 'Datos Básicos', 
      defaultRoute: '/project/basic-data',
      isActive: activeSidebarSection === 'datos-basicos' || location.startsWith('/project/basic-data')
    },
    { 
      id: 'diseno', 
      icon: FolderOpen, 
      label: 'Diseño', 
      defaultRoute: '/design/dashboard',
      isActive: activeSidebarSection === 'diseno' || location.startsWith('/design')
    },
    { 
      id: 'obra', 
      icon: Building, 
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
        "fixed top-9 left-0 h-[calc(100vh-36px)] border-r bg-[var(--menues-bg)] border-[var(--menues-border)] transition-all duration-300 z-40 flex flex-col",
        isExpanded ? "w-[240px]" : "w-[40px]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Navigation Items */}
      <div className="flex-1 p-1">
        <div className="flex flex-col gap-[2px] h-full">
          <div className={`flex-1 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {/* Context Title */}
            {sidebarContextTitles[currentSidebarContext] && isExpanded && (
              <div className="px-3 py-1 mb-1">
                <span className="text-sm text-[var(--menues-fg)] opacity-60">
                  {sidebarContextTitles[currentSidebarContext]}
                </span>
              </div>
            )}
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
                      rightIcon={isExpanded && <ChevronRight className="w-4 h-4" />}
                    />
                  </CustomRestricted>
                ) : (
                  <SidebarButton
                    icon={<item.icon className="w-[18px] h-[18px]" />}
                    label={item.label}
                    isActive={item.isActive}
                    isExpanded={isExpanded}
                    onClick={() => handleMainSectionClick(item.id, item.defaultRoute)}
                    rightIcon={isExpanded && <ChevronRight className="w-4 h-4" />}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Section - Above Divider */}
      <div className="p-1">
        <div className="flex justify-center w-full">
          <div className={cn(
            "transition-all duration-150 ease-out",
            isExpanded ? "w-full" : "w-8 h-8"
          )}>
            {isExpanded ? (
              <div className={cn(
                "w-full border-2 rounded-lg p-3 transition-all duration-150 ease-out",
                (!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "border-[var(--accent)]",
                userData?.plan?.name?.toLowerCase() === 'pro' && "border-blue-500",
                userData?.plan?.name?.toLowerCase() === 'teams' && "border-purple-500"
              )}>
                <div className="flex items-center gap-2 mb-2 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.05s_forwards]">
                  <div className="w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all duration-150">
                    {(!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && <Star className={cn("w-3 h-3 text-[var(--accent)]")} />}
                    {userData?.plan?.name?.toLowerCase() === 'pro' && <Crown className="w-3 h-3 text-blue-500" />}
                    {userData?.plan?.name?.toLowerCase() === 'teams' && <Zap className="w-3 h-3 text-purple-500" />}
                  </div>
                  <span className="text-xs font-medium text-gray-600">Plan actual:</span>
                </div>
                <div className="mb-2 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.1s_forwards]">
                  <span className={cn(
                    "text-sm font-semibold capitalize",
                    (!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "text-[var(--accent)]",
                    userData?.plan?.name?.toLowerCase() === 'pro' && "text-blue-600",
                    userData?.plan?.name?.toLowerCase() === 'teams' && "text-purple-600"
                  )}>
                    {userData?.plan?.name || 'Free'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.15s_forwards]">
                  {(!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "Actualiza para obtener las últimas y exclusivas funcionalidades"}
                  {userData?.plan?.name?.toLowerCase() === 'pro' && "Todas las funcionalidades profesionales"}
                  {userData?.plan?.name?.toLowerCase() === 'teams' && "Máximo rendimiento para equipos"}
                </p>
                {(!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && (
                  <button className={cn(
                    "w-full py-2 px-3 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]",
                    "bg-[var(--accent)] hover:bg-[var(--accent)]/80"
                  )}>
                    <Zap className="w-3 h-3" />
                    Actualizar a Pro
                  </button>
                )}
                {userData?.plan?.name?.toLowerCase() === 'pro' && (
                  <button className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]">
                    <Crown className="w-3 h-3" />
                    Actualizar a Teams
                  </button>
                )}
                {userData?.plan?.name?.toLowerCase() === 'teams' && (
                  <button className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-1 transition-all duration-150 opacity-0 animate-[fadeInUp_0.2s_ease-out_0.2s_forwards]">
                    <Zap className="w-3 h-3" />
                    Plan Premium
                  </button>
                )}
              </div>
            ) : (
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-150 ease-out hover:scale-105",
                (!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && "border-[var(--accent)]",
                userData?.plan?.name?.toLowerCase() === 'pro' && "border-blue-500",
                userData?.plan?.name?.toLowerCase() === 'teams' && "border-purple-500"
              )}>
                {(!userData?.plan || userData.plan.name?.toLowerCase() === 'free') && <Star className="w-4 h-4 text-[var(--accent)] transition-all duration-150" />}
                {userData?.plan?.name?.toLowerCase() === 'pro' && <Crown className="w-4 h-4 text-blue-500 transition-all duration-150" />}
                {userData?.plan?.name?.toLowerCase() === 'teams' && <Zap className="w-4 h-4 text-purple-500 transition-all duration-150" />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Fixed Buttons */}
      <div className="border-t border-[var(--menues-border)] p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Changelog */}
          <SidebarButton
            icon={<History className="w-[18px] h-[18px]" />}
            label="Changelog"
            isActive={location === '/changelog'}
            isExpanded={isExpanded}
            onClick={() => navigate('/changelog')}
          />

          {/* Profile */}
          <SidebarButton
            icon={<UserCircle className="w-[18px] h-[18px]" />}
            label="Mi Perfil"
            isActive={location === '/profile'}
            isExpanded={isExpanded}
            onClick={() => navigate('/profile')}
            avatarUrl={userData?.user?.avatar_url}
          />
        </div>
      </div>
    </aside>
  );
}