import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
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
  Zap
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import SidebarButton from "./SidebarButton";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isDocked, isHovered, setHovered } = useSidebarStore();
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
  const queryClient = useQueryClient();
  
  // Estado para acordeones
  const [expandedAccordions, setExpandedAccordions] = useState<{ [key: string]: boolean }>({
    obra: false,
    finanzas: false
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
  
  // Obtener proyectos de la organización actual
  const { data: projects, isLoading: isLoadingProjects } = useProjects(userData?.organization?.id);
  
  // Proyecto activo
  const activeProject = projects?.find(p => p.id === userData?.preferences?.last_project_id);
  
  // Filtrar proyectos por búsqueda
  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(projectSearchValue.toLowerCase())
  ) || [];
  
  // Mutación para seleccionar proyecto
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('user_id', userData?.user?.id);
      
      if (error) throw error;
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });
  
  const toggleAccordion = (key: string) => {
    setExpandedAccordions(prev => {
      // Solo uno abierto a la vez
      const newState = { obra: false, finanzas: false };
      newState[key as keyof typeof newState] = !prev[key];
      return newState;
    });
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
          { icon: FileText, label: 'Bitácora', href: '/bitacora' }
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
      { icon: Building, label: 'Organizaciones', href: '/admin/organizations' },
      { icon: Users, label: 'Usuarios', href: '/admin/users' },
      { icon: Tag, label: 'Categorías de Materiales', href: '/admin/material-categories' },
      { icon: Package, label: 'Materiales', href: '/admin/materials' },
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

          {/* Project Selector - Bottom of navigation area, only in project context */}
          {currentSidebarContext === 'project' && (
            <div className="mt-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {isExpanded ? (
                    <div className="w-full h-9 px-3 py-2 bg-[var(--menues-bg)] rounded-lg border border-[var(--menues-border)] flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2 min-w-0">
                        {activeProject && <Crown className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />}
                        <span className="text-sm text-[var(--menues-fg)] truncate">
                          {activeProject?.name || 'Seleccionar proyecto'}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-[var(--menues-fg)] flex-shrink-0" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 bg-[var(--menues-bg)] rounded-lg border border-[var(--menues-border)] flex items-center justify-center cursor-pointer mx-auto">
                      <span className="text-xs font-medium text-[var(--accent)]">
                        {activeProject?.name ? activeProject.name.substring(0, 2).toUpperCase() : 'PR'}
                      </span>
                    </div>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-[220px] z-[100]" 
                  align="start" 
                  side="top"
                  sideOffset={5}
                >
                  {/* Search Input */}
                  <div className="p-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar proyectos..."
                        value={projectSearchValue}
                        onChange={(e) => setProjectSearchValue(e.target.value)}
                        className="pl-8 h-8"
                      />
                    </div>
                  </div>
                  
                  {/* Project List */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredProjects.map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => {
                          selectProjectMutation.mutate(project.id);
                          setProjectSearchValue('');
                        }}
                        className="flex items-center gap-2"
                      >
                        {project.id === activeProject?.id && (
                          <Crown className="w-4 h-4 text-[var(--accent)]" />
                        )}
                        <span className="truncate">{project.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  
                  {/* No projects found */}
                  {filteredProjects.length === 0 && projectSearchValue && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No se encontraron proyectos
                    </div>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  {/* Manage Projects Link */}
                  <DropdownMenuItem onClick={() => navigate('/organization/proyectos')}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Gestión de Proyectos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Plan Section - Above Divider */}
      <div className="p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Plan Button */}
          {isExpanded ? (
            <div className={cn(
              "p-3 rounded-lg border transition-all duration-200 bg-blue-50/50 border-blue-200/50"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center",
                  (!userData?.plan || userData.plan.name === 'free') && "bg-[var(--accent)] text-white",
                  userData?.plan?.name === 'pro' && "bg-blue-500 text-white",
                  userData?.plan?.name === 'teams' && "bg-purple-500 text-white"
                )}>
                  {(!userData?.plan || userData.plan.name === 'free') && <Star className="w-3 h-3" />}
                  {userData?.plan?.name === 'pro' && <Crown className="w-3 h-3" />}
                  {userData?.plan?.name === 'teams' && <Zap className="w-3 h-3" />}
                </div>
                <span className="text-xs font-medium text-gray-600">
                  Plan actual:
                </span>
              </div>
              <div className="mb-2">
                <span className={cn(
                  "text-sm font-semibold capitalize",
                  (!userData?.plan || userData.plan.name === 'free') && "text-[var(--accent)]",
                  userData?.plan?.name === 'pro' && "text-blue-600",
                  userData?.plan?.name === 'teams' && "text-purple-600"
                )}>
                  {userData?.plan?.name === 'pro' && 'Pro trial'}
                  {userData?.plan?.name === 'teams' && 'Teams'}
                  {(!userData?.plan || userData.plan.name === 'free') && 'Free'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {(!userData?.plan || userData.plan.name === 'free') && "Actualiza para obtener las últimas y exclusivas funcionalidades"}
                {userData?.plan?.name === 'pro' && "Actualiza para obtener las últimas y exclusivas funcionalidades"}
                {userData?.plan?.name === 'teams' && "Máximo rendimiento para equipos"}
              </p>
              {(!userData?.plan || userData.plan.name === 'free' || userData?.plan?.name === 'pro') && (
                <button className={cn(
                  "w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1",
                  "bg-blue-600 text-white hover:bg-blue-700"
                )}>
                  <Zap className="w-3 h-3" />
                  Upgrade to Pro
                </button>
              )}
            </div>
          ) : (
            <div className={cn(
              "w-9 h-9 rounded-full border-2 flex items-center justify-center cursor-pointer mx-auto transition-all duration-200",
              (!userData?.plan || userData.plan.name === 'free') && "bg-[var(--accent)] border-[var(--accent)]",
              userData?.plan?.name === 'pro' && "bg-blue-500 border-blue-500",
              userData?.plan?.name === 'teams' && "bg-purple-500 border-purple-500"
            )}>
              {(!userData?.plan || userData.plan.name === 'free') && <Star className="w-4 h-4 text-white" />}
              {userData?.plan?.name === 'pro' && <Crown className="w-4 h-4 text-white" />}
              {userData?.plan?.name === 'teams' && <Zap className="w-4 h-4 text-white" />}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Fixed Buttons */}
      <div className="border-t border-[var(--menues-border)] p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Administration */}
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