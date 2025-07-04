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
    <>
      {/* Logo y Header */}
      <div className="flex h-12 items-center justify-center border-b border-[--menues-border] px-2">
        <div className="relative group">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-[--accent] flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            {isExpanded && (
              <span className="ml-3 text-lg font-semibold text-[--menues-fg] whitespace-nowrap">
                Archub
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-2 px-2 space-y-1">
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
        />

        <SidebarButton
          icon={<FolderOpen className="h-4 w-4" />}
          label="Proyecto"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('project')}
        />

        <SidebarButton
          icon={<Palette className="h-4 w-4" />}
          label="Diseño"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('design')}
        />

        <SidebarButton
          icon={<Hammer className="h-4 w-4" />}
          label="Obra"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('construction')}
        />

        <SidebarButton
          icon={<DollarSign className="h-4 w-4" />}
          label="Finanzas"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('finance')}
        />

        <SidebarButton
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Comercialización"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => setSidebarContext('marketing')}
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

        {/* Profile Button */}
        <div className={cn(
          "transition-all duration-300",
          isExpanded ? "p-2" : "p-1"
        )}>
          {isExpanded ? (
            <div className="bg-[--card-bg] border border-[--card-border] rounded-lg p-3 cursor-pointer hover:bg-[--card-hover-bg]" onClick={() => navigate('/perfil')}>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[--accent] text-white">
                  {userData?.user?.avatar_url ? (
                    <img src={userData.user.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full" />
                  ) : (
                    <UserCircle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-[--card-fg]">
                    {userData?.user?.full_name || 'Usuario'}
                  </div>
                  <div className="text-xs text-[--muted-fg]">
                    Perfil
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto bg-[--accent] cursor-pointer hover:opacity-80" onClick={() => navigate('/perfil')}>
              {userData?.user?.avatar_url ? (
                <img src={userData.user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full" />
              ) : (
                <UserCircle className="w-4 h-4 text-white" />
              )}
            </div>
          )}
        </div>
      </div>
    </>
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

  const renderCurrentSidebar = () => {
    switch (currentContext) {
      case 'organization':
        return renderOrganizationSidebar();
      case 'project':
        // TODO: Implementar proyecto sidebar
        return renderMasterSidebar();
      case 'design':
        // TODO: Implementar diseño sidebar
        return renderMasterSidebar();
      case 'construction':
        // TODO: Implementar obra sidebar
        return renderMasterSidebar();
      case 'finance':
        // TODO: Implementar finanzas sidebar
        return renderMasterSidebar();
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
        "fixed left-0 top-0 z-50 h-full bg-[--menues-bg] border-r border-[--menues-border] transition-all duration-300 flex flex-col",
        isExpanded ? "w-60" : "w-12"
      )}
      onMouseEnter={() => !isDocked && setHovered(true)}
      onMouseLeave={() => !isDocked && setHovered(false)}
    >
      {renderCurrentSidebar()}
    </div>
  );
}