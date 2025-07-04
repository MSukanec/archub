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
  Layout
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
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
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

  // Different navigation items based on context
  const sidebarContexts = {
    organization: [
      { icon: Home, label: 'Resumen de la Organización', href: '/organization/dashboard' },
      { icon: ArrowRight, label: 'Ir al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
      { type: 'divider' },
      { icon: FolderOpen, label: 'Proyectos', href: '/organization/projects' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: CheckSquare, label: 'Tareas', href: '/tasks' },
    ],
    project: [
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Organización', href: '#', onClick: () => { setSidebarContext('organization'); navigate('/organization/dashboard'); } },
      { type: 'divider' },
      { icon: FolderOpen, label: 'Diseño', href: '#', onClick: () => { setSidebarContext('design'); navigate('/design/dashboard'); }, rightIcon: ChevronRight },
      { icon: Building, label: 'Obra', href: '#', onClick: () => { setSidebarContext('construction'); navigate('/construction/dashboard'); }, rightIcon: ChevronRight },
      { icon: DollarSign, label: 'Finanzas', href: '#', onClick: () => { setSidebarContext('finances'); navigate('/finances/dashboard'); }, rightIcon: ChevronRight },
      { icon: Users, label: 'Comercialización', href: '#', onClick: () => { setSidebarContext('commercialization'); navigate('/commercialization/dashboard'); }, rightIcon: ChevronRight, restricted: true },
    ],
    design: [
      { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
      { type: 'divider' },
      { icon: FileText, label: 'Documentación', href: '/design/documentation' },
      { icon: Database, label: 'Datos', href: '/design/data', restricted: true },
      { icon: Calendar, label: 'Cronograma', href: '/design/timeline', restricted: true },
      { icon: Layout, label: 'Tablero', href: '/design/board', restricted: true },
      { icon: Calculator, label: 'Cómputo', href: '/design/compute', restricted: true },
      { icon: Settings, label: 'Preferencias de Diseño', href: '/design/preferences', restricted: true },
    ],
    construction: [
      { icon: Home, label: 'Resumen de Obra', href: '/construction/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
      { type: 'divider' },
      { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
      { icon: Package, label: 'Materiales', href: '/construction/materials' },
      { icon: FileText, label: 'Bitácora', href: '/construction/logs' },
      { icon: Users, label: 'Personal', href: '/construction/personnel' },
      { icon: Images, label: 'Galería', href: '/construction/gallery' },
    ],
    finances: [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
      { type: 'divider' },
      { icon: DollarSign, label: 'Movimientos', href: '/finances/movements' },
      { icon: Settings, label: 'Preferencias de Finanzas', href: '/finances/preferences' },
    ],
    commercialization: [
      { icon: Home, label: 'Resumen de Comercialización', href: '/commercialization/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
      { type: 'divider' },
      { icon: Building, label: 'Listado de unidades', href: '/commercialization/unidades' },
      { icon: Users, label: 'Clientes interesados', href: '/commercialization/clientes' },
      { icon: FileText, label: 'Estadísticas de venta', href: '/commercialization/estadisticas' },
    ],
    admin: [
      { icon: Home, label: 'Resumen de Administración', href: '/admin/dashboard' },
      { type: 'divider' },
      { 
        icon: Users, 
        label: 'Comunidad', 
        isAccordion: true, 
        expanded: expandedAccordion === 'admin-comunidad',
        onToggle: () => toggleAccordion('admin-comunidad'),
        children: [
          { icon: Building, label: 'Organizaciones', href: '/admin/organizations' },
          { icon: Users, label: 'Usuarios', href: '/admin/users' },
          { icon: FileText, label: 'Changelog', href: '/admin/changelogs' }
        ]
      },
      { 
        icon: CheckSquare, 
        label: 'Tareas', 
        isAccordion: true, 
        expanded: expandedAccordion === 'admin-tareas',
        onToggle: () => toggleAccordion('admin-tareas'),
        children: [
          { icon: CheckSquare, label: 'Tareas', href: '/admin/tasks' },
          { icon: Zap, label: 'Tareas Generadas', href: '/admin/generated-tasks' },
          { icon: Settings, label: 'Parámetros', href: '/admin/task-parameters' },
          { icon: FileCode, label: 'Categorías de Tareas', href: '/admin/task-categories-templates' }
        ]
      },
      { 
        icon: Package, 
        label: 'Materiales', 
        isAccordion: true, 
        expanded: expandedAccordion === 'admin-materiales',
        onToggle: () => toggleAccordion('admin-materiales'),
        children: [
          { icon: Package, label: 'Materiales', href: '/admin/materials' },
          { icon: Tag, label: 'Categorías de Materiales', href: '/admin/material-categories' }
        ]
      }
    ]
  };

  const navigationItems = sidebarContexts[currentSidebarContext] || sidebarContexts.organization;



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
            {navigationItems.map((item: any, index: number) => (
              <div key={`${item.label || 'divider'}-${index}`} className="mb-[2px]">
                {/* Divider */}
                {item.type === 'divider' ? (
                  <div className="mx-2 my-1 border-t border-[var(--menues-border)]" />
                ) : (
                  <div>
                    {/* Main Button with potential restriction */}
                    {item.restricted ? (
                      <CustomRestricted reason="coming_soon">
                        <SidebarButton
                          icon={<item.icon className="w-[18px] h-[18px]" />}
                          label={item.label}
                          isActive={location === item.href}
                          isExpanded={isExpanded}
                          onClick={item.isAccordion ? item.onToggle : (item.onClick || (() => navigate(item.href)))}
                          rightIcon={item.isAccordion && isExpanded ? (
                            item.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                          ) : item.rightIcon && isExpanded ? (
                            <item.rightIcon className="w-4 h-4" />
                          ) : undefined}
                        />
                      </CustomRestricted>
                    ) : (
                      <SidebarButton
                        icon={<item.icon className="w-[18px] h-[18px]" />}
                        label={item.label}
                        isActive={location === item.href}
                        isExpanded={isExpanded}
                        onClick={item.isAccordion ? item.onToggle : (item.onClick || (() => navigate(item.href)))}
                        rightIcon={item.isAccordion && isExpanded ? (
                          item.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                        ) : item.rightIcon && isExpanded ? (
                          <item.rightIcon className="w-4 h-4" />
                        ) : undefined}
                      />
                    )}
                
                    {/* Accordion Children */}
                    {item.isAccordion && item.expanded && isExpanded && (
                      <div className="ml-6 mt-1 flex flex-col gap-[2px]">
                        {item.children?.map((child: any, childIndex: number) => (
                          <SidebarButton
                            key={`${child.label}-${childIndex}`}
                            icon={<child.icon className="w-[18px] h-[18px]" />}
                            label={child.label}
                            isActive={location === child.href}
                            isExpanded={isExpanded}
                            onClick={() => navigate(child.href)}
                            isChild={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
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
          {/* Administration - Only for Admin Users */}
          {isAdmin && (
            <SidebarButton
              icon={<Shield className="w-[18px] h-[18px]" />}
              label="Administración"
              isActive={currentSidebarContext === 'admin'}
              isExpanded={isExpanded}
              onClick={() => {
                setSidebarContext('admin');
                navigate('/admin/dashboard');
              }}
            />
          )}



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
            isActive={location === '/perfil'}
            isExpanded={isExpanded}
            onClick={() => navigate('/perfil')}
            avatarUrl={userData?.user?.avatar_url}
          />
        </div>
      </div>
    </aside>
  );
}