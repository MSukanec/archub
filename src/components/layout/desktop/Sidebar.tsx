import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  FolderOpen,
  HardHat,
  Library,
  Shield,
  Sun,
  Moon,
  PanelLeftOpen,
  PanelLeftClose,
  Bell,
  Folder,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Home,
  Users,
  Contact,
  Database,
  Activity,
  Settings,
  Info,
  CheckSquare,
  FileText,
  HandCoins,
  CreditCard,
  Calculator,
  Package2,
  TrendingUp,
  Handshake,
  Crown,
  ListTodo,
  Package
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { useProjectContext } from "@/stores/projectContext";
import { supabase } from "@/lib/supabase";
import { useProjects } from "@/hooks/use-projects";
import SidebarButton from "./SidebarButton";
import { SelectorPopover } from "@/components/popovers/SelectorPopover";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const isAdmin = useIsAdmin();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { selectedProjectId, setSelectedProject } = useProjectContext();
  
  // Get projects data to find current project info
  const { data: projects = [] } = useProjects(userData?.organization?.id);
  
  // Find current project
  const currentProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
  
  // Helper function to get project initials
  const getProjectInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };
  
  // Sidebar state - usando la misma lógica que SecondarySidebar
  const { isDocked: isMainDocked } = useSidebarStore();
  const { isDocked, setDocked, isHovered, setHovered } = useSecondarySidebarStore();
  const isExpanded = isDocked || isHovered || isMainDocked;
  
  // State for accordion expansion
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Mutation para cambiar proyecto
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

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    const rootElement = document.documentElement;
    if (newTheme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
    
    savePreferencesMutation.mutate({ theme: newTheme });
  };

  // Handle dock toggle
  const handleDockToggle = () => {
    const newDocked = !isDocked;
    setDocked(newDocked);
    savePreferencesMutation.mutate({ sidebar_docked: newDocked });
  };

  // Toggle accordion - misma lógica que SecondarySidebar
  const toggleAccordion = (accordionId: string) => {
    setExpandedAccordion(prev => prev === accordionId ? null : accordionId);
  };

  // Define accordion sections with their sub-items - ESTA ES LA DIFERENCIA: acordeones combinados
  const sidebarContent = [
    {
      type: 'accordion',
      id: 'organization',
      label: 'ORGANIZACIÓN',
      icon: Building2,
      items: [
        { icon: Home, label: 'Dashboard', href: '/organization/dashboard' },
        { icon: Folder, label: 'Proyectos', href: '/organization/projects' },
        { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
        { icon: Users, label: 'Miembros', href: '/organization/members' },
        { icon: Database, label: 'Datos Básicos', href: '/organization/data' },
        { icon: Activity, label: 'Actividad', href: '/organization/activity' },
        { icon: Settings, label: 'Preferencias', href: '/organization/preferences' }
      ]
    },
    {
      type: 'accordion',
      id: 'general',
      label: 'GENERAL',
      icon: FolderOpen,
      items: [
        { icon: Info, label: 'Información', href: '/general/info' },
        { icon: CheckSquare, label: 'Tablero', href: '/general/calendar' },
        { icon: FileText, label: 'Media', href: '/general/media' }
      ]
    },
    {
      type: 'accordion',
      id: 'construction',
      label: 'CONSTRUCCIÓN',
      icon: HardHat,
      items: [
        { icon: CheckSquare, label: 'Tareas', href: '/construction/tasks' },
        { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
        { icon: Users, label: 'Mano de Obra', href: '/construction/personnel' },
        { icon: Package2, label: 'Materiales', href: '/construction/materials' },
        { icon: TrendingUp, label: 'Indirectos', href: '/construction/indirects' },
        { icon: Handshake, label: 'Subcontratos', href: '/construction/subcontracts' },
        { icon: FileText, label: 'Bitácora', href: '/construction/logs' }
      ]
    },
    {
      type: 'accordion',
      id: 'commercialization',
      label: 'COMERCIALIZACIÓN',
      icon: Handshake,
      items: [
        { icon: Users, label: 'Clientes', href: '/general/clients' }
      ]
    },
    {
      type: 'accordion',
      id: 'finances',
      label: 'FINANZAS',
      icon: DollarSign,
      items: [
        { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
        { icon: DollarSign, label: 'Movimientos', href: '/finances/movements' },
        { icon: HandCoins, label: 'Capital', href: '/finances/capital' },
        { icon: CreditCard, label: 'Gastos Generales', href: '/finances/general-costs' }
      ]
    },
    {
      type: 'accordion',
      id: 'library',
      label: 'BIBLIOTECA',
      icon: Library,
      items: [
        { icon: CheckSquare, label: 'Tareas', href: '/library/tasks' },
        { icon: Package2, label: 'Materiales', href: '/library/materials' },
        { icon: Users, label: 'Mano de Obra', href: '/library/labor' },
        { icon: TrendingUp, label: 'Costos Indirectos', href: '/library/indirects' }
      ]
    },
    ...(isAdmin ? [{
      type: 'accordion',
      id: 'admin',
      label: 'ADMINISTRACIÓN',
      icon: Shield,
      items: [
        { icon: Crown, label: 'Comunidad', href: '/admin/dashboard' },
        { icon: ListTodo, label: 'Tareas', href: '/admin/tasks' },
        { icon: Database, label: 'Costos', href: '/admin/materials' },
        { icon: Settings, label: 'General', href: '/admin/general' },
        { icon: Package, label: 'Productos', href: '/providers/products' }
      ]
    }] : []),
    
    // Sección inferior IDÉNTICA al PrimarySidebar
    { type: 'bottom-section-start' }
  ];

  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 h-screen border-r bg-[var(--secondary-sidebar-bg)] border-[var(--secondary-sidebar-border)] transition-all duration-300 z-40 flex flex-col",
        isExpanded ? "w-64" : "w-[52px]"
      )}
      style={{
        overflow: 'hidden'
      }}
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Project Header - Expandible como en la referencia */}
      <div className="h-12 flex-shrink-0 flex items-center justify-center px-3">
        {currentProject ? (
          <SelectorPopover
            trigger={
              <button className="w-full flex items-center gap-3 hover:bg-[var(--secondary-sidebar-hover)] rounded-md p-2 transition-colors group">
                {/* Avatar del proyecto - siempre visible */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: currentProject.color || '#6366f1' }}
                >
                  {getProjectInitials(currentProject.name || 'P')}
                </div>
                
                {/* Información expandida - solo cuando está expandido */}
                {isExpanded && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-bold text-[var(--secondary-sidebar-text)] truncate">
                        {currentProject.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {currentProject.project_data?.project_type?.name || currentProject.project_data?.modality?.name || 'Proyecto'}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-[var(--secondary-sidebar-text)] transition-colors" />
                  </>
                )}
              </button>
            }
            items={projects.map((project) => ({
              id: project.id,
              name: project.name,
              logo_url: project.project_data?.project_image_url,
              type: "Proyecto" as const,
              color: project.color
            }))}
            selectedId={selectedProjectId || undefined}
            onSelect={handleProjectSelect}
            emptyMessage="No hay proyectos disponibles"
            getInitials={getProjectInitials}
          />
        ) : (
          // Fallback cuando no hay proyecto seleccionado
          <div className="flex items-center px-2">
            {isExpanded && (
              <span className="text-sm font-black text-black uppercase">
                MENÚ PRINCIPAL
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 flex flex-col items-center">
        <div className="flex flex-col gap-[2px] h-full items-center">
          <div className={`flex-1 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            
            {/* Renderizar contenido */}
            {sidebarContent.map((item, index) => {
              // Type guard to ensure we're working with a proper item
              if (!item || typeof item !== 'object') {
                return null;
              }

              // Si llegamos al inicio de la sección inferior, renderizar IDÉNTICO al PrimarySidebar
              if ('type' in item && item.type === 'bottom-section-start') {
                return (
                  <div key={`bottom-section-${index}`}>
                    {/* Spacer para empujar la sección inferior hacia abajo */}
                    <div className="flex-1"></div>
                  </div>
                );
              }

              // Si es un acordeón, renderizar acordeón con elementos expandibles - EXACTAMENTE como SecondarySidebar
              if ('type' in item && item.type === 'accordion') {
                const accordionItem = item as any;
                const isAccordionExpanded = expandedAccordion === accordionItem.id;
                
                return (
                  <div key={`accordion-${accordionItem.id}`} className="mb-1">
                    {/* Botón del acordeón */}
                    <SidebarButton
                      icon={<accordionItem.icon className="w-[18px] h-[18px]" />}
                      label={accordionItem.label}
                      isActive={false}
                      isExpanded={isExpanded}
                      onClick={() => toggleAccordion(accordionItem.id)}
                      variant="secondary"
                      disableHover={true}
                      rightIcon={isExpanded ? (
                        <div className="transition-transform duration-200">
                          {isAccordionExpanded ? 
                            <ChevronUp className="w-3 h-3" /> : 
                            <ChevronDown className="w-3 h-3" />
                          }
                        </div>
                      ) : undefined}
                    />
                    
                    {/* Elementos del acordeón expandidos - solo si el sidebar está expandido Y el acordeón está expandido */}
                    {isExpanded && isAccordionExpanded && (
                      <div className="relative">
                        {/* Línea vertical que conecta los elementos hijos */}
                        <div 
                          className="absolute left-[16px] top-1 bottom-1 w-[1px]"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            zIndex: 1
                          }}
                        />
                        
                        <div className="ml-[32px] mt-1 space-y-[2px]">
                          {(accordionItem.items || []).map((subItem: any, subIndex: number) => {
                            const isSubItemActive = Boolean(subItem.href && location === subItem.href);
                            return (
                              <SidebarButton
                                key={`${accordionItem.id}-${subIndex}`}
                                icon={<subItem.icon className="w-[16px] h-[16px]" />}
                                label={subItem.label}
                                isActive={isSubItemActive}
                                isExpanded={isExpanded}
                                onClick={() => {
                                  if (subItem.href) {
                                    navigate(subItem.href);
                                  }
                                }}
                                href={subItem.href}
                                variant="secondary"
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // For basic sidebar items
              const sidebarItem = item as any;
              
              // Verificar que tengamos icon y label antes de renderizar
              if (!sidebarItem.icon || !sidebarItem.label) {
                return null;
              }
              
              const itemKey = sidebarItem.label || `item-${index}`;
              const isActive = Boolean('href' in sidebarItem && location === sidebarItem.href);
              const buttonElement = (
                <SidebarButton
                  icon={<sidebarItem.icon className="w-[18px] h-[18px]" />}
                  label={sidebarItem.label}
                  isActive={isActive}
                  isExpanded={isExpanded}
                  onClick={() => {
                    if (sidebarItem.onClick) {
                      sidebarItem.onClick();
                    } else if (sidebarItem.href && sidebarItem.href !== '#') {
                      navigate(sidebarItem.href);
                    }
                  }}
                  href={sidebarItem.href}
                  variant="secondary"
                />
              );
              
              return (
                <div key={`${itemKey}-${index}`}>
                  <div className="mb-[2px]">
                    {buttonElement}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Bottom Section - Fixed Buttons - IDÉNTICO al PrimarySidebar */}
      <div className="flex flex-col items-center">
        <div className="flex flex-col gap-[2px] items-center">
          
          {/* Theme Toggle */}
          <SidebarButton
            icon={theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            label={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
            isActive={false}
            isExpanded={false}
            onClick={handleThemeToggle}
            variant="main"
          />
          
          {/* Sidebar Pin/Unpin */}
          <SidebarButton
            icon={isDocked ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
            label={isDocked ? "Desanclar Sidebar" : "Anclar Sidebar"}
            isActive={false}
            isExpanded={false}
            onClick={handleDockToggle}
            variant="main"
          />
          
          {/* Notifications */}
          <SidebarButton
            icon={<Bell className="w-[18px] h-[18px]" />}
            label="Notificaciones"
            isActive={false}
            isExpanded={false}
            onClick={() => console.log('Notificaciones clicked')}
            variant="main"
          />
          
          {/* User Avatar */}
          <SidebarButton
            icon={null}
            avatarUrl={userData?.user?.avatar_url}
            userFullName={userData?.user?.full_name}
            label={userData?.user?.full_name || 'Usuario'}
            isActive={false}
            isExpanded={false}
            onClick={() => navigate('/profile')}
            variant="main"
            disableHover={true}
          />
          
        </div>
      </div>
    </aside>
  );
}