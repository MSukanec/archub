import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Building,
  FolderOpen,
  Folder,
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
  BookOpen,
  HandCoins,
  HardHat,
  Brush,
  NotebookPen,
  FileImage,
  FileCode,
  Crown,
  User,
  BarChart3,
  Handshake,
  Search,
  Tag,
  TrendingUp,
  ListTodo,
  Library,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useMobileMenuStore } from "./useMobileMenuStore";
import { useProjects } from "@/hooks/use-projects";
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted";
import { useProjectContext } from "@/stores/projectContext";

interface MobileMenuProps {
  onClose: () => void;
  isOpen: boolean;
}

export function MobileMenu({ onClose }: MobileMenuProps): React.ReactPortal {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { currentSidebarContext, setSidebarContext, setActiveSidebarSection } = useNavigationStore();

  const [expandedProjectSelector, setExpandedProjectSelector] = useState(false);

  // Estado local para forzar re-render
  const [isClosing, setIsClosing] = useState(false);
  
  // Estado para los 3 niveles del menu móvil
  const [currentLevel, setCurrentLevel] = useState<'main' | 'section' | 'subsection'>('main');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  
  // Detectar automáticamente la sección basada en la ruta actual
  const getInitialState = () => {
    if (location === '/dashboard') return { level: 'main', section: null, subsection: null };
    if (location.startsWith('/organization')) return { level: 'section', section: 'organization', subsection: null };
    if (location.startsWith('/professional/library')) return { level: 'section', section: 'library', subsection: null };
    if (location.startsWith('/proveedor')) return { level: 'section', section: 'provider', subsection: null };
    if (location.startsWith('/admin')) return { level: 'section', section: 'admin', subsection: null };
    
    // Para proyecto, detectar subsección
    if (location.startsWith('/design')) return { level: 'subsection', section: 'project', subsection: 'diseno' };
    if (location.startsWith('/construction')) return { level: 'subsection', section: 'project', subsection: 'construccion' };
    if (location.startsWith('/finances')) return { level: 'subsection', section: 'project', subsection: 'finanzas' };
    if (location.startsWith('/project')) return { level: 'section', section: 'project', subsection: null };
    
    return { level: 'main', section: null, subsection: null };
  };
  
  // Inicializar estado basado en ruta actual
  useEffect(() => {
    const initialState = getInitialState();
    setCurrentLevel(initialState.level as any);
    setSelectedSection(initialState.section);
    setSelectedSubsection(initialState.subsection);
  }, [location]);
  
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
  
  // Usar project context en lugar de last_project_id directamente
  const { selectedProjectId, setSelectedProject, setCurrentOrganization } = useProjectContext();
  const effectiveCurrentProject = selectedProjectId;
  
  // Obtener el proyecto actual para mostrar su nombre
  const currentProject = projectsData?.find((p: any) => p.id === selectedProjectId);
  const currentProjectName = currentProject?.name || "Seleccionar proyecto";
  const isAdmin = useIsAdmin();

  // Organization selection mutation - Updated to use new system
  const organizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('No user preferences available');
      }

      // Update organization in user_preferences (this stays the same)
      const { error: orgError } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('id', userData.preferences.id);

      if (orgError) throw orgError;

      // Get projects for the new organization
      const { data: newOrgProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1);

      const firstProjectId = newOrgProjects?.[0]?.id || null;

      // Check if user already has preferences for this organization
      const { data: existingOrgPrefs } = await supabase
        .from('user_organization_preferences')
        .select('last_project_id')
        .eq('user_id', userData.user.id)
        .eq('organization_id', organizationId)
        .single();

      let projectToSelect = firstProjectId;

      if (existingOrgPrefs?.last_project_id) {
        // Verify the saved project still exists
        const projectExists = newOrgProjects?.some(p => p.id === existingOrgPrefs.last_project_id);
        if (projectExists) {
          projectToSelect = existingOrgPrefs.last_project_id;
        }
      }

      // If we have a project to select, save it in organization preferences
      if (projectToSelect) {
        await supabase
          .from('user_organization_preferences')
          .upsert(
            {
              user_id: userData.user.id,
              organization_id: organizationId,
              last_project_id: projectToSelect,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id,organization_id' }
          );
      }

      return { organizationId, firstProjectId: projectToSelect };
    },
    onSuccess: ({ organizationId, firstProjectId }) => {
      // Usar el nuevo método setCurrentOrganization que automáticamente carga el último proyecto
      setCurrentOrganization(organizationId);
      
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
      setExpandedProjectSelector(false);
      setSidebarContext('organization');
      setActiveSidebarSection('organizacion');
      navigate('/organization/dashboard');
    }
  });

  // Project selection mutation - Updated to use new system
  const projectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !userData?.organization?.id) {
        throw new Error('No user or organization available');
      }

      // Save project in organization preferences
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
      // Actualizar el project context y las preferencias
      setSelectedProject(projectId);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
      setExpandedProjectSelector(false);
    }
  });

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
    setSelectedProject(projectId);
    projectMutation.mutate(projectId);
  };

  // Definir contenido para cada nivel del menú móvil
  const mobileMenuContent = {
    // NIVEL 1: General
    main: [
      {
        id: 'dashboard',
        icon: Home,
        label: 'Dashboard',
        href: '/dashboard',
        action: 'navigate'
      },
      {
        id: 'organization',
        icon: Building,
        label: 'Organización',
        action: 'section'
      },
      {
        id: 'project',
        icon: FolderOpen,
        label: 'Proyecto',
        action: 'section'
      },
      {
        id: 'library',
        icon: Library,
        label: 'Biblioteca',
        action: 'section'
      },
      {
        id: 'provider',
        icon: Package,
        label: 'Proveedor',
        action: 'section'
      },
      ...(isAdmin ? [{
        id: 'admin',
        icon: Crown,
        label: 'Administración',
        action: 'section'
      }] : [])
    ],
    
    // NIVEL 2: Específico de sección
    sections: {
      organization: [
        { icon: Folder, label: 'Proyectos', href: '/organization/projects' },
        { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
        { icon: Users, label: 'Miembros', href: '/organization/members' },
        { icon: Database, label: 'Datos Básicos', href: '/organization/data' },
        { icon: Activity, label: 'Actividad', href: '/organization/activity' },
        { icon: Settings, label: 'Preferencias', href: '/organization/preferences' }
      ],
      project: [
        {
          id: 'diseno',
          icon: Brush,
          label: 'Diseño',
          action: 'subsection',
          restricted: true
        },
        {
          id: 'construccion',
          icon: HardHat,
          label: 'Construcción',
          action: 'subsection'
        },
        {
          id: 'finanzas',
          icon: DollarSign,
          label: 'Finanzas',
          action: 'subsection'
        },
        {
          id: 'recursos',
          icon: FolderOpen,
          label: 'Recursos',
          action: 'subsection'
        },
        { type: 'divider' }
      ],
      library: [
        { icon: CheckSquare, label: 'Tareas', href: '/professional/library/tasks' },
        { icon: Package2, label: 'Materiales', href: '/professional/library/materials' },
        { icon: Users, label: 'Mano de Obra', href: '/professional/library/labor' },
        { icon: TrendingUp, label: 'Costos Indirectos', href: '/professional/library/indirects' }
      ],
      provider: [
        { icon: Package, label: 'Productos', href: '/proveedor/productos' }
      ],
      admin: [
        { icon: Crown, label: 'Comunidad', href: '/admin/dashboard' },
        { icon: ListTodo, label: 'Tareas', href: '/admin/tasks' },
        { icon: Database, label: 'Materiales', href: '/admin/materials' },
        { icon: Settings, label: 'General', href: '/admin/general' }
      ]
    },
    
    // NIVEL 3: Subsecciones (solo para proyecto)
    subsections: {
      diseno: [
        { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard' }
      ],
      construccion: [
        { icon: Home, label: 'Resumen', href: '/construction/dashboard' },
        { icon: CheckSquare, label: 'Tareas', href: '/construction/tasks' },
        { icon: Users, label: 'Personal', href: '/construction/personnel' },
        { icon: Handshake, label: 'Subcontratos', href: '/construction/subcontracts' },
        { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
        { icon: Package2, label: 'Materiales', href: '/construction/materials' },
        { icon: FileText, label: 'Bitácora', href: '/construction/logs' }
      ],
      finanzas: [
        { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
        { icon: DollarSign, label: 'Movimientos', href: '/finances/movements' },
        { icon: Users, label: 'Clientes', href: '/finances/clients' },
        { icon: BarChart3, label: 'Análisis de Obra', href: '/finances/analysis', restricted: true },
        { icon: TrendingUp, label: 'Movimientos de Capital', href: '/finances/capital-movements', restricted: true }
      ],
      recursos: [
        { icon: FileText, label: 'Documentación', href: '/project/documentation' },
        { icon: Images, label: 'Galería', href: '/project/gallery' },
        { icon: Layout, label: 'Tablero', href: '/project/board' }
      ]
    }
  };

  // Función para obtener el título actual
  const getCurrentTitle = () => {
    if (currentLevel === 'main') return 'Menú Principal';
    
    if (currentLevel === 'section') {
      const titleMap = {
        'organization': 'Organización',
        'project': 'Proyecto',
        'library': 'Biblioteca', 
        'provider': 'Proveedor',
        'admin': 'Administración'
      };
      return titleMap[selectedSection as keyof typeof titleMap] || 'Menú';
    }
    
    if (currentLevel === 'subsection') {
      const titleMap = {
        'diseno': 'Diseño',
        'construccion': 'Construcción',
        'finanzas': 'Finanzas',
        'recursos': 'Recursos'
      };
      return titleMap[selectedSubsection as keyof typeof titleMap] || 'Submenu';
    }
    
    return 'Menú';
  };
  
  // Función para manejar clicks en el nivel principal
  const handleMainLevelClick = (item: any) => {
    if (item.action === 'navigate') {
      navigate(item.href);
      handleCloseMenu();
    } else if (item.action === 'section') {
      setCurrentLevel('section');
      setSelectedSection(item.id);
      setSelectedSubsection(null);
    }
  };
  
  // Función para manejar clicks en el nivel de sección
  const handleSectionLevelClick = (item: any) => {
    if (item.href) {
      navigate(item.href);
      handleCloseMenu();
    } else if (item.action === 'subsection') {
      setCurrentLevel('subsection');
      setSelectedSubsection(item.id);
    }
  };
  
  // Función para manejar clicks en el nivel de subsección
  const handleSubsectionLevelClick = (item: any) => {
    navigate(item.href);
    handleCloseMenu();
  };
  
  // Función para ir hacia atrás
  const handleBack = () => {
    if (currentLevel === 'subsection') {
      setCurrentLevel('section');
      setSelectedSubsection(null);
    } else if (currentLevel === 'section') {
      setCurrentLevel('main');
      setSelectedSection(null);
    }
  };

  const { closeMenu } = useMobileMenuStore();
  
  const handleCloseMenu = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeMenu();
    onClose();
  };

  // Función para renderizar el contenido actual
  const renderCurrentContent = () => {
    if (currentLevel === 'main') {
      return (
        <nav className="space-y-2">
          {mobileMenuContent.main.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMainLevelClick(item)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                (item.href && isButtonActive(item.href))
                  ? "bg-[hsl(76,100%,40%)] text-white" 
                  : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)]"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.action === 'section' && <ChevronRight className="h-4 w-4 ml-auto" />}
            </button>
          ))}
        </nav>
      );
    }
    
    if (currentLevel === 'section' && selectedSection) {
      const sectionItems = mobileMenuContent.sections[selectedSection as keyof typeof mobileMenuContent.sections];
      return (
        <nav className="space-y-2">
          {sectionItems?.map((item, index) => {
            // Si es un divisor, renderizar línea divisoria
            if ('type' in item && item.type === 'divider') {
              return (
                <div key={`divider-${index}`} className="h-px bg-gray-200 dark:bg-gray-700 my-3"></div>
              );
            }

            const isRestricted = 'restricted' in item && item.restricted;
            
            return (
              <div key={index}>
                {isRestricted ? (
                  <PlanRestricted reason="general_mode" functionName={item.label}>
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] opacity-50 shadow-button-normal"
                      disabled
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      {('action' in item && item.action === 'subsection') && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </button>
                  </PlanRestricted>
                ) : (
                  <button
                    onClick={() => handleSectionLevelClick(item)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                      (item.href && isButtonActive(item.href))
                        ? "bg-[hsl(76,100%,40%)] text-white" 
                        : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {('action' in item && item.action === 'subsection') && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      );
    }
    
    if (currentLevel === 'subsection' && selectedSubsection) {
      const subsectionItems = mobileMenuContent.subsections[selectedSubsection as keyof typeof mobileMenuContent.subsections];
      return (
        <nav className="space-y-2">
          {subsectionItems?.map((item, index) => {
            const isRestricted = 'restricted' in item && item.restricted;
            
            return (
              <div key={index}>
                {isRestricted ? (
                  <PlanRestricted reason="general_mode" functionName={item.label}>
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] opacity-50 shadow-button-normal"
                      disabled
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  </PlanRestricted>
                ) : (
                  <button
                    onClick={() => handleSubsectionLevelClick(item)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base font-medium rounded-xl transition-all duration-150 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
                      (item.href && isButtonActive(item.href))
                        ? "bg-[hsl(76,100%,40%)] text-white" 
                        : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      );
    }
    
    return null;
  };

  const menuContent = (
    <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9999 }} onClick={handleCloseMenu}>
      <div 
        className="fixed inset-0 flex flex-col overflow-hidden"
        style={{ 
          backgroundColor: 'var(--menues-bg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con título ARCHUB y botón de cierre */}
        <div className="flex justify-between items-center h-14 px-4 pr-6 border-b border-[var(--menues-border)]">
          <h1 className="text-lg font-semibold text-[var(--menues-fg)]">
            ARCHUB
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseMenu}
            className="text-[var(--menues-fg)] p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-4 py-2 overflow-y-auto">
          {/* Título de la sección actual con botón volver */}
          <div className="mb-4 pb-2 border-b border-[var(--menues-border)]">
            {currentLevel !== 'main' ? (
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--menues-fg)]">
                  {getCurrentTitle()}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-[var(--menues-fg)] p-2 hover:bg-[var(--card-hover-bg)]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-[var(--menues-fg)]">
                {getCurrentTitle()}
              </h2>
            )}
          </div>
          
          {/* Contenido del menu actual */}
          {renderCurrentContent()}
        </div>

        {/* Footer con selector de organización y proyecto */}
        <div className="border-t border-[var(--menues-border)] p-4 bg-[var(--card-bg)]">
          {/* Selector de organización */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-[var(--menues-fg)] mb-1">Organización:</label>
            <div className="relative">
              <button
                onClick={() => setExpandedProjectSelector(false)}
                className="w-full p-2 text-left bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--menues-fg)] flex items-center"
              >
                <Building className="h-4 w-4 mr-2" />
                <span className="flex-1 truncate text-sm">
                  {currentOrganization?.name || 'Sin organización'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Selector de proyecto */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-[var(--menues-fg)] mb-1">Proyecto:</label>
            <div className="relative">
              <button
                onClick={() => setExpandedProjectSelector(!expandedProjectSelector)}
                className="w-full p-2 text-left bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--menues-fg)] flex items-center"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                <span className="flex-1 truncate text-sm">
                  {currentProjectName}
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  expandedProjectSelector && "rotate-180"
                )} />
              </button>
              
              {/* Lista de proyectos expandida */}
              {expandedProjectSelector && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                  {projectsData?.map((project: any) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project.id)}
                      className={cn(
                        "w-full p-2 text-left text-sm hover:bg-[var(--card-hover-bg)] transition-colors duration-150 text-[var(--menues-fg)]",
                        project.id === effectiveCurrentProject && "bg-[hsl(76,100%,40%)] text-white"
                      )}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Información del usuario */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--menues-border)]">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userData?.user?.avatar_url} />
              <AvatarFallback className="bg-[var(--accent)] text-white text-xs">
                {userData?.user?.full_name?.substring(0, 2)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--menues-fg)] truncate">
                {userData?.user?.full_name || userData?.user?.email}
              </p>
              <p className="text-xs text-[var(--menues-fg)] opacity-60 truncate">
                {userData?.user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate('/profile');
                handleCloseMenu();
              }}
              className="text-[var(--menues-fg)] p-1"
            >
              <UserCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}