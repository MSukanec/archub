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
  ArrowLeft,
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
  FileCode
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import SidebarButton from "./SidebarButton";

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
  
  // Estado para acordeones con persistencia
  const [expandedAccordions, setExpandedAccordions] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem('sidebar-accordions');
    return saved ? JSON.parse(saved) : { obra: false, finanzas: false };
  });

  // Guardar estado de acordeones en localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-accordions', JSON.stringify(expandedAccordions));
  }, [expandedAccordions]);

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevContextRef = useRef(currentSidebarContext);
  
  const isExpanded = isDocked || isHovered;

  // Handle fade animation when context changes
  useEffect(() => {
    if (prevContextRef.current !== currentSidebarContext) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        prevContextRef.current = currentSidebarContext;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentSidebarContext]);
  
  // Project selector removed as requested
  
  const toggleAccordion = (key: string) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  // Different navigation items based on context
  const sidebarContexts = {
    organization: [
      { icon: Home, label: 'Resumen de la Organización', href: '/organization/dashboard' },
      { icon: FolderOpen, label: 'Proyectos', href: '/proyectos' },
      { icon: Mail, label: 'Contactos', href: '/organization/contactos' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Settings, label: 'Preferencias', href: '/preferencias' },
      { icon: Building, label: 'Gestión de Organizaciones', href: '#', onClick: () => { setSidebarContext('organizations'); navigate('/organizations'); } },
    ],
    organizations: [
      // Minimal sidebar - only bottom section buttons
    ],
    project: [
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard' },
      { icon: FolderOpen, label: 'Diseño', href: '#', onClick: () => { setSidebarContext('design'); navigate('/design/dashboard'); } },
      { 
        icon: Building, 
        label: 'Obra', 
        href: '#', 
        isAccordion: true,
        expanded: expandedAccordions.obra,
        onToggle: () => toggleAccordion('obra'),
        children: [
          { icon: Home, label: 'Resumen de Obra', href: '/construction/dashboard' },
          { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
          { icon: Package, label: 'Materiales', href: '/construction/materials' },
          { icon: FileText, label: 'Bitácora', href: '/construction/logs' },
          { icon: Users, label: 'Personal', href: '/construction/personnel' }
        ]
      },
      { 
        icon: DollarSign, 
        label: 'Finanzas', 
        href: '#', 
        isAccordion: true,
        expanded: expandedAccordions.finanzas,
        onToggle: () => toggleAccordion('finanzas'),
        children: [
          { icon: Home, label: 'Resumen de Finanzas', href: '/finance/dashboard' },
          { icon: DollarSign, label: 'Movimientos', href: '/movimientos' }
        ]
      },
      { icon: Users, label: 'Comercialización', href: '#', onClick: () => { setSidebarContext('commercialization'); navigate('/commercialization/dashboard'); } },
      { icon: ArrowLeft, label: 'Volver a Organización', href: '#', onClick: () => { setSidebarContext('organization'); navigate('/organization/dashboard'); } },
    ],
    design: [
      { icon: Home, label: 'Dashboard', href: '/design/dashboard' },
      { icon: FileText, label: 'Moodboard', href: '/design/moodboard' },
      { icon: FolderOpen, label: 'Documentación técnica', href: '/design/documentacion' },
      { icon: ArrowLeft, label: 'Volver al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
    ],
    construction: [
      { icon: Home, label: 'Resumen', href: '/construction/dashboard' },
      { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
      { icon: FileText, label: 'Bitácora', href: '/bitacora' },
      { icon: ArrowLeft, label: 'Volver al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
    ],

    commercialization: [
      { icon: Home, label: 'Dashboard', href: '/commercialization/dashboard' },
      { icon: Building, label: 'Listado de unidades', href: '/commercialization/unidades' },
      { icon: Users, label: 'Clientes interesados', href: '/commercialization/clientes' },
      { icon: FileText, label: 'Estadísticas de venta', href: '/commercialization/estadisticas' },
      { icon: ArrowLeft, label: 'Volver al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
    ],
    admin: [
      { icon: Home, label: 'Resumen de Administración', href: '/admin/dashboard' },
      { 
        icon: Users, 
        label: 'Comunidad', 
        isAccordion: true, 
        expanded: expandedAccordions['admin-comunidad'] || false,
        onToggle: () => toggleAccordion('admin-comunidad'),
        children: [
          { icon: Building, label: 'Organizaciones', href: '/admin/organizations' },
          { icon: Users, label: 'Usuarios', href: '/admin/users' }
        ]
      },
      { 
        icon: CheckSquare, 
        label: 'Tareas', 
        isAccordion: true, 
        expanded: expandedAccordions['admin-tareas'] || false,
        onToggle: () => toggleAccordion('admin-tareas'),
        children: [
          { icon: CheckSquare, label: 'Tareas', href: '/admin/tasks' },
          { icon: Zap, label: 'Tareas Generadas', href: '/admin/generated-tasks' },
          { icon: FileCode, label: 'Plantillas de Tareas', href: '/admin/task-templates' }
        ]
      },
      { 
        icon: Package, 
        label: 'Materiales', 
        isAccordion: true, 
        expanded: expandedAccordions['admin-materiales'] || false,
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
            {navigationItems.map((item: any, index) => (
              <div key={`${item.label}-${index}`} className="mb-[2px]">
                {/* Main Button */}
                <SidebarButton
                  icon={<item.icon className="w-[18px] h-[18px]" />}
                  label={item.label}
                  isActive={location === item.href}
                  isExpanded={isExpanded}
                  onClick={item.isAccordion ? item.onToggle : (item.onClick || (() => navigate(item.href)))}
                  rightIcon={item.isAccordion && isExpanded ? (
                    item.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                  ) : undefined}
                />
                
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