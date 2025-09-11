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
  Package,
  ChevronRight
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useProjectContext } from "@/stores/projectContext";
import { supabase } from "@/lib/supabase";
import { useProjects } from "@/hooks/use-projects";
import SidebarButton from "./SidebarButton";
import { SelectorPopover } from "@/components/popovers/SelectorPopover";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const isAdmin = useIsAdmin();
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
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
  
  // State for accordion expansion
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());
  
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
  
  // Sidebar state
  const { isDocked, setDocked } = useSidebarStore();
  
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

  // Toggle accordion
  const toggleAccordion = (accordionId: string) => {
    const newExpanded = new Set(expandedAccordions);
    if (newExpanded.has(accordionId)) {
      newExpanded.delete(accordionId);
    } else {
      newExpanded.add(accordionId);
    }
    setExpandedAccordions(newExpanded);
  };

  // Define accordion sections with their sub-items
  const accordionSections = [
    {
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
      id: 'commercialization',
      label: 'COMERCIALIZACIÓN',
      icon: Handshake,
      items: [
        { icon: Users, label: 'Clientes', href: '/general/clients' }
      ]
    },
    {
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
    }] : [])
  ];

  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 h-screen border-r bg-[var(--secondary-sidebar-bg)] border-[var(--secondary-sidebar-border)] transition-all duration-300 z-40 flex flex-col",
        "w-64"
      )}
      style={{ overflow: 'hidden' }}
    >
      {/* Header - misma altura que PageHeader */}
      <div className="h-12 flex-shrink-0 flex items-center justify-between px-3 bg-[var(--main-sidebar-bg)] border-b border-[var(--main-sidebar-border)]">
        <span className="text-xl font-black text-white">Archub</span>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* Accordion Sections */}
          {accordionSections.map((section) => (
            <div key={section.id} className="mb-2">
              {/* Accordion Header */}
              <button
                onClick={() => toggleAccordion(section.id)}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-md text-sm font-medium transition-colors",
                  "text-[var(--secondary-sidebar-text)] hover:bg-[var(--secondary-sidebar-hover)]"
                )}
              >
                <div className="flex items-center gap-2">
                  <section.icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </div>
                <ChevronRight 
                  className={cn(
                    "w-4 h-4 transition-transform",
                    expandedAccordions.has(section.id) && "rotate-90"
                  )}
                />
              </button>
              
              {/* Accordion Content */}
              {expandedAccordions.has(section.id) && (
                <div className="ml-6 mt-1 space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-md text-sm transition-colors text-left",
                        location === item.href 
                          ? "bg-[var(--secondary-sidebar-active-bg)] text-[var(--secondary-sidebar-active-text)]"
                          : "text-[var(--secondary-sidebar-text)] hover:bg-[var(--secondary-sidebar-hover)]"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom Section - Fixed Buttons */}
      <div className="p-2 border-t border-[var(--secondary-sidebar-border)]">
        <div className="space-y-1">
          {/* Project Selector - only show if there's a selected project */}
          {currentProject && (
            <SelectorPopover
              trigger={
                <div>
                  <SidebarButton
                    icon={<Folder className="w-4 h-4" />}
                    label={currentProject.name || 'Proyecto'}
                    isActive={false}
                    isExpanded={true}
                    variant="secondary"
                    userFullName={getProjectInitials(currentProject.name || 'P')}
                    projectColor={currentProject.color}
                    rightIcon={<ChevronDown className="w-3 h-3" />}
                  />
                </div>
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
          )}
          
          {/* Divisor */}
          <div className="h-px bg-[var(--secondary-sidebar-border)] my-2"></div>
          
          {/* Theme Toggle */}
          <SidebarButton
            icon={theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            label={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
            isActive={false}
            isExpanded={true}
            onClick={handleThemeToggle}
            variant="secondary"
          />
          
          {/* Sidebar Pin/Unpin */}
          <SidebarButton
            icon={isDocked ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            label={isDocked ? "Desanclar Sidebar" : "Anclar Sidebar"}
            isActive={false}
            isExpanded={true}
            onClick={handleDockToggle}
            variant="secondary"
          />
          
          {/* Notifications */}
          <SidebarButton
            icon={<Bell className="w-4 h-4" />}
            label="Notificaciones"
            isActive={false}
            isExpanded={true}
            onClick={() => console.log('Notificaciones clicked')}
            variant="secondary"
          />
          
          {/* User Avatar */}
          <SidebarButton
            icon={null}
            avatarUrl={userData?.user?.avatar_url}
            userFullName={userData?.user?.full_name}
            label={userData?.user?.full_name || 'Usuario'}
            isActive={false}
            isExpanded={true}
            onClick={() => navigate('/profile')}
            variant="secondary"
            disableHover={true}
          />
        </div>
      </div>
    </aside>
  );
}