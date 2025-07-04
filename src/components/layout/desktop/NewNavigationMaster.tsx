import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";

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
  Calendar,
  ArrowLeft,
  ArrowRight,
  Tag,
  ChevronDown,
  ChevronRight,
  Search,
  Crown,
  Package,
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
  Palette,
  Hammer,
  ShoppingCart
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSidebarStore } from "@/stores/sidebarStore";
import SidebarButton from "../SidebarButton";

export function NewNavigationMaster() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { isDocked, isHovered, setHovered, setDocked, currentContext, setSidebarContext } = useSidebarStore();
  
  // Sync sidebar state with user preferences
  useEffect(() => {
    if (userData?.preferences?.sidebar_docked !== undefined) {
      setDocked(userData.preferences.sidebar_docked);
    }
  }, [userData?.preferences?.sidebar_docked, setDocked]);
  
  const queryClient = useQueryClient();
  const isExpanded = isDocked || isHovered;

  // Estado para acordeones - solo uno abierto a la vez
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(() => {
    const saved = localStorage.getItem('sidebar-accordion');
    return saved || null;
  });

  // Guardar estado de acordeón en localStorage
  useEffect(() => {
    if (expandedAccordion) {
      localStorage.setItem('sidebar-accordion', expandedAccordion);
    } else {
      localStorage.removeItem('sidebar-accordion');
    }
  }, [expandedAccordion]);

  // Theme toggle mutation
  const themeToggleMutation = useMutation({
    mutationFn: async (newTheme: 'light' | 'dark') => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('No user preferences available');
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ theme: newTheme })
        .eq('id', userData.preferences.id);

      if (error) throw error;
      return newTheme;
    },
    onSuccess: (newTheme) => {
      // Apply theme to document
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Invalidate user data to refresh theme
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      console.error('Failed to update theme:', error);
    }
  });

  // Sidebar docking mutation
  const sidebarDockingMutation = useMutation({
    mutationFn: async (docked: boolean) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('No user preferences available');
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ sidebar_docked: docked })
        .eq('id', userData.preferences.id);

      if (error) throw error;
      return docked;
    },
    onSuccess: (docked) => {
      setDocked(docked);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      console.error('Failed to update sidebar docking:', error);
    }
  });

  const toggleAccordion = (accordionId: string) => {
    setExpandedAccordion(expandedAccordion === accordionId ? null : accordionId);
  };

  const toggleTheme = () => {
    const currentTheme = userData?.preferences?.theme || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    themeToggleMutation.mutate(newTheme);
  };

  const toggleDocking = () => {
    const newDocked = !isDocked;
    sidebarDockingMutation.mutate(newDocked);
  };

  const toggleSidebar = () => {
    if (!isDocked) {
      setExpanded(!isExpanded);
    }
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const handleContextSwitch = (context: any, path?: string) => {
    setSidebarContext(context);
    if (path) {
      navigate(path);
    }
  };

  const handleBack = () => {
    setSidebarContext('master');
  };

  const renderMasterSidebar = () => (
    <div className="flex flex-col h-full justify-between">
      {/* Header */}
      <div className="p-2">
        <SidebarButton
          icon={<Building className="h-4 w-4" />}
          label="Archub"
          isActive={false}
          isExpanded={isExpanded}
          onClick={toggleSidebar}
        />
      </div>

      {/* Middle: Navegación */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {/* Resúmenes */}
        <SidebarButton
          icon={<Home className="h-4 w-4" />}
          label="Resumen de Organización"
          isActive={isActive('/organization/dashboard')}
          isExpanded={isExpanded}
          onClick={() => handleContextSwitch('organization-dashboard', '/organization/dashboard')}
        />
        
        <SidebarButton
          icon={<FolderOpen className="h-4 w-4" />}
          label="Resumen de Proyecto"
          isActive={isActive('/project/dashboard')}
          isExpanded={isExpanded}
          onClick={() => handleContextSwitch('project-dashboard', '/project/dashboard')}
        />

        {/* Separador */}
        <div className="h-px bg-[--menues-border] my-2"></div>

        {/* Sidebars Secundarios */}
        <SidebarButton
          icon={<Building className="h-4 w-4" />}
          label="Organización"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('organization')}
          showArrow={true}
        />

        <SidebarButton
          icon={<FolderOpen className="h-4 w-4" />}
          label="Proyecto"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('project')}
          showArrow={true}
        />

        <SidebarButton
          icon={<Palette className="h-4 w-4" />}
          label="Diseño"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('design')}
          showArrow={true}
        />

        <SidebarButton
          icon={<Hammer className="h-4 w-4" />}
          label="Obra"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('construction')}
          showArrow={true}
        />

        <SidebarButton
          icon={<DollarSign className="h-4 w-4" />}
          label="Finanzas"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('finance')}
          showArrow={true}
        />

        <SidebarButton
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Comercialización"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('marketing')}
          showArrow={true}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-[--menues-border] p-2 space-y-1">
        {isAdmin && (
          <SidebarButton
            icon={<Crown className="h-4 w-4" />}
            label="Administración"
            isActive={isActive('/admin/dashboard')}
            isExpanded={isExpanded}
            onClick={() => navigate('/admin/dashboard')}
          />
        )}

        <SidebarButton
          icon={<Settings className="h-4 w-4" />}
          label="Configuración"
          isActive={isActive('/perfil')}
          isExpanded={isExpanded}
          onClick={() => navigate('/perfil')}
        />

        <SidebarButton
          icon={<UserCircle className="h-4 w-4" />}
          label="Perfil"
          isActive={isActive('/perfil')}
          isExpanded={isExpanded}
          onClick={() => navigate('/perfil')}
        />
      </div>
    </div>
  );

  const renderOrganizationSidebar = () => (
    <>
      {/* Header con botón de volver */}
      <div className="flex h-12 items-center justify-between border-b border-[--menues-border] px-2">
        <SidebarButton
          icon={<ArrowLeft className="h-4 w-4" />}
          label="Volver"
          isActive={false}
          isExpanded={isExpanded}
          onClick={handleBack}
        />
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-2 px-2 space-y-1">
        <SidebarButton
          icon={<FolderOpen className="h-4 w-4" />}
          label="Proyectos"
          isActive={isActive('/proyectos')}
          isExpanded={isExpanded}
          onClick={() => navigate('/proyectos')}
        />

        <SidebarButton
          icon={<Users className="h-4 w-4" />}
          label="Contactos"
          isActive={isActive('/organization/contactos')}
          isExpanded={isExpanded}
          onClick={() => navigate('/organization/contactos')}
        />

        <SidebarButton
          icon={<Activity className="h-4 w-4" />}
          label="Actividad"
          isActive={isActive('/organization/activity')}
          isExpanded={isExpanded}
          onClick={() => navigate('/organization/activity')}
        />

        <SidebarButton
          icon={<Users className="h-4 w-4" />}
          label="Miembros"
          isActive={isActive('/organization/members')}
          isExpanded={isExpanded}
          onClick={() => navigate('/organization/members')}
        />

        <SidebarButton
          icon={<Building className="h-4 w-4" />}
          label="Gestión de Organizaciones"
          isActive={isActive('/organizations')}
          isExpanded={isExpanded}
          onClick={() => navigate('/organizations')}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-[--menues-border] p-2">
        <SidebarButton
          icon={<Settings className="h-4 w-4" />}
          label="Configuración"
          isActive={isActive('/perfil')}
          isExpanded={isExpanded}
          onClick={() => navigate('/perfil')}
        />
      </div>
    </>
  );

  const renderProjectSidebar = () => (
    <>
      {/* Header - Botón de volver */}
      <div className="p-2">
        <SidebarButton
          icon={<ArrowLeft className="h-4 w-4" />}
          label="Volver"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('master')}
        />
      </div>

      {/* Separador */}
      <div className="h-px bg-[--menues-border] mx-2"></div>

      {/* Navigation */}
      <div className="flex-1 p-2 space-y-1">
        <SidebarButton
          icon={<Home className="h-4 w-4" />}
          label="Resumen del Proyecto"
          isActive={isActive('/project/dashboard')}
          isExpanded={isExpanded}
          onClick={() => navigate('/project/dashboard')}
        />

        <SidebarButton
          icon={<Calendar className="h-4 w-4" />}
          label="Cronograma"
          isActive={isActive('/design/timeline')}
          isExpanded={isExpanded}
          onClick={() => navigate('/design/timeline')}
        />

        <SidebarButton
          icon={<CheckSquare className="h-4 w-4" />}
          label="Gestión de Tareas"
          isActive={isActive('/tasks')}
          isExpanded={isExpanded}
          onClick={() => navigate('/tasks')}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-[--menues-border] p-2">
        <SidebarButton
          icon={<UserCircle className="h-4 w-4" />}
          label="Perfil"
          isActive={isActive('/perfil')}
          isExpanded={isExpanded}
          onClick={() => navigate('/perfil')}
        />
      </div>
    </>
  );

  const renderConstructionSidebar = () => (
    <>
      {/* Header - Botón de volver */}
      <div className="p-2">
        <SidebarButton
          icon={<ArrowLeft className="h-4 w-4" />}
          label="Volver"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('master')}
        />
      </div>

      {/* Separador */}
      <div className="h-px bg-[--menues-border] mx-2"></div>

      {/* Navigation */}
      <div className="flex-1 p-2 space-y-1">
        <SidebarButton
          icon={<Home className="h-4 w-4" />}
          label="Resumen de Obra"
          isActive={isActive('/construction/dashboard')}
          isExpanded={isExpanded}
          onClick={() => navigate('/construction/dashboard')}
        />

        <SidebarButton
          icon={<Calculator className="h-4 w-4" />}
          label="Presupuestos"
          isActive={isActive('/construction/budgets')}
          isExpanded={isExpanded}
          onClick={() => navigate('/construction/budgets')}
        />

        <SidebarButton
          icon={<Package className="h-4 w-4" />}
          label="Materiales"
          isActive={isActive('/construction/materials')}
          isExpanded={isExpanded}
          onClick={() => navigate('/construction/materials')}
        />

        <SidebarButton
          icon={<FileText className="h-4 w-4" />}
          label="Bitácora"
          isActive={isActive('/construction/logs')}
          isExpanded={isExpanded}
          onClick={() => navigate('/construction/logs')}
        />

        <SidebarButton
          icon={<Users className="h-4 w-4" />}
          label="Personal"
          isActive={isActive('/construction/personnel')}
          isExpanded={isExpanded}
          onClick={() => navigate('/construction/personnel')}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-[--menues-border] p-2">
        <SidebarButton
          icon={<UserCircle className="h-4 w-4" />}
          label="Perfil"
          isActive={isActive('/perfil')}
          isExpanded={isExpanded}
          onClick={() => navigate('/perfil')}
        />
      </div>
    </>
  );

  const renderFinanceSidebar = () => (
    <>
      {/* Header - Botón de volver */}
      <div className="p-2">
        <SidebarButton
          icon={<ArrowLeft className="h-4 w-4" />}
          label="Volver"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('master')}
        />
      </div>

      {/* Separador */}
      <div className="h-px bg-[--menues-border] mx-2"></div>

      {/* Navigation */}
      <div className="flex-1 p-2 space-y-1">
        <SidebarButton
          icon={<Home className="h-4 w-4" />}
          label="Resumen de Finanzas"
          isActive={isActive('/finances/dashboard')}
          isExpanded={isExpanded}
          onClick={() => navigate('/finances/dashboard')}
        />

        <SidebarButton
          icon={<DollarSign className="h-4 w-4" />}
          label="Movimientos"
          isActive={isActive('/finances/movements')}
          isExpanded={isExpanded}
          onClick={() => navigate('/finances/movements')}
        />

        <SidebarButton
          icon={<Settings className="h-4 w-4" />}
          label="Preferencias"
          isActive={isActive('/finances/preferences')}
          isExpanded={isExpanded}
          onClick={() => navigate('/finances/preferences')}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-[--menues-border] p-2">
        <SidebarButton
          icon={<UserCircle className="h-4 w-4" />}
          label="Perfil"
          isActive={isActive('/perfil')}
          isExpanded={isExpanded}
          onClick={() => navigate('/perfil')}
        />
      </div>
    </>
  );

  const renderDesignSidebar = () => (
    <>
      {/* Header - Botón de volver */}
      <div className="p-2">
        <SidebarButton
          icon={<ArrowLeft className="h-4 w-4" />}
          label="Volver"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('master')}
        />
      </div>

      {/* Separador */}
      <div className="h-px bg-[--menues-border] mx-2"></div>

      {/* Navigation */}
      <div className="flex-1 p-2 space-y-1">
        <SidebarButton
          icon={<Home className="h-4 w-4" />}
          label="Dashboard"
          isActive={isActive('/design/dashboard')}
          isExpanded={isExpanded}
          onClick={() => navigate('/design/dashboard')}
        />

        <SidebarButton
          icon={<Calendar className="h-4 w-4" />}
          label="Cronograma"
          isActive={isActive('/design/timeline')}
          isExpanded={isExpanded}
          onClick={() => navigate('/design/timeline')}
        />

        <SidebarButton
          icon={<FileText className="h-4 w-4" />}
          label="Moodboard"
          isActive={isActive('/design/moodboard')}
          isExpanded={isExpanded}
          onClick={() => navigate('/design/moodboard')}
        />

        <SidebarButton
          icon={<FolderOpen className="h-4 w-4" />}
          label="Documentación"
          isActive={isActive('/design/documentacion')}
          isExpanded={isExpanded}
          onClick={() => navigate('/design/documentacion')}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-[--menues-border] p-2">
        <SidebarButton
          icon={<UserCircle className="h-4 w-4" />}
          label="Perfil"
          isActive={isActive('/perfil')}
          isExpanded={isExpanded}
          onClick={() => navigate('/perfil')}
        />
      </div>
    </>
  );

  const renderCurrentSidebar = () => {
    switch (currentContext) {
      case 'organization':
        return renderOrganizationSidebar();
      case 'project':
        return renderProjectSidebar();
      case 'design':
        return renderDesignSidebar();
      case 'construction':
        return renderConstructionSidebar();
      case 'finance':
        return renderFinanceSidebar();
      case 'marketing':
        // TODO: Implementar comercialización sidebar
        return renderMasterSidebar();
      case 'admin':
        // TODO: Implementar admin sidebar
        return renderMasterSidebar();
      default:
        return renderMasterSidebar();
    }
  };

  return (
    <div
      className={cn(
        "fixed left-0 top-10 z-40 h-[calc(100vh-2.5rem)] bg-[--menues-bg] border-r border-[--menues-border] transition-all duration-300",
        isExpanded ? "w-60" : "w-10"
      )}
      onMouseEnter={() => !isDocked && setHovered(true)}
      onMouseLeave={() => !isDocked && setHovered(false)}
    >
      {renderCurrentSidebar()}
    </div>
  );
}