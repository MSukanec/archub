import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Building,
  FolderOpen,
  UserCircle,
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
  History,
  Contact,
  Database,
  Layout,
  Images,
  Handshake,
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
    <div className="fixed inset-0 flex flex-col w-full h-full" style={{ backgroundColor: 'var(--menues-bg)', zIndex: 9999 }}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--menues-border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--menues-fg)' }}>
          {currentSidebarContext === 'organization' && 'Organización'}
          {currentSidebarContext === 'project' && 'Proyecto'}
          {currentSidebarContext === 'design' && 'Diseño'}
          {currentSidebarContext === 'construction' && 'Obra'}
          {currentSidebarContext === 'finances' && 'Finanzas'}
          {currentSidebarContext === 'commercialization' && 'Comercialización'}
          {currentSidebarContext === 'data' && 'Datos Básicos'}
          {currentSidebarContext === 'postsale' && 'Post-Venta'}
          {currentSidebarContext === 'admin' && 'Administración'}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-transparent"
          style={{ color: 'var(--menues-fg)' }}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Menu - Flex grow para ocupar el espacio disponible */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        <nav className={cn(
          "space-y-0.5 transition-all duration-300 ease-in-out",
          isAnimating && animationDirection === 'left' && "transform translate-x-full opacity-0",
          isAnimating && animationDirection === 'right' && "transform -translate-x-full opacity-0",
          !isAnimating && "transform translate-x-0 opacity-100"
        )}>
          {/* Context Title */}
          {sidebarContextTitles[currentSidebarContext] && (
            <div className="px-3 py-2 mb-2">
              <span className="text-xs font-medium text-[var(--menues-fg)] opacity-60">
                {sidebarContextTitles[currentSidebarContext]}
              </span>
            </div>
          )}
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
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
                        style={{
                          color: 'var(--menues-fg)',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <item.icon className="h-5 w-5" />
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
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
                      style={{
                        color: 'var(--menues-fg)',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <item.icon className="h-5 w-5" />
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
                    <div className="ml-6 mt-1 space-y-1">
                      {item.items.map((subItem: any, subIndex: number) => (
                        <button
                          key={subIndex}
                          onClick={() => handleNavigation(subItem.href)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
                          style={{
                            color: 'var(--menues-fg)',
                            backgroundColor: 'transparent'
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

      {/* Footer - Fijo en la parte inferior */}
      <div className="px-4 py-3 border-t relative" style={{ borderColor: 'var(--menues-border)' }}>
        {/* Organization and Project Selectors */}
        <div className="space-y-3 mb-4">
          {/* Organization Selector */}
          <div className="relative">
            <div className="text-xs font-medium opacity-70 mb-2" style={{ color: 'var(--menues-fg)' }}>
              Organización activa:
            </div>
            <button
              onClick={() => setExpandedOrgSelector(!expandedOrgSelector)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
              style={{
                color: 'var(--menues-fg)',
                backgroundColor: 'transparent',
                borderColor: 'var(--menues-border)'
              }}
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="truncate">{currentOrganization?.name || 'Sin organización'}</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", expandedOrgSelector && "rotate-180")} />
            </button>

            {expandedOrgSelector && (
              <div className="absolute bottom-full left-0 right-0 mb-2 max-h-32 overflow-y-auto scrollbar-hide space-y-1 bg-[var(--card-bg)] border border-[var(--menues-border)] rounded-lg p-2 shadow-lg" style={{ zIndex: 10000 }}>
                {sortedOrganizations.map((org: any) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrganizationSelect(org.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
                    style={{
                      color: 'var(--menues-fg)',
                      backgroundColor: org.id === currentOrganization?.id ? 'var(--accent)' : 'transparent',
                      opacity: org.id === currentOrganization?.id ? 1 : 0.8,
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
            <div className="text-xs font-medium opacity-70 mb-2" style={{ color: 'var(--menues-fg)' }}>
              Proyecto activo:
            </div>
            <button
              onClick={() => setExpandedProjectSelector(!expandedProjectSelector)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
              style={{
                color: 'var(--menues-fg)',
                backgroundColor: 'transparent',
                borderColor: 'var(--menues-border)'
              }}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <span className="truncate">
                  {effectiveCurrentProject 
                    ? projectsData?.find((p: any) => p.id === effectiveCurrentProject)?.name || 'Sin proyecto'
                    : 'Sin proyecto'
                  }
                </span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", expandedProjectSelector && "rotate-180")} />
            </button>

            {expandedProjectSelector && (
              <div className="absolute bottom-full left-0 right-0 mb-2 max-h-32 overflow-y-auto scrollbar-hide space-y-1 bg-[var(--card-bg)] border border-[var(--menues-border)] rounded-lg p-2 shadow-lg" style={{ zIndex: 10000 }}>
                {projectsData?.map((project: any) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
                    style={{
                      color: 'var(--menues-fg)',
                      backgroundColor: project.id === effectiveCurrentProject ? 'var(--accent)' : 'transparent',
                      opacity: project.id === effectiveCurrentProject ? 1 : 0.8,
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

        {/* Action Buttons Grid - Optimized height */}
        <div className={cn("h-10 grid gap-2 items-center", isAdmin ? "grid-cols-3" : "grid-cols-2")}>
          <button
            onClick={() => handleNavigation('/profile')}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
            style={{ 
              color: 'var(--menues-fg)',
              backgroundColor: 'transparent'
            }}
          >
            <UserCircle className="h-4 w-4" />
            <span className="text-xs font-medium mt-0.5">Perfil</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/changelog')}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
            style={{ 
              color: 'var(--menues-fg)',
              backgroundColor: 'transparent'
            }}
          >
            <History className="h-4 w-4" />
            <span className="text-xs font-medium mt-0.5">Changelog</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => handleNavigation('/admin/dashboard', 'admin')}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
              style={{ 
                color: 'var(--menues-fg)',
                backgroundColor: 'transparent'
              }}
            >
              <Shield className="h-4 w-4" />
              <span className="text-xs font-medium mt-0.5">Admin</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}