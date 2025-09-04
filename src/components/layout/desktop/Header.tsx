import React, { useState, useEffect } from "react";
import { Search, Bell, Settings, Home, Building, FolderOpen, PanelLeftOpen, PanelLeftClose, Sun, Moon, Library, Package, Crown, HardHat, Folder, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLocation } from "wouter";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useProjectContext } from "@/stores/projectContext";
import { useProjects, useProject } from "@/hooks/use-projects";
import { useUpdateUserOrganizationPreferences } from "@/hooks/use-user-organization-preferences";
import { SelectorPopover } from "@/components/popovers/SelectorPopover";
import { useIsAdmin } from "@/hooks/use-admin-permissions";

interface HeaderProps {
  // Header principal simplificado - solo props básicas si son necesarias
}

export function Header({}: HeaderProps = {}) {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Sidebar state
  const { isDocked, setDocked } = useSidebarStore();
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const { setDocked: setSecondarySidebarDocked } = useSecondarySidebarStore();
  
  // Project context
  const { selectedProjectId, setSelectedProject } = useProjectContext();
  const { data: projects = [] } = useProjects(userData?.organization?.id);
  const { data: currentProject } = useProject(selectedProjectId || undefined);
  const updateProjectMutation = useUpdateUserOrganizationPreferences();
  
  // Admin permissions
  const isAdmin = useIsAdmin();
  
  // Theme state
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Initialize theme from user preferences
  useEffect(() => {
    const currentTheme = (userData?.preferences?.theme as 'light' | 'dark') || 'light';
    setTheme(currentTheme);
    setIsDark(currentTheme === 'dark');
    
    // Apply theme to document
    const rootElement = document.documentElement;
    if (currentTheme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
  }, [userData?.preferences?.theme]);

  // Project selection logic
  const handleProjectSelect = (projectId: string) => {
    if (selectedProjectId === projectId) return;
    updateProjectMutation.mutate({ 
      organizationId: userData?.organization?.id || '',
      lastProjectId: projectId 
    });
    setSelectedProject(projectId, userData?.organization?.id);
  };

  // Function to get project initials
  const getProjectInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    // Implementar logout
    navigate("/");
  };

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
      description: newDocked ? "El sidebar permanecerá siempre visible" : "El sidebar se ocultará automáticamente",
    });
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setIsDark(newTheme === 'dark');
    
    // Apply theme to document immediately
    const rootElement = document.documentElement;
    if (newTheme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
    
    savePreferencesMutation.mutate({ theme: newTheme });
    
    toast({
      title: `Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`,
      description: `La aplicación ahora utiliza el tema ${newTheme === 'dark' ? 'oscuro' : 'claro'}`,
    });
  };

  const getActiveSection = () => {
    switch (sidebarLevel) {
      case 'organization': return 'organizacion';
      case 'project': return 'proyecto';
      case 'construction': return 'construccion';
      case 'library': return 'biblioteca';
      case 'provider': return 'proveedor';
      case 'admin': return 'administracion';
      default: return 'organizacion'; // Default to organization instead of inicio
    }
  };

  const activeSection = getActiveSection();

  return (
    <div className="fixed top-0 left-0 right-0 w-full z-50 h-12 border-b border-[var(--main-sidebar-border)] bg-[var(--main-sidebar-bg)] transition-all duration-300">
      <div className="w-full h-12 px-1 py-2 flex items-center justify-between">
        {/* Left: Navigation Buttons */}
        <div className="flex items-center gap-1">

          {/* Organización */}
          <button
            onClick={() => {
              setSidebarLevel('organization');
            }}
            className={`h-8 flex items-center rounded transition-all duration-200 ${
              activeSection === 'organizacion' 
                ? 'bg-[var(--accent)] text-white px-3' 
                : 'w-8 justify-center hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'organizacion' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <Building className="w-[18px] h-[18px]" />
            {activeSection === 'organizacion' && <span className="ml-2 text-xs font-normal">Organización</span>}
          </button>

          {/* Proyecto */}
          <button
            onClick={() => {
              setSidebarLevel('project');
            }}
            className={`h-8 flex items-center rounded transition-all duration-200 ${
              activeSection === 'proyecto' 
                ? 'bg-[var(--accent)] text-white px-3' 
                : 'w-8 justify-center hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'proyecto' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <FolderOpen className="w-[18px] h-[18px]" />
            {activeSection === 'proyecto' && <span className="ml-2 text-xs font-normal">Proyecto</span>}
          </button>

          {/* Construcción */}
          <button
            onClick={() => {
              setSidebarLevel('construction');
            }}
            className={`h-8 flex items-center rounded transition-all duration-200 ${
              activeSection === 'construccion' 
                ? 'bg-[var(--accent)] text-white px-3' 
                : 'w-8 justify-center hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'construccion' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <HardHat className="w-[18px] h-[18px]" />
            {activeSection === 'construccion' && <span className="ml-2 text-xs font-normal">Construcción</span>}
          </button>

          {/* Biblioteca */}
          <button
            onClick={() => {
              setSidebarLevel('library');
            }}
            className={`h-8 flex items-center rounded transition-all duration-200 ${
              activeSection === 'biblioteca' 
                ? 'bg-[var(--accent)] text-white px-3' 
                : 'w-8 justify-center hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'biblioteca' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <Library className="w-[18px] h-[18px]" />
            {activeSection === 'biblioteca' && <span className="ml-2 text-xs font-normal">Biblioteca</span>}
          </button>

        </div>

        {/* Center: Project Selector */}
        <div className="flex-1 max-w-md mx-8 flex justify-center">
          {currentProject ? (
            <SelectorPopover
              trigger={
                <button className="h-8 px-3 flex items-center gap-2 rounded-lg bg-[var(--main-sidebar-button-hover-bg)] hover:bg-[var(--accent)] transition-all duration-200">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback 
                      className="text-xs font-medium text-white"
                      style={{ backgroundColor: currentProject.color || 'hsl(var(--accent))' }}
                    >
                      {getProjectInitials(currentProject.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-normal" style={{color: 'var(--main-sidebar-fg)'}}>
                    {currentProject.name}
                  </span>
                  <ChevronDown className="w-3 h-3" style={{color: 'var(--main-sidebar-fg)'}} />
                </button>
              }
              items={projects.map((project: any) => ({
                id: project.id,
                name: project.name,
                logo_url: undefined, // No mostrar imagen, solo avatar con iniciales
                type: "Proyecto" as const,
                color: project.color
              }))}
              selectedId={selectedProjectId || undefined}
              onSelect={handleProjectSelect}
              emptyMessage="No hay proyectos disponibles"
              getInitials={getProjectInitials}
            />
          ) : (
            <button 
              className="h-8 px-3 flex items-center gap-2 rounded-lg bg-[var(--main-sidebar-button-hover-bg)] hover:bg-[var(--accent)] transition-all duration-200"
              disabled
            >
              <Folder className="w-[18px] h-[18px]" style={{color: 'var(--main-sidebar-fg)'}} />
              <span className="text-xs font-normal" style={{color: 'var(--main-sidebar-fg)'}}>
                Seleccionar proyecto
              </span>
            </button>
          )}
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-1">
          {/* Notificaciones */}
          <button
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[var(--main-sidebar-button-hover-bg)] transition-all duration-200"
            title="Notificaciones"
            style={{color: 'var(--main-sidebar-fg)'}}
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>

          {/* Proveedor - Solo para administradores */}
          {isAdmin && (
            <button
              onClick={() => {
                setSidebarLevel('provider');
              }}
              className={`h-8 w-8 flex items-center justify-center rounded transition-all duration-200 ${
                activeSection === 'proveedor' 
                  ? 'bg-[var(--accent)]' 
                  : 'hover:bg-[var(--main-sidebar-button-hover-bg)]'
              }`}
              style={{color: activeSection === 'proveedor' ? 'white' : 'var(--main-sidebar-fg)'}}
              title="Proveedor"
            >
              <Package className="w-[18px] h-[18px]" />
            </button>
          )}

          {/* Administración - Solo para administradores */}
          {isAdmin && (
            <button
              onClick={() => {
                setSidebarLevel('admin');
              }}
              className={`h-8 w-8 flex items-center justify-center rounded transition-all duration-200 ${
                activeSection === 'administracion' 
                  ? 'bg-[var(--accent)]' 
                  : 'hover:bg-[var(--main-sidebar-button-hover-bg)]'
              }`}
              style={{color: activeSection === 'administracion' ? 'white' : 'var(--main-sidebar-fg)'}}
              title="Administración"
            >
              <Crown className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}