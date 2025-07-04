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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useProjects } from "@/hooks/use-projects";

interface MobileMenuProps {
  onClose: () => void;
  isOpen: boolean;
}

export function MobileMenu({ onClose }: MobileMenuProps): React.ReactPortal {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const [expandedOrgSelector, setExpandedOrgSelector] = useState(false);
  const [expandedProjectSelector, setExpandedProjectSelector] = useState(false);
  const queryClient = useQueryClient();

  const currentOrganization = userData?.organization;
  const currentProject = userData?.preferences?.last_project_id;
  const isAdmin = userData?.role?.name === "super_admin" || false;
  
  // Fetch real projects data
  const { data: projectsData } = useProjects(currentOrganization?.id);
  
  // Find current project or fall back to first available project
  const foundCurrentProject = projectsData?.find((p: any) => p.id === currentProject);
  const effectiveCurrentProject = foundCurrentProject ? currentProject : projectsData?.[0]?.id;
  
  // Sort organizations: current first, then others
  const sortedOrganizations = userData?.organizations ? [
    ...userData.organizations.filter(org => org.id === userData?.preferences?.last_organization_id),
    ...userData.organizations.filter(org => org.id !== userData?.preferences?.last_organization_id)
  ] : [];
  
  // Sort projects: effective current first, then others
  const sortedProjects = projectsData ? [
    ...projectsData.filter(p => p.id === effectiveCurrentProject),
    ...projectsData.filter(p => p.id !== effectiveCurrentProject)
  ] : [];

  // Organization selection mutation
  const organizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('No user preferences available');
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('id', userData.preferences.id);

      if (error) throw error;
      return organizationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setExpandedOrgSelector(false);
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

  const handleNavigation = (href: string, newContext?: string) => {
    if (newContext) {
      setSidebarContext(newContext as any);
    }
    navigate(href);
    onClose();
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

  // Context titles
  const sidebarContextTitles = {
    organization: null, // No title for organization context
    organizations: null,
    project: 'PROYECTO',
    design: 'DISEÑO',
    construction: 'OBRA',
    finances: 'FINANZAS',
    commercialization: 'COMERCIALIZACIÓN',
    admin: 'ADMINISTRACIÓN'
  };

  // Exact sidebar structure from Sidebar.tsx
  const sidebarContexts = {
    organization: [
      { icon: Home, label: 'Resumen de la Organización', href: '/organization/dashboard' },
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard', onClick: () => navigate('/project/dashboard') },
      { type: 'divider' },
      { icon: FolderOpen, label: 'Diseño', href: '#', onClick: () => { setSidebarContext('design'); navigate('/design/timeline'); }, hasChevron: true },
      { icon: Building, label: 'Obra', href: '#', onClick: () => { setSidebarContext('construction'); navigate('/construction/dashboard'); }, hasChevron: true },
      { icon: DollarSign, label: 'Finanzas', href: '#', onClick: () => { setSidebarContext('finances'); navigate('/finances/dashboard'); }, hasChevron: true },
      { icon: Users, label: 'Comercialización', href: '#', onClick: () => { setSidebarContext('commercialization'); navigate('/commercialization/dashboard'); }, hasChevron: true },
      { icon: ArrowLeft, label: 'Volver a Organización', href: '#', onClick: () => { setSidebarContext('organizations'); navigate('/organization/dashboard'); } },
    ],
    project: [
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard' },
      { 
        icon: FolderOpen, 
        label: 'Diseño', 
        isAccordion: true, 
        expanded: expandedAccordion === 'project-diseno',
        onToggle: () => toggleAccordion('project-diseno'),
        children: [
          { icon: Calendar, label: 'Cronograma', href: '/design/timeline' }
        ]
      },
      { 
        icon: Building, 
        label: 'Obra', 
        href: '#', 
        isAccordion: true,
        expanded: expandedAccordion === 'obra',
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
        expanded: expandedAccordion === 'finanzas',
        onToggle: () => toggleAccordion('finanzas'),
        children: [
          { icon: DollarSign, label: 'Movimientos', href: '/finanzas/movimientos' },
          { icon: Settings, label: 'Preferencias de Finanzas', href: '/finanzas/preferencias' }
        ]
      },
      { icon: CheckSquare, label: 'Gestión de Tareas', href: '/tasks' },
      { icon: ArrowLeft, label: 'Volver a Organización', href: '#', onClick: () => { setSidebarContext('organization'); navigate('/organization/dashboard'); } },
    ],
    finances: [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
      { icon: DollarSign, label: 'Movimientos', href: '/finances/movements' },
      { icon: Settings, label: 'Preferencias de Finanzas', href: '/finances/preferences' },
      { icon: ArrowLeft, label: 'Volver a Organización', href: '#', onClick: () => { setSidebarContext('organization'); navigate('/organization/dashboard'); } },
    ],
    admin: [
      { icon: Home, label: 'Resumen de Administración', href: '/admin/dashboard' },
      { 
        icon: Users, 
        label: 'Comunidad', 
        isAccordion: true, 
        expanded: expandedAccordion === 'admin-comunidad',
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
        expanded: expandedAccordion === 'admin-tareas',
        onToggle: () => toggleAccordion('admin-tareas'),
        children: [
          { icon: CheckSquare, label: 'Tareas', href: '/admin/tasks' },
          { icon: CheckSquare, label: 'Tareas Generadas', href: '/admin/generated-tasks' },
          { icon: CheckSquare, label: 'Plantillas de Tareas', href: '/admin/task-templates' },
          { icon: Settings, label: 'Parámetros', href: '/admin/task-parameters' }
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
          { icon: Settings, label: 'Categorías de Materiales', href: '/admin/material-categories' }
        ]
      }
    ]
  };

  const navigationItems = sidebarContexts[currentSidebarContext as keyof typeof sidebarContexts] || sidebarContexts.organization;

  const menuContent = (
    <div className="fixed inset-0 flex flex-col w-full h-full" style={{ backgroundColor: 'var(--menues-bg)', zIndex: 9999 }}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--menues-border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--menues-fg)' }}>
          Archub
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

      {/* Navigation Menu */}
      <div className="px-4 py-3 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Context Title */}
        <div className="mb-4">
          <h2 className="text-sm font-medium opacity-70" style={{ color: 'var(--menues-fg)' }}>
            {currentSidebarContext === 'organization' && 'Organización'}
            {currentSidebarContext === 'project' && 'Proyecto'}
            {currentSidebarContext === 'design' && 'Diseño'}
            {currentSidebarContext === 'construction' && 'Obra'}
            {currentSidebarContext === 'finances' && 'Finanzas'}
            {currentSidebarContext === 'commercialization' && 'Comercialización'}
            {currentSidebarContext === 'admin' && 'Administración'}
          </h2>
        </div>

        <nav className="space-y-0.5">
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
                  {/* Main Button */}
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
                  
                  {/* Accordion Children */}
                  {item.isAccordion && item.expanded && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      {item.children?.map((child: any, childIndex: number) => (
                        <button
                          key={`${child.label}-${childIndex}`}
                          onClick={() => handleNavigation(child.href)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
                          style={{
                            color: 'var(--menues-fg)',
                            backgroundColor: 'transparent',
                            opacity: 0.9
                          }}
                        >
                          <child.icon className="h-4 w-4" />
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* General Section - After navigation */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--menues-border)' }}>
          <div className="mb-4">
            <h3 className="text-sm font-medium opacity-70" style={{ color: 'var(--menues-fg)' }}>
              General
            </h3>
          </div>
          
          <div className="space-y-0.5">
            <button
              onClick={() => handleNavigation('/perfil')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
              style={{ 
                color: 'var(--menues-fg)',
                backgroundColor: 'transparent'
              }}
            >
              <UserCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Mi Perfil</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/tasks')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
              style={{ 
                color: 'var(--menues-fg)',
                backgroundColor: 'transparent'
              }}
            >
              <CheckSquare className="h-5 w-5" />
              <span className="text-sm font-medium">Tareas</span>
            </button>

            <button
              onClick={() => handleNavigation('/changelog')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
              style={{ 
                color: 'var(--menues-fg)',
                backgroundColor: 'transparent'
              }}
            >
              <History className="h-5 w-5" />
              <span className="text-sm font-medium">Changelog</span>
            </button>
            
            {isAdmin && (
              <button
                onClick={() => handleNavigation('/admin/dashboard', 'admin')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
                style={{ 
                  color: 'var(--menues-fg)',
                  backgroundColor: 'transparent'
                }}
              >
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">Administración</span>
              </button>
            )}
          </div>
        </div>

        {/* Organization and Project Selectors - Inside scrollable area */}
        <div className="mt-6 pt-4 border-t space-y-3" style={{ borderColor: 'var(--menues-border)' }}>
          {/* Organization Selector */}
          <div>
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
              <div className="mt-2 max-h-32 overflow-y-auto scrollbar-hide space-y-1">
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
          <div>
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
              <div className="mt-2 max-h-32 overflow-y-auto scrollbar-hide space-y-1">
                {sortedProjects && sortedProjects.length > 0 ? sortedProjects.map((project: any) => (
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
                )) : (
                  <div className="px-3 py-2 text-sm opacity-60" style={{ color: 'var(--menues-fg)' }}>
                    No hay proyectos disponibles
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );

  return createPortal(menuContent, document.body);
}