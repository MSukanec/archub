import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface MobileMenuProps {
  onClose: () => void;
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [expandedOrgSelector, setExpandedOrgSelector] = useState(false);
  const [expandedProjectSelector, setExpandedProjectSelector] = useState(false);
  const queryClient = useQueryClient();

  const currentOrganization = userData?.organization;
  const currentProject = userData?.preferences?.last_project_id;
  const isAdmin = userData?.role?.name === "super_admin" || false;

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

  const handleNavigation = (href: string, newContext?: string) => {
    if (newContext) {
      setSidebarContext(newContext as any);
    }
    navigate(href);
    onClose();
  };

  const handleOrganizationSelect = (organizationId: string) => {
    organizationMutation.mutate(organizationId);
  };

  const toggleAccordion = (key: string) => {
    setExpandedAccordion(prev => prev === key ? null : key);
  };

  // Exact sidebar structure from Sidebar.tsx
  const sidebarContexts = {
    organization: [
      { icon: Home, label: 'Resumen de la Organización', href: '/organization/dashboard' },
      { icon: ArrowRight, label: 'Ir al proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); onClose(); } },
      { icon: FolderOpen, label: 'Proyectos', href: '/proyectos' },
      { icon: Mail, label: 'Contactos', href: '/organization/contactos' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Building, label: 'Gestión de Organizaciones', href: '#', onClick: () => { setSidebarContext('organizations'); navigate('/organizations'); onClose(); } },
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
      { icon: ArrowLeft, label: 'Volver a Organización', href: '#', onClick: () => { setSidebarContext('organization'); navigate('/organization/dashboard'); onClose(); } },
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col w-full h-full" style={{ backgroundColor: 'var(--menues-bg)' }}>
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
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        <nav className="space-y-0.5">
          {navigationItems.map((item: any, index: number) => (
            <div key={`${item.label}-${index}`}>
              {/* Main Button */}
              <button
                onClick={item.isAccordion ? item.onToggle : (item.onClick || (() => handleNavigation(item.href)))}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors hover:bg-[var(--sidebar-hover-bg)]"
                style={{
                  color: 'var(--menues-fg)',
                  backgroundColor: 'transparent'
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.isAccordion && (
                  <div className="ml-auto">
                    {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                )}
              </button>
              
              {/* Accordion Children */}
              {item.isAccordion && item.expanded && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {item.children?.map((child: any, childIndex: number) => (
                    <button
                      key={`${child.label}-${childIndex}`}
                      onClick={() => handleNavigation(child.href)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-[var(--sidebar-hover-bg)]"
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
            </div>
          ))}
        </nav>
      </div>

      {/* Organization and Project Selectors - At the bottom */}
      <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: 'var(--menues-border)' }}>
        {/* Organization Selector */}
        <div>
          <div className="text-xs font-medium opacity-70 mb-2" style={{ color: 'var(--menues-fg)' }}>
            Organización activa:
          </div>
          <button
            onClick={() => setExpandedOrgSelector(!expandedOrgSelector)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--sidebar-hover-bg)]"
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
            <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
              {userData?.organizations?.map((org: any) => (
                <button
                  key={org.id}
                  onClick={() => handleOrganizationSelect(org.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors hover:opacity-80"
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

        {/* General Section */}
        <div className="space-y-1">
          <button
            onClick={() => handleNavigation('/perfil')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[var(--sidebar-hover-bg)]"
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[var(--sidebar-hover-bg)]"
            style={{ 
              color: 'var(--menues-fg)',
              backgroundColor: 'transparent'
            }}
          >
            <CheckSquare className="h-5 w-5" />
            <span className="text-sm font-medium">Tareas</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => handleNavigation('/admin/dashboard', 'admin')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[var(--sidebar-hover-bg)]"
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
    </div>
  );
}