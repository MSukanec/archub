import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useProjectContext } from '@/stores/projectContext';
import { Badge } from "@/components/ui/badge";
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
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Folder,
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
  Bell
} from "lucide-react";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { SelectorPopover } from "@/components/popovers/SelectorPopover";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import ButtonSidebar from "./ButtonSidebar";
import PlanRestricted from "@/components/ui-custom/security/PlanRestricted";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { getOrganizationInitials, getProjectInitials } from "@/utils/initials";

// Define types for sidebar items
interface SidebarItem {
  icon: any;
  label: string;
  href: string;
}

interface SidebarItemWithSubmenu {
  id: string;
  icon: any;
  label: string;
  defaultRoute: string;
  submenu?: SidebarSubItem[];
  generalModeRestricted?: boolean;
}

interface SidebarSubItem {
  icon: any;
  label: string;
  href: string;
  generalModeRestricted?: boolean;
}

interface SidebarDivider {
  type: 'divider';
}

interface SidebarSection {
  type: 'section';
  label: string;
}

type AnySidebarItem = SidebarItem | SidebarItemWithSubmenu | SidebarDivider | SidebarSection;

export function MainSidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId, setSelectedProject } = useProjectContext();
  const { currentSidebarContext, setSidebarContext, activeSidebarSection, setActiveSidebarSection, sidebarLevel, setSidebarLevel, goToMainLevel } = useNavigationStore();
  
  // Obtener proyectos de la organización actual - ahora usa ProjectContext automáticamente
  const { data: projects = [] } = useProjectsLite();
  
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
      setSidebarLevel('project');
      // Optimistic update: don't invalidate current-user to avoid 1000ms delay
      // The context state is already updated, no need to refetch user data
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
    }
  });
  
  const handleProjectSelect = (projectId: string) => {
    // Siempre cambiar al nivel de proyecto cuando se clickea un proyecto
    setSidebarLevel('project');
    
    // Cerrar dropdown
    setIsDropdownOpen(false);
    
    // Solo actualizar la preferencia si es un proyecto diferente
    if (selectedProjectId !== projectId) {
      updateProjectMutation.mutate(projectId);
    } else {
      // Si es el mismo proyecto, solo asegurar que el contexto esté actualizado
      setSelectedProject(projectId);
    }
  };
  
  const handleOrganizationSelect = () => {
    setSidebarLevel('organization');
    // Cerrar dropdown
    setIsDropdownOpen(false);
  };
  
  const { isDocked, isHovered, setHovered, setDocked } = useSidebarStore();
  const { isDocked: isSecondaryDocked, isHovered: isSecondaryHovered, setDocked: setSecondarySidebarDocked } = useSecondarySidebarStore();
  
  // Define if secondary sidebar is expanded
  const isSecondaryExpanded = isSecondaryDocked || isSecondaryHovered || isHovered;
  
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
  
  // Estado para acordeones - solo uno abierto a la vez
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(() => {
    const saved = localStorage.getItem('sidebar-accordion');
    return saved || 'CONSTRUCCIÓN'; // Por defecto "CONSTRUCCIÓN" expandida
  });

  // Estado para transiciones
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Estado para el dropdown selector
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Guardar estado de acordeón en localStorage
  useEffect(() => {
    if (expandedAccordion) {
      localStorage.setItem('sidebar-accordion', expandedAccordion);
    } else {
      localStorage.removeItem('sidebar-accordion');
    }
  }, [expandedAccordion]);
  
  const toggleAccordion = (key: string) => {
    setExpandedAccordion(prev => prev === key ? null : key);
  };

  // Definir contenido para cada nivel del sidebar
  const sidebarContent = {
    organization: [
      { icon: Folder, label: 'Gestión de Proyectos', href: '/organization/projects' },
      { icon: TrendingUp, label: 'Movimientos', href: '/movements' },
      { icon: HandCoins, label: 'Capital', href: '/finances/capital' },
      { icon: CreditCard, label: 'Gastos Generales', href: '/finances/general-costs' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Contact, label: 'Contactos', href: '/contacts' },
      { icon: BarChart3, label: 'Biblioteca', href: '/analysis' },
      { icon: Settings, label: 'Preferencias', href: '/organization/preferences' }
    ],
    finances: [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
      { icon: HandCoins, label: 'Capital', href: '/finances/capital' },
      { icon: CreditCard, label: 'Gastos Generales', href: '/finances/general-costs' }
    ],
    project: [],
    commercialization: [
      { icon: Users, label: 'Clientes', href: '/commercialization/clients' }
    ],
    construction: [
      { icon: Calculator, label: 'Cómputo y Presupuesto', href: '/budgets' },
      { icon: CheckSquare, label: 'Tareas de Construcción', href: '/construction/tasks' },
      { icon: Users, label: 'Mano de Obra', href: '/construction/personnel' },
      { icon: Package2, label: 'Materiales', href: '/construction/materials' },
      { icon: TrendingUp, label: 'Indirectos', href: '/construction/indirects' },
      { icon: Handshake, label: 'Subcontratos', href: '/construction/subcontracts' },
      { icon: FileText, label: 'Bitácora', href: '/construction/logs' }
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

  // Función para obtener el contenido del sidebar basado en el sidebarLevel
  const getTertiarySidebarItems = () => {
    if (sidebarLevel === 'project') {
      // Vista PROYECTO: cuando hay un proyecto seleccionado
      const projectItems = [
        {
          type: 'button',
          id: 'project-summary',
          icon: Home,
          label: 'Resumen de Proyecto',
          href: '/project/dashboard'
        },
        {
          type: 'divider'
        },
        // Botones de construcción sin sección acordeón
        ...(sidebarContent.construction || []).map(item => ({
          type: 'button',
          id: `construction-${item.href.split('/').pop()}`,
          icon: item.icon,
          label: item.label,
          href: item.href,
          restricted: item.label === 'Mano de Obra' || item.label === 'Indirectos' || item.href === '/construction/materials' || item.href === '/construction/logs'
        })),
        {
          type: 'divider'
        },
        // Botones de comercialización sin sección acordeón
        ...(sidebarContent.commercialization || []).map(item => ({
          type: 'button',
          id: `commercialization-${item.href.split('/').pop()}`,
          icon: item.icon,
          label: item.label,
          href: item.href
        })),
        {
          type: 'divider'
        },
        {
          type: 'button',
          id: 'project-calendar',
          icon: Calendar,
          label: 'Calendario',
          href: '/calendar',
          restricted: true
        },
        {
          type: 'button',
          id: 'project-media',
          icon: FileText,
          label: 'Media',
          href: '/media',
          restricted: true
        }
      ];
      return projectItems;
    } else if (sidebarLevel === 'organization') {
      // Vista ORGANIZACIÓN
      const organizationItems = [
        {
          type: 'button',
          id: 'organization-summary',
          icon: Home,
          label: 'Resumen de Organización',
          href: '/organization/dashboard'
        },
        {
          type: 'divider'
        },
        // Proyectos
        {
          type: 'button',
          id: 'organization-projects',
          icon: Folder,
          label: 'Gestión de Proyectos',
          href: '/organization/projects'
        },
        // Contactos
        {
          type: 'button',
          id: 'organization-contacts',
          icon: Contact,
          label: 'Contactos',
          href: '/contacts'
        },
        // Biblioteca (antes Análisis)
        {
          type: 'button',
          id: 'organization-analysis',
          icon: BarChart3,
          label: 'Biblioteca',
          href: '/analysis'
        },
        {
          type: 'divider'
        },
        // Movimientos
        {
          type: 'button',
          id: 'organization-movements',
          icon: TrendingUp,
          label: 'Movimientos',
          href: '/movements'
        },
        // Capital
        {
          type: 'button',
          id: 'organization-capital',
          icon: HandCoins,
          label: 'Capital',
          href: '/finances/capital',
          restricted: true
        },
        // Gastos Generales
        {
          type: 'button',
          id: 'organization-general-costs',
          icon: CreditCard,
          label: 'Gastos Generales',
          href: '/finances/general-costs',
          restricted: true
        },
        {
          type: 'divider'
        },
        // Actividad
        {
          type: 'button',
          id: 'organization-activity',
          icon: Activity,
          label: 'Actividad',
          href: '/organization/activity',
          restricted: true
        },
        // Preferencias
        {
          type: 'button',
          id: 'organization-preferences',
          icon: Settings,
          label: 'Preferencias',
          href: '/organization/preferences'
        }
      ];
      return organizationItems;
    } else if (sidebarLevel === 'admin') {
      // Vista ADMINISTRACIÓN
      return [
        {
          type: 'button',
          id: 'admin-dashboard',
          icon: Crown,
          label: 'Comunidad',
          href: '/admin/dashboard'
        },
        {
          type: 'button',
          id: 'admin-tasks',
          icon: ListTodo,
          label: 'Tareas',
          href: '/admin/tasks'
        },
        {
          type: 'button',
          id: 'admin-materials',
          icon: Database,
          label: 'Costos',
          href: '/admin/materials'
        },
        {
          type: 'button',
          id: 'admin-general',
          icon: Settings,
          label: 'General',
          href: '/admin/general'
        },
        {
          type: 'button',
          id: 'admin-products',
          icon: Package,
          label: 'Productos',
          href: '/providers/products'
        }
      ];
    } else {
      // Default fallback para otros estados del sidebar
      return [];
    }
  };

  return (
    <>
    {/* Container principal para AMBOS sidebars */}
    <div className="flex flex-row">
      
      {/* SIDEBAR IZQUIERDO - Solo iconos, ancho fijo, sin expansión */}
      <div 
        className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-r border-[var(--main-sidebar-border)] transition-all duration-150 z-30 flex flex-row overflow-visible"
        style={{
          height: '100vh', // Ahora llega hasta arriba, sin header
          width: '48px' // Ancho fijo para solo iconos
        }}
      >
        <aside className="flex flex-col overflow-visible w-12">
          {/* Logo de la Organización - SIDEBAR IZQUIERDO */}
          <div className="flex items-center justify-center border-b border-[var(--main-sidebar-border)] h-[72px] px-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
              {userData?.organization?.logo_url ? (
                <img 
                  src={userData.organization.logo_url} 
                  alt={userData.organization.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-white font-semibold text-lg"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {getOrganizationInitials(userData?.organization?.name || 'O')}
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation Items - SIDEBAR IZQUIERDO - Solo iconos */}
          <div className="flex-1 overflow-y-auto pt-3 pb-2 px-0 min-h-0">
            <div className="flex flex-col gap-[2px] h-full">
              {/* Botón Organización */}
              <ButtonSidebar
                icon={<Building className="w-[18px] h-[18px]" />}
                label=""
                isActive={sidebarLevel === 'organization'}
                isExpanded={false}
                onClick={() => setSidebarLevel('organization')}
                variant="secondary"
              />

              {/* Botón Proyecto */}
              <ButtonSidebar
                icon={<Folder className="w-[18px] h-[18px]" />}
                label=""
                isActive={sidebarLevel === 'project'}
                isExpanded={false}
                onClick={() => setSidebarLevel('project')}
                variant="secondary"
              />

              {/* Botón Administración - Solo para admins */}
              {isAdmin && (
                <ButtonSidebar
                  icon={<Crown className="w-[18px] h-[18px]" />}
                  label=""
                  isActive={sidebarLevel === 'admin'}
                  isExpanded={false}
                  onClick={() => {
                    setSidebarLevel('admin');
                    navigate('/admin/dashboard');
                  }}
                  variant="secondary"
                />
              )}

              {/* Divisor */}
              <div className="h-px bg-white/20 my-2 mx-2"></div>



            </div>
          </div>
          
          {/* User Avatar - Bottom of left sidebar */}
          <div className="mt-auto border-t border-[var(--main-sidebar-border)] p-2 flex-shrink-0">
            <div className="flex items-center justify-center">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/profile')}
              >
                {userData?.user?.avatar_url ? (
                  <img 
                    src={userData.user.avatar_url} 
                    alt={userData.user.email}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {userData?.user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* SIDEBAR DERECHO - Idéntico al izquierdo */}
      <div 
        className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-r border-[var(--main-sidebar-border)] transition-all duration-150 z-30 flex flex-row overflow-visible"
        style={{
          height: '100vh', // Ahora llega hasta arriba, sin header
          width: isHovered ? (isExpanded ? '304px' : '96px') : (isExpanded ? '256px' : '48px')
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <aside 
          className={cn(
            "flex flex-col overflow-visible flex-1",
            isExpanded ? "w-64" : "w-12"
          )}
        >
          {/* Selector de Proyectos - SIDEBAR DERECHO */}
          <div className={cn(
            "flex items-center border-b border-[var(--main-sidebar-border)] flex-shrink-0 px-0 py-0",
            isExpanded ? "min-h-[72px]" : "h-[72px]" // Mismo alto que tenía el logo antes
          )}>
            {isExpanded ? (
              <div className="w-full relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-200",
                    "hover:bg-[var(--main-sidebar-button-hover-bg)]",
                    isDropdownOpen && "bg-[var(--main-sidebar-button-hover-bg)]"
                  )}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {selectedProjectId && projects.find(p => p.id === selectedProjectId) ? (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white font-semibold text-xs"
                        style={{ 
                          backgroundColor: projects.find(p => p.id === selectedProjectId)?.color || 'var(--main-sidebar-button-bg)'
                        }}
                      >
                        {getProjectInitials(projects.find(p => p.id === selectedProjectId)?.name || 'P')}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--main-sidebar-button-bg)' }}>
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs">
                          P
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--text-important)' }}
                    >
                      {(selectedProjectId && projects.find(p => p.id === selectedProjectId))
                        ? projects.find(p => p.id === selectedProjectId)?.name || "Sin proyecto"
                        : "Seleccionar proyecto"
                      }
                    </div>
                  </div>
                  
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200 flex-shrink-0",
                    isDropdownOpen && "rotate-180"
                  )} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--main-sidebar-bg)] border border-[var(--main-sidebar-border)] rounded-md shadow-lg z-50 max-h-72 overflow-y-auto">
                    <div className="max-h-60 overflow-y-auto">
                      {projects.map((project: any) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project.id)}
                          className={cn(
                            "flex items-center px-3 py-2 text-left w-full transition-all duration-200 last:rounded-b-md",
                            selectedProjectId === project.id
                              ? "bg-[var(--main-sidebar-button-active-bg)] text-[var(--main-sidebar-button-active-fg)]" 
                              : "hover:bg-[var(--main-sidebar-button-hover-bg)]"
                          )}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0 overflow-hidden">
                              <div 
                                className="w-full h-full flex items-center justify-center text-white font-semibold text-xs"
                                style={{ 
                                  backgroundColor: project.color || 'var(--main-sidebar-button-bg)'
                                }}
                              >
                                {getProjectInitials(project.name || 'P')}
                              </div>
                            </div>
                            <div 
                              className="text-xs font-medium truncate"
                              style={{ 
                                color: selectedProjectId === project.id
                                  ? 'var(--main-sidebar-button-active-fg)' 
                                  : 'var(--text-important)' 
                              }}
                            >
                              {project.name}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center w-full">
                {selectedProjectId && projects.find(p => p.id === selectedProjectId) ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-semibold text-xs"
                      style={{ backgroundColor: projects.find(p => p.id === selectedProjectId)?.color || 'var(--main-sidebar-button-bg)' }}
                    >
                      {getProjectInitials(projects.find(p => p.id === selectedProjectId)?.name || 'P')}
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--main-sidebar-button-bg)' }}>
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs">
                      P
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Navigation Items - SIDEBAR DERECHO */}
          <div className="flex-1 overflow-y-auto pt-3 pb-2 px-0 min-h-0">
            <div className="flex flex-col gap-[2px] h-full">
              {(() => {
                const items = getTertiarySidebarItems();
                let currentSection: string | null = null;
                const elementsToRender: React.ReactNode[] = [];
                
                items.forEach((item: any, index: number) => {
                  if (!item || typeof item !== 'object') {
                    return;
                  }

                  if ('type' in item && item.type === 'divider') {
                    elementsToRender.push(
                      <div 
                        key={`divider-${index}`} 
                        className="h-4"
                      ></div>
                    );
                    return;
                  }
                  
                  if ('type' in item && item.type === 'section') {
                    currentSection = item.label;
                    const isAccordionExpanded = expandedAccordion === item.label;
                    
                    elementsToRender.push(
                      <ButtonSidebar
                        key={`section-${index}`}
                        icon={<Folder className="w-[18px] h-[18px]" />}
                        label={item.label}
                        isActive={false}
                        isExpanded={isExpanded}
                        onClick={() => toggleAccordion(item.label)}
                        variant="secondary"
                        rightIcon={isExpanded ? (
                          <div className="transition-transform duration-200">
                            {isAccordionExpanded ? 
                              <ChevronUp className="w-3 h-3" /> : 
                              <ChevronDown className="w-3 h-3" />
                            }
                          </div>
                        ) : undefined}
                      />
                    );
                    return;
                  }

                  if ('type' in item && item.type === 'button') {
                    // Para el sidebar de proyecto, mostrar todos los botones sin restricción de sección
                    // Para otros sidebars, mantener la lógica de acordeón
                    const shouldShowButton = sidebarLevel === 'project' || !currentSection || expandedAccordion === currentSection;
                    
                    if (shouldShowButton) {
                      const buttonElement = (
                        <ButtonSidebar
                          key={`button-${item.id}`}
                          icon={<item.icon className="w-[18px] h-[18px]" />}
                          label={item.label}
                          isActive={location === item.href}
                          isExpanded={isExpanded}
                          onClick={() => navigate(item.href)}
                          variant="secondary"
                        />
                      );
                      
                      if (item.restricted) {
                        elementsToRender.push(
                          <PlanRestricted 
                            key={`restricted-${item.id}`}
                            reason="coming_soon" 
                            functionName={item.label}
                            adminBypass={true}
                          >
                            {buttonElement}
                          </PlanRestricted>
                        );
                      } else {
                        elementsToRender.push(buttonElement);
                      }
                    }
                    return;
                  }

                  const sidebarItem = item as SidebarItem;
                  
                  if (!sidebarItem.icon || !sidebarItem.label) {
                    return;
                  }
                  
                  const itemKey = sidebarItem.label || `item-${index}`;
                  const isActive = Boolean('href' in sidebarItem && location === sidebarItem.href);
                  const buttonElement = (
                    <ButtonSidebar
                      icon={<sidebarItem.icon className="w-[18px] h-[18px]" />}
                      label={sidebarItem.label}
                      isActive={isActive}
                      isExpanded={isExpanded}
                      onClick={() => {
                        if (sidebarItem.href) {
                          navigate(sidebarItem.href);
                        }
                      }}
                      href={sidebarItem.href}
                      variant="secondary"
                    />
                  );
                  
                  elementsToRender.push(
                    <div key={`${itemKey}-${index}`}>
                      {buttonElement}
                    </div>
                  );
                });
                
                return elementsToRender;
              })()}
            </div>
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}