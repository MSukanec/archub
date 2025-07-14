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
  Package2,
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
  CreditCard,
  HandCoins,
  HardHat,
  Brush,
  NotebookPen,
  FileImage,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useProjects } from "@/hooks/use-projects";
import CustomRestricted from "@/components/ui-custom/CustomRestricted";

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
      // Cambio inmediato sin animación
      setSidebarContext(newContext as any);
      navigate(href);
      // Scroll to top on mobile navigation
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else {
      // Para navegación normal (sin cambio de contexto), cerrar menú
      if (newContext) {
        setSidebarContext(newContext as any);
      }
      navigate(href);
      onClose();
      // Scroll to top on mobile navigation
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  const handleNavigation = (href: string, newContext?: string) => {
    if (newContext) {
      // Si hay cambio de contexto, no cerrar menú
      setSidebarContext(newContext as any);
      navigate(href);
      // Scroll to top on mobile navigation
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else {
      // Si no hay cambio de contexto, cerrar menú
      navigate(href);
      onClose();
      // Scroll to top on mobile navigation
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  // Function to check if a button is active based on current location
  const isButtonActive = (href: string) => {
    if (!href || href === '#') return false;
    // Special case for organization dashboard - should be active when on /dashboard or /organization/dashboard
    if (href === '/organization/dashboard') {
      return location === '/organization/dashboard' || location === '/dashboard';
    }
    return location === href || location.startsWith(href + '/');
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

  // Mobile menu principal - exactamente igual que desktop sidebar
  const mainMenuItems = [
    { 
      id: 'organizacion', 
      icon: Building, 
      label: 'Organización', 
      defaultRoute: '/organization/dashboard',
      isActive: currentSidebarContext === 'organization' || location.startsWith('/organization') || location === '/dashboard' || location === '/tasks'
    },
    { 
      id: 'proyecto', 
      icon: FolderOpen, 
      label: 'Proyecto', 
      defaultRoute: '/project/dashboard',
      isActive: currentSidebarContext === 'project' || location.startsWith('/project')
    },
    { 
      id: 'obra', 
      icon: HardHat, 
      label: 'Obra', 
      defaultRoute: '/construction/dashboard',
      isActive: currentSidebarContext === 'construction' || location.startsWith('/construction')
    },
    { 
      id: 'finanzas', 
      icon: DollarSign, 
      label: 'Finanzas', 
      defaultRoute: '/finances/dashboard',
      isActive: currentSidebarContext === 'finances' || location.startsWith('/finances')
    },
    { 
      id: 'diseno', 
      icon: Brush, 
      label: 'Diseño', 
      defaultRoute: '/design/dashboard',
      isActive: currentSidebarContext === 'design' || location.startsWith('/design'),
      restricted: true
    },
    { 
      id: 'comercializacion', 
      icon: Handshake, 
      label: 'Comercialización', 
      defaultRoute: '/commercialization/dashboard',
      isActive: currentSidebarContext === 'commercialization' || location.startsWith('/commercialization'),
      restricted: true
    },
    { 
      id: 'post-venta', 
      icon: CreditCard, 
      label: 'Post-Venta', 
      defaultRoute: '/postsale/dashboard',
      isActive: currentSidebarContext === 'postsale' || location.startsWith('/postsale'),
      restricted: true
    }
  ];

  // Submenus para cada sección principal (igual que SidebarSubmenu.tsx)
  const submenuContent = {
    organizacion: [
      { icon: Home, label: 'Resumen de Organización', href: '/organization/dashboard' },
      { icon: FolderOpen, label: 'Proyectos', href: '/organization/projects' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: CheckSquare, label: 'Tareas', href: '/tasks' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Database, label: 'Datos Básicos', href: '/organization/basic-data' },
      { icon: Settings, label: 'Preferencias', href: '/organization/preferences' },
    ],
    proyecto: [
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard' },
      { icon: NotebookPen, label: 'Datos Básicos', href: '/project/basic-data' },
      { icon: Users, label: 'Clientes', href: '/project/clients' },
      { icon: FileImage, label: 'Documentación', href: '/project/documentation' },
      { icon: Images, label: 'Galería', href: '/project/gallery' },
    ],
    obra: [
      { icon: Home, label: 'Resumen de Obra', href: '/construction/dashboard' },
      { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
      { icon: Package, label: 'Materiales', href: '/construction/materials' },
      { icon: FileText, label: 'Bitácora', href: '/construction/logs' },
      { icon: Users, label: 'Asistencia', href: '/construction/personnel' },
    ],
    finanzas: [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
      { icon: DollarSign, label: 'Movimientos', href: '/finances/movements' },
      { icon: HandCoins, label: 'Compromisos de Pago', href: '/finances/installments' },
    ],
    diseno: [
      { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard' },
      { icon: Calendar, label: 'Cronograma', href: '/design/timeline', restricted: true },
      { icon: Layout, label: 'Tablero', href: '/design/board', restricted: true },
      { icon: Calculator, label: 'Cómputo', href: '/design/compute', restricted: true },
      { icon: FileCode, label: 'Datos', href: '/design/data', restricted: true },
      { icon: History, label: 'Preferencias de Diseño', href: '/design/preferences', restricted: true },
    ],
    comercializacion: [
      { icon: Home, label: 'Resumen de Comercialización', href: '/commercialization/dashboard' },
      { icon: Building, label: 'Listado de unidades', href: '/commercialization/unidades' },
      { icon: Users, label: 'Clientes interesados', href: '/commercialization/clientes' },
      { icon: FileText, label: 'Estadísticas de venta', href: '/commercialization/estadisticas' },
    ],
    'post-venta': [
      { icon: Home, label: 'Resumen de Post-Venta', href: '/postsale/dashboard' },
    ],
    admin: [
      { icon: Home, label: 'Panel de Administración', href: '/admin/dashboard' },
      { icon: CheckSquare, label: 'Tareas Generadas', href: '/admin/generated-tasks' },
      { icon: Package2, label: 'Parámetros de Tareas', href: '/admin/task-parameters' },
      { icon: Package, label: 'Categorías de Tareas', href: '/admin/task-categories' },
      { icon: Users, label: 'Usuarios', href: '/admin/users' },
      { icon: Crown, label: 'Organizaciones', href: '/admin/organizations' },
      { icon: Shield, label: 'Roles', href: '/admin/roles' },
      { icon: Package, label: 'Materiales', href: '/admin/materials' },
      { icon: FileText, label: 'Categorías de Materiales', href: '/admin/material-categories' },
    ]
  };

  // Agregar botón de administración después del menu principal
  if (isAdmin) {
    mainMenuItems.push({
      id: 'admin',
      icon: Shield,
      label: 'Administración',
      defaultRoute: '/admin/dashboard',
      isActive: currentSidebarContext === 'admin' || location.startsWith('/admin')
    });
  }

  // Agregar botón de perfil al final
  mainMenuItems.push({
    id: 'perfil',
    icon: UserCircle,
    label: 'Mi Perfil',
    defaultRoute: '/profile',
    isActive: currentSidebarContext === 'perfil' || location === '/profile'
  });

  // Estado para determinar si estamos en menu principal o submenu
  const [currentView, setCurrentView] = useState<'main' | string>('main');
  
  // Función para manejar navegación desde menu principal a submenu
  const handleMenuItemClick = (menuId: string, defaultRoute: string) => {
    setCurrentView(menuId);
    setSidebarContext(menuId as any);
    navigate(defaultRoute);
  };
  
  // Función para volver al menu principal
  const handleBackToMain = () => {
    setCurrentView('main');
  };

  const menuContent = (
    <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9999 }} onClick={onClose}>
      <div 
        className="fixed bottom-0 left-0 right-0 rounded-t-xl"
        style={{ 
          backgroundColor: 'var(--menues-bg)', 
          height: '70vh',
          marginTop: '30vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con botón de cierre */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--menues-border)]">
          {currentView !== 'main' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToMain}
              className="text-[var(--menues-fg)]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[var(--menues-fg)]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-4 py-2 overflow-y-auto">
          {currentView === 'main' ? (
            // Menu principal - solo botones principales
            <nav className="space-y-2">
              {mainMenuItems.map((item) => (
                <div key={item.id}>
                  {item.restricted ? (
                    <CustomRestricted reason="coming_soon" functionName={item.label}>
                      <button
                        className="flex w-full items-center gap-3 px-3 py-3 text-left text-base font-medium rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] opacity-50"
                        disabled
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </button>
                    </CustomRestricted>
                  ) : (
                    <button
                      onClick={() => handleMenuItemClick(item.id, item.defaultRoute)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-3 text-left text-base font-medium rounded-xl transition-colors",
                        item.isActive 
                          ? "bg-[hsl(76,100%,40%)] text-white" 
                          : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)]"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </button>
                  )}
                </div>
              ))}
            </nav>
          ) : (
            // Submenu - mostrar opciones de la sección seleccionada
            <nav className="space-y-1">
              {submenuContent[currentView as keyof typeof submenuContent]?.map((item, index) => (
                <div key={index}>
                  {item.restricted ? (
                    <CustomRestricted reason="coming_soon" functionName={item.label}>
                      <button
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium rounded-lg text-[var(--menues-fg)] opacity-50"
                        disabled
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    </CustomRestricted>
                  ) : (
                    <button
                      onClick={() => {
                        navigate(item.href);
                        onClose();
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium rounded-lg transition-colors",
                        location === item.href 
                          ? "bg-[hsl(76,100%,40%)] text-white" 
                          : "text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)]"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  )}
                </div>
              )) || (
                <div className="text-center py-4 text-[var(--menues-fg)] opacity-60">
                  No hay opciones disponibles
                </div>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}