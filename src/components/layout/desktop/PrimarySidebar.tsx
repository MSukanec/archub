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
  ChevronDown
} from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { useProjectContext } from "@/stores/projectContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { supabase } from "@/lib/supabase";
import { useProjects } from "@/hooks/use-projects";
import SidebarButton from "./SidebarButton";
import { SelectorPopover } from "@/components/popovers/SelectorPopover";

export function PrimarySidebar() {
  const [location, navigate] = useLocation();
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const isAdmin = useIsAdmin();
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isGlobalView, selectedProjectId } = useProjectContext();
  
  // Get projects data to find current project info
  const { data: projects = [] } = useProjects(userData?.organization?.id);
  
  // Find current project
  const currentProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
  
  // Helper function to get project initials
  const getProjectInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };
  
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
  const { setDocked: setSecondarySidebarDocked } = useSecondarySidebarStore();
  
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

  // Handle dock toggle
  const handleDockToggle = () => {
    const newDocked = !isDocked;
    setDocked(newDocked);
    setSecondarySidebarDocked(newDocked);
    savePreferencesMutation.mutate({ sidebar_docked: newDocked });
    
    toast({
      title: newDocked ? "Sidebar anclado" : "Sidebar desanclado",
      description: newDocked ? "El sidebar permanecerá visible" : "El sidebar se ocultará automáticamente"
    });
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Apply theme to document
    const rootElement = document.documentElement;
    if (newTheme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
    
    // Save theme preference
    savePreferencesMutation.mutate({ theme: newTheme });
    
    toast({
      title: `Modo ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`,
      description: `La interfaz ahora está en modo ${newTheme === 'dark' ? 'oscuro' : 'claro'}`
    });
  };

  const primarySections = [
    {
      id: 'organization',
      label: 'Organización', 
      icon: Building2,
      level: 'organization' as const,
      navigateTo: false
    },
    // Solo mostrar secciones de Proyecto y Construcción si hay un proyecto activo
    ...(!isGlobalView ? [
      {
        id: 'project',
        label: 'Proyecto',
        icon: FolderOpen,
        level: 'project' as const,
        navigateTo: false
      },
      {
        id: 'construction',
        label: 'Construcción',
        icon: HardHat,
        level: 'construction' as const,
        navigateTo: false
      }
    ] : []),
    {
      id: 'library',
      label: 'Biblioteca',
      icon: Library,
      level: 'library' as const,
      navigateTo: false
    },
    ...(isAdmin ? [{
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      level: 'admin' as const,
      navigateTo: false
    }] : [])
  ];

  const handleSectionClick = (section: typeof primarySections[0]) => {
    setSidebarLevel(section.level);
  };

  const isActive = (level: string) => {
    return sidebarLevel === level;
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen z-50 bg-[var(--main-sidebar-bg)] border-r border-[var(--main-sidebar-border)] transition-all duration-300",
        "w-[40px] flex flex-col"
      )}
      style={{
        overflow: 'hidden'
      }}
    >
      {/* Logo Archub - misma altura que PageHeader */}
      <div className="h-12 flex-shrink-0 flex items-center justify-center">
        <span className="text-xl font-black text-white">
          A
        </span>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 p-1">
        <div className="flex flex-col gap-[2px] h-full">
        {primarySections.map((section) => (
          <SidebarButton
            key={section.id}
            icon={<section.icon className="w-[18px] h-[18px]" />}
            label={section.label}
            isActive={isActive(section.level)}
            isExpanded={false}
            onClick={() => handleSectionClick(section)}
            variant="main"
          />
        ))}
        </div>
      </div>
      
      {/* Bottom Section - Fixed Buttons */}
      <div className="p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Project Selector - only show if there's a selected project */}
          {currentProject && (
            <SelectorPopover
              trigger={
                <div>
                  <SidebarButton
                    icon={<Folder className="w-[18px] h-[18px]" />}
                    label={currentProject.name || 'Proyecto'}
                    isActive={false}
                    isExpanded={false}
                    variant="main"
                    userFullName={getProjectInitials(currentProject.name || 'P')}
                    projectColor={currentProject.color}
                    rightIcon={<ChevronDown className="w-3 h-3" />}
                  />
                </div>
              }
              items={projects.map((project) => ({
                id: project.id,
                name: project.name,
                logo_url: project.logo_url,
                type: "Proyecto" as const,
                color: project.color
              }))}
              selectedId={selectedProjectId}
              onSelect={handleProjectSelect}
              emptyMessage="No hay proyectos disponibles"
              getInitials={getProjectInitials}
            />
          )}
          
          {/* Divisor */}
          <div className="h-px bg-white/20 mb-2"></div>
          
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