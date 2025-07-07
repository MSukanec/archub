import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Building,
  FolderOpen,
  CheckSquare,
  Shield,
  Home,
  Mail,
  Activity,
  Users,
  Settings,
  DollarSign,
  Calculator,
  Package,
  FileText,
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Contact,
  Database,
  Layout,
  Images,
  Handshake,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useProjects } from "@/hooks/use-projects";
import CustomRestricted from "@/components/ui-custom/misc/CustomRestricted";

interface MobileMenuProps {
  onClose: () => void;
  isOpen: boolean;
}

export function MobileMenu({ onClose }: MobileMenuProps): React.ReactPortal {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [expandedOrgSelector, setExpandedOrgSelector] = useState(false);
  const [expandedProjectSelector, setExpandedProjectSelector] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const queryClient = useQueryClient();

  // Obtener organizaciones y proyectos
  const currentOrganization = userData?.organization;
  const sortedOrganizations = userData?.organizations || [];
  const { data: projectsData } = useProjects(currentOrganization?.id);
  const effectiveCurrentProject = userData?.preferences?.last_project_id;
  const isAdmin = userData?.organization?.is_admin || false;

  // Organization selection mutation
  const organizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('No user preferences available');
      }

      // Obtener el primer proyecto de la nueva organización
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1);

      const firstProjectId = projectsData?.[0]?.id || null;

      const { error } = await supabase
        .from('user_preferences')
        .update({ 
          last_organization_id: organizationId,
          last_project_id: firstProjectId 
        })
        .eq('id', userData.preferences.id);

      if (error) throw error;
      return organizationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setExpandedOrgSelector(false);
      setSidebarContext('organization');
      navigate('/organization/dashboard');
    }
  });

  // Project selection mutation
  const projectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('No user preferences available');
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('id', userData.preferences.id);

      if (error) throw error;
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setExpandedProjectSelector(false);
    }
  });

  const handleNavigationWithAnimation = (href: string, newContext?: string, direction?: 'left' | 'right') => {
    if (newContext && direction) {
      setAnimationDirection(direction);
      setIsAnimating(true);
      
      setTimeout(() => {
        setSidebarContext(newContext as any);
        setIsAnimating(false);
        setAnimationDirection(null);
      }, 150);
      
      // Solo navegar, NO cerrar el menú para cambios de contexto
      navigate(href);
    } else {
      // Para navegación normal (sin cambio de contexto), cerrar menú
      if (newContext) {
        setSidebarContext(newContext as any);
      }
      navigate(href);
      onClose();
    }
  };

  const handleNavigation = (href: string, newContext?: string) => {
    if (newContext) {
      // Si hay cambio de contexto, no cerrar menú
      setSidebarContext(newContext as any);
      navigate(href);
    } else {
      // Si no hay cambio de contexto, cerrar menú
      navigate(href);
      onClose();
    }
  };

  const handleOrganizationSelect = (organizationId: string) => {
    organizationMutation.mutate(organizationId);
    // Clear project selection when organization changes (like desktop header)
    if (userData?.preferences?.id) {
      projectMutation.mutate('');
    }
  };

  const handleProjectSelect = (projectId: string) => {
    projectMutation.mutate(projectId);
  };

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
    admin: 'ADMINISTRACIÓN' // Only admin keeps title for accordion organization
  };

  // Exact sidebar structure from Sidebar.tsx
  const sidebarContexts = {
    organization: [
      { icon: Home, label: 'Resumen de la Organización', href: '/organization/dashboard' },
      { icon: ArrowRight, label: 'Ir al Proyecto', href: '#', onClick: () => handleNavigationWithAnimation('/project/dashboard', 'project', 'left') },
      { type: 'divider' },
      { icon: FolderOpen, label: 'Proyectos', href: '/organization/projects' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: CheckSquare, label: 'Tareas', href: '/tasks' },
    ],
    project: [
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Organización', href: '#', onClick: () => handleNavigationWithAnimation('/organization/dashboard', 'organization', 'right') },
      { type: 'divider' },
      { icon: Database, label: 'Datos Básicos', href: '#', onClick: () => handleNavigationWithAnimation('/project/basic-data', 'data', 'left') },
      { icon: FolderOpen, label: 'Diseño', href: '#', onClick: () => handleNavigationWithAnimation('/design/dashboard', 'design', 'left') },
      { icon: Building, label: 'Obra', href: '#', onClick: () => handleNavigationWithAnimation('/construction/dashboard', 'construction', 'left') },
      { icon: DollarSign, label: 'Finanzas', href: '#', onClick: () => handleNavigationWithAnimation('/finances/dashboard', 'finances', 'left') },
      { icon: Users, label: 'Comercialización', href: '#', onClick: () => handleNavigationWithAnimation('/commercialization/dashboard', 'commercialization', 'left'), restricted: true },
      { icon: Handshake, label: 'Post-Venta', href: '#', onClick: () => handleNavigationWithAnimation('/postsale/dashboard', 'postsale', 'left'), restricted: true },
    ],
    design: [
      { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => handleNavigationWithAnimation('/project/dashboard', 'project', 'right') },
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
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => handleNavigationWithAnimation('/project/dashboard', 'project', 'right') },
      { type: 'divider' },
      { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
      { icon: Package, label: 'Materiales', href: '/construction/materials' },
      { icon: FileText, label: 'Bitácora', href: '/construction/logs' },
      { icon: Users, label: 'Personal', href: '/construction/personnel' },
      { icon: Images, label: 'Galería', href: '/construction/gallery' },
    ],
    finances: [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => handleNavigationWithAnimation('/project/dashboard', 'project', 'right') },
      { type: 'divider' },
      { icon: DollarSign, label: 'Movimientos', href: '/finances/movements' },
      { icon: CreditCard, label: 'Aportes', href: '/finances/installments' },
      { icon: Settings, label: 'Preferencias de Finanzas', href: '/finances/preferences' },
    ],
    commercialization: [
      { icon: Home, label: 'Resumen de Comercialización', href: '/commercialization/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => handleNavigationWithAnimation('/project/dashboard', 'project', 'right') },
      { type: 'divider' },
      { icon: Building, label: 'Listado de unidades', href: '/commercialization/unidades' },
      { icon: Users, label: 'Clientes interesados', href: '/commercialization/clientes' },
      { icon: FileText, label: 'Estadísticas de venta', href: '/commercialization/estadisticas' },
    ],
    data: [
      { icon: Database, label: 'Resumen de Datos', href: '/project/basic-data' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => handleNavigationWithAnimation('/project/dashboard', 'project', 'right') },
      { type: 'divider' },
      { icon: Database, label: 'Datos Básicos', href: '/project/basic-data' },
    ],
    postsale: [
      { icon: Handshake, label: 'Resumen de Post-Venta', href: '/postsale/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => handleNavigationWithAnimation('/project/dashboard', 'project', 'right') },
      { type: 'divider' },
    ],
    admin: [
      { icon: Home, label: 'Resumen de Administración', href: '/admin/dashboard' },
      { type: 'divider' },
      {
        label: 'Comunidad',
        isAccordion: true,
        expanded: expandedAccordion === 'comunidad',
        onToggle: () => toggleAccordion('comunidad'),
        items: [
          { icon: Building, label: 'Organizaciones', href: '/admin/organizations' },
          { icon: Users, label: 'Usuarios', href: '/admin/users' },
        ]
      },
      {
        label: 'Tareas',
        isAccordion: true,
        expanded: expandedAccordion === 'tareas',
        onToggle: () => toggleAccordion('tareas'),
        items: [
          { icon: CheckSquare, label: 'Tareas', href: '/admin/tasks' },
          { icon: CheckSquare, label: 'Tareas Generadas', href: '/admin/generated-tasks' },
          { icon: FileText, label: 'Plantillas de Tareas', href: '/admin/task-templates' },
          { icon: Settings, label: 'Parámetros', href: '/admin/task-parameters' },
        ]
      },
      {
        label: 'Materiales',
        isAccordion: true,
        expanded: expandedAccordion === 'materiales',
        onToggle: () => toggleAccordion('materiales'),
        items: [
          { icon: Package, label: 'Materiales', href: '/admin/materials' },
          { icon: FileText, label: 'Categorías de Materiales', href: '/admin/material-categories' },
        ]
      },
    ]
  };

  const navigationItems = sidebarContexts[currentSidebarContext as keyof typeof sidebarContexts] || sidebarContexts.organization;

  const menuContent = (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      {/* Overlay transparente como en modales - responde al theme */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70" 
        onClick={onClose}
      />
      
      {/* Menu Container - posicionado correctamente */}
      <div className="absolute top-16 left-0 right-0 bottom-0 flex flex-col" style={{ backgroundColor: 'var(--sidebar-background)' }}>

        {/* Navigation Menu - usando variables sidebar */}
        <div className="flex-1 px-0 py-0 overflow-y-auto">
        <nav className={cn(
          "space-y-1 transition-all duration-300 ease-in-out",
          isAnimating && animationDirection === 'left' && "transform translate-x-full opacity-0",
          isAnimating && animationDirection === 'right' && "transform -translate-x-full opacity-0",
          !isAnimating && "transform translate-x-0 opacity-100"
        )}>
          {navigationItems.map((item: any, index: number) => (
            <div key={`${item.label || 'divider'}-${index}`}>
              {/* Divider */}
              {item.type === 'divider' ? (
                <div className="mx-3 my-3 border-t border-[var(--menues-border)]" />
              ) : (
                <>
                  {/* Main Button with potential restriction */}
                  {item.restricted ? (
                    <CustomRestricted reason="coming_soon">
                      <button
                        onClick={item.isAccordion ? item.onToggle : (item.onClick || (() => handleNavigation(item.href)))}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        style={{
                          color: location === item.href ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
                          backgroundColor: location === item.href ? 'var(--sidebar-accent)' : 'transparent'
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        {item.isAccordion ? (
                          <div className="ml-auto">
                            {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        ) : item.hasChevron ? (
                          <div className="ml-auto">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        ) : null}
                      </button>
                    </CustomRestricted>
                  ) : (
                    <button
                      onClick={item.isAccordion ? item.onToggle : (item.onClick || (() => handleNavigation(item.href)))}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      style={{
                        color: location === item.href ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
                        backgroundColor: location === item.href ? 'var(--sidebar-accent)' : 'transparent'
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {item.isAccordion ? (
                        <div className="ml-auto">
                          {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      ) : item.hasChevron ? (
                        <div className="ml-auto">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      ) : null}
                    </button>
                  )}

                  {/* Accordion content */}
                  {item.isAccordion && item.expanded && item.items && (
                    <div className="mt-0 space-y-0">
                      {item.items.map((subItem: any, subIndex: number) => (
                        <button
                          key={subIndex}
                          onClick={() => handleNavigation(subItem.href)}
                          className="flex w-full items-center gap-3 px-8 py-2 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          style={{
                            color: location === subItem.href ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
                            backgroundColor: location === subItem.href ? 'var(--sidebar-accent)' : 'transparent',
                            opacity: 0.8
                          }}
                        >
                          <subItem.icon className="h-4 w-4" />
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>
        </div>

        {/* Footer con selectores - usando variables sidebar */}
        <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--sidebar-border)' }}>
          {/* Organization Selector */}
          <div className="relative">
            <button
              onClick={() => setExpandedOrgSelector(!expandedOrgSelector)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg border transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              style={{
                color: 'var(--sidebar-foreground)',
                backgroundColor: 'transparent',
                borderColor: 'var(--sidebar-border)'
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building className="h-4 w-4 flex-shrink-0" />
                <span className="truncate font-medium">
                  {currentOrganization?.name || 'Seleccionar Organización'}
                </span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", expandedOrgSelector && "rotate-180")} />
            </button>

            {expandedOrgSelector && (
              <div className="absolute bottom-full left-0 right-0 mb-2 max-h-32 overflow-y-auto scrollbar-hide space-y-1 rounded-lg p-2 shadow-lg" style={{ backgroundColor: 'var(--sidebar-background)', border: `1px solid var(--sidebar-border)`, zIndex: 10000 }}>
                {sortedOrganizations.map((org: any) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrganizationSelect(org.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    style={{
                      color: 'var(--sidebar-foreground)',
                      backgroundColor: org.id === currentOrganization?.id ? 'var(--sidebar-accent)' : 'transparent'
                    }}
                  >
                    <span className="truncate">{org.name}</span>
                    {org.id === currentOrganization?.id && (
                      <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Project Selector */}
          <div className="relative">
            <button
              onClick={() => setExpandedProjectSelector(!expandedProjectSelector)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg border transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              style={{
                color: 'var(--sidebar-foreground)',
                backgroundColor: 'transparent',
                borderColor: 'var(--sidebar-border)'
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="h-4 w-4 flex-shrink-0" />
                <span className="truncate font-medium">
                  {effectiveCurrentProject 
                    ? projectsData?.find((p: any) => p.id === effectiveCurrentProject)?.name || 'Sin proyecto'
                    : 'Seleccionar Proyecto'
                  }
                </span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", expandedProjectSelector && "rotate-180")} />
            </button>

            {expandedProjectSelector && (
              <div className="absolute bottom-full left-0 right-0 mb-2 max-h-32 overflow-y-auto scrollbar-hide space-y-1 rounded-lg p-2 shadow-lg" style={{ backgroundColor: 'var(--sidebar-background)', border: `1px solid var(--sidebar-border)`, zIndex: 10000 }}>
                {projectsData?.map((project: any) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    style={{
                      color: 'var(--sidebar-foreground)',
                      backgroundColor: project.id === effectiveCurrentProject ? 'var(--sidebar-accent)' : 'transparent'
                    }}
                  >
                    <span className="truncate">{project.name}</span>
                    {project.id === effectiveCurrentProject && (
                      <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}