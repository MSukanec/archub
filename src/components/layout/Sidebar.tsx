import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
import { useSidebarStore } from "@/stores/sidebarStore";
import { SidebarSubmenu } from "./SidebarSubmenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Home,
  Building2,
  Building,
  Folder,
  Users,
  DollarSign,
  FileText,
  Settings,
  User,
  FolderOpen,
  Moon,
  Sun,
  Sidebar as SidebarIcon,
} from "lucide-react";

// Define menu structure
const menuGroups = [
  {
    id: 'organizacion',
    label: 'Organización',
    icon: Building,
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Contactos', href: '/contactos' }
    ]
  },
  {
    id: 'proyecto',
    label: 'Proyecto',
    icon: Folder,
    items: []
  },
  {
    id: 'obra',
    label: 'Obra',
    icon: FileText,
    items: [
      { label: 'Bitácora de Obra', href: '/bitacora' }
    ]
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: DollarSign,
    items: [
      { label: 'Movimientos', href: '/movimientos' }
    ]
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    items: [
      { label: 'Gestión de Organizaciones', href: '/admin/organizaciones' },
      { label: 'Gestión de Usuarios', href: '/admin/usuarios' },
      { label: 'Gestión de Tareas', href: '/admin/tareas' }
    ]
  },
  {
    id: 'perfil',
    label: 'Perfil',
    icon: User,
    items: [
      { label: 'Mi Perfil', href: '/perfil' },
      { label: 'Mis Organizaciones', href: '/organizaciones' }
    ]
  }
];

export function Sidebar() {
  const [location] = useLocation();
  const [isMainSidebarHovered, setIsMainSidebarHovered] = useState(false);
  const [isSubmenuHovered, setIsSubmenuHovered] = useState(false);
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjects(userData?.preferences?.last_organization_id);
  
  // Use Zustand store for sidebar state
  const { 
    activeSidebarMenu, 
    isSidebarMenuOpen, 
    toggleSidebarMenu, 
    closeSidebarMenu,
    setActiveSidebarMenu 
  } = useSidebarStore();

  // Check if sidebar should be docked from user preferences
  const isSidebarDocked = userData?.preferences?.sidebar_docked ?? false;

  // Project selection mutation
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('Missing required data');
      }
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('id', userData.preferences.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });

  // Theme toggle mutation
  const toggleThemeMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('Missing required data');
      }
      
      const newTheme = userData.preferences.theme === 'light' ? 'dark' : 'light';
      const { error } = await supabase
        .from('user_preferences')
        .update({ theme: newTheme })
        .eq('id', userData.preferences.id);
      
      if (error) throw error;
      return newTheme;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });

  // Sidebar docking toggle mutation
  const toggleSidebarDockMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('Missing required data');
      }
      
      const newDocked = !userData.preferences.sidebar_docked;
      const { error } = await supabase
        .from('user_preferences')
        .update({ sidebar_docked: newDocked })
        .eq('id', userData.preferences.id);
      
      if (error) throw error;
      return newDocked;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });

  const handleGroupClick = (groupId: string, href?: string) => {
    if (href) {
      // Direct navigation for items without submenu
      closeSidebarMenu();
      return;
    }
    
    // Toggle submenu for groups with items
    toggleSidebarMenu(groupId);
  };

  const handleMainSidebarMouseEnter = () => {
    setIsMainSidebarHovered(true);
  };

  const handleMainSidebarMouseLeave = () => {
    setIsMainSidebarHovered(false);
    // Close submenu after delay if not docked and no hover on either sidebar
    if (!isSidebarDocked && !isSubmenuHovered) {
      setTimeout(() => {
        if (!isSubmenuHovered && !isMainSidebarHovered) {
          closeSidebarMenu();
        }
      }, 200);
    }
  };

  const handleSubmenuMouseEnter = () => {
    setIsSubmenuHovered(true);
  };

  const handleSubmenuMouseLeave = () => {
    setIsSubmenuHovered(false);
    // Close submenu after delay if not docked and no hover on either sidebar
    if (!isSidebarDocked && !isMainSidebarHovered) {
      setTimeout(() => {
        if (!isSubmenuHovered && !isMainSidebarHovered) {
          closeSidebarMenu();
        }
      }, 200);
    }
  };

  // Helper function to check if a group is active
  const isGroupActive = (group: any) => {
    if (group.href && location === group.href) return true;
    return group.items && group.items.some((item: any) => location === item.href);
  };

  // Auto-activate group based on current location and set default
  useEffect(() => {
    const currentGroup = menuGroups.find(group => {
      if (group.href && location === group.href) return true;
      return group.items && group.items.some(item => location === item.href);
    });
    
    if (currentGroup) {
      setActiveSidebarMenu(currentGroup.id);
      // Auto-open submenu if group has items and is docked
      if (isSidebarDocked && currentGroup.items.length > 0) {
        // Use a small delay to ensure the state is set
        setTimeout(() => {
          if (!isSidebarMenuOpen) {
            toggleSidebarMenu(currentGroup.id);
          }
        }, 100);
      }
    } else if (!activeSidebarMenu) {
      // Default to organizacion group
      setActiveSidebarMenu('organizacion');
    }
  }, [location, activeSidebarMenu, setActiveSidebarMenu, isSidebarDocked, isSidebarMenuOpen, toggleSidebarMenu]);

  // Close sidebar when navigating if not docked
  useEffect(() => {
    if (!isSidebarDocked) {
      closeSidebarMenu();
    }
  }, [location, isSidebarDocked, closeSidebarMenu]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isSidebarDocked && isSidebarMenuOpen) {
        const target = event.target as Element;
        const sidebarElement = document.querySelector('[data-sidebar]');
        const submenuElement = document.querySelector('[data-submenu]');
        
        if (sidebarElement && submenuElement && 
            !sidebarElement.contains(target) && 
            !submenuElement.contains(target)) {
          closeSidebarMenu();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarDocked, isSidebarMenuOpen, closeSidebarMenu]);

  // Generate projects submenu items
  const getProjectsSubmenu = () => {
    if (activeSidebarMenu !== 'proyectos-lista') return [];
    
    const sortedProjects = [...projects].sort((a, b) => {
      // Current active project first
      if (a.id === userData?.preferences?.last_project_id) return -1;
      if (b.id === userData?.preferences?.last_project_id) return 1;
      // Then by creation date desc
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const projectItems = sortedProjects.map(project => ({
      label: project.name,
      href: '#', // Don't navigate, just select
      onClick: () => selectProjectMutation.mutate(project.id),
      isActive: project.id === userData?.preferences?.last_project_id
    }));

    return projectItems;
  };

  // Determine if submenu should be shown
  const activeGroupData = menuGroups.find(group => group.id === activeSidebarMenu);
  const shouldShowSubmenu = (() => {
    if (!activeGroupData || !activeGroupData.items || activeGroupData.items.length === 0) return false;
    
    // Always show if docked (regardless of which menu is open)
    if (isSidebarDocked) return true;
    
    // Show if hovered and active (for non-docked mode)
    if (!isSidebarDocked && isMainSidebarHovered && activeSidebarMenu && activeGroupData.items.length > 0) return true;
    
    // Show if menu is explicitly open (for non-docked mode)
    if (!isSidebarDocked) return isSidebarMenuOpen;
    
    return false;
  })();

  return (
    <>
      {/* Main Sidebar - Always compact with icons only */}
      <aside
        data-sidebar
        className="fixed left-0 top-0 h-full w-10 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col z-50"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)'
        }}
        onMouseEnter={handleMainSidebarMouseEnter}
        onMouseLeave={handleMainSidebarMouseLeave}
      >
        {/* Logo/Header */}
        <div className="h-10 flex items-center justify-center border-b border-[var(--sidebar-border)]">
          <span className="text-lg font-bold text-[var(--sidebar-fg)]">A</span>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1">
          {menuGroups.slice(0, -2).map((group) => ( // All groups except configuracion and perfil
            <div key={group.id}>
              {group.href ? (
                <Link href={group.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-10 h-10 p-0 transition-colors rounded-none",
                      "hover:bg-[var(--sidebar-hover-bg)]",
                      isGroupActive(group) && "bg-[var(--sidebar-active-bg)]"
                    )}
                    style={{
                      backgroundColor: isGroupActive(group) ? 'var(--sidebar-active-bg)' : 'transparent'
                    }}
                  >
                    <group.icon 
                      className={cn(
                        "h-4 w-4",
                        isGroupActive(group) ? "text-[var(--sidebar-active-fg)]" : "text-[var(--sidebar-fg)]"
                      )} 
                    />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-10 h-10 p-0 transition-colors rounded-none",
                    "hover:bg-[var(--sidebar-hover-bg)]",
                    (isGroupActive(group) || activeSidebarMenu === group.id) && "bg-[var(--sidebar-active-bg)]"
                  )}
                  style={{
                    backgroundColor: (isGroupActive(group) || activeSidebarMenu === group.id) ? 'var(--sidebar-active-bg)' : 'transparent'
                  }}
                  onClick={() => handleGroupClick(group.id)}
                >
                  <group.icon 
                    className={cn(
                      "h-4 w-4",
                      (isGroupActive(group) || activeSidebarMenu === group.id) ? "text-[var(--sidebar-active-fg)]" : "text-[var(--sidebar-fg)]"
                    )} 
                  />
                </Button>
              )}
            </div>
          ))}
        </nav>

        {/* User Controls Section */}
        <div className="border-t border-[var(--sidebar-border)]">
          {/* Theme toggle button */}
          <Button
            variant="ghost"
            className={cn(
              "w-10 h-10 p-0 transition-colors rounded-none",
              "hover:bg-[var(--sidebar-hover-bg)]"
            )}
            onClick={() => toggleThemeMutation.mutate()}
            disabled={toggleThemeMutation.isPending}
          >
            {userData?.preferences?.theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[var(--sidebar-fg)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--sidebar-fg)]" />
            )}
          </Button>

          {/* Sidebar dock toggle button */}
          <Button
            variant="ghost"
            className={cn(
              "w-10 h-10 p-0 transition-colors rounded-none",
              "hover:bg-[var(--sidebar-hover-bg)]",
              isSidebarDocked && "bg-[var(--sidebar-active-bg)]"
            )}
            style={{
              backgroundColor: isSidebarDocked ? 'var(--sidebar-active-bg)' : 'transparent'
            }}
            onClick={() => toggleSidebarDockMutation.mutate()}
            disabled={toggleSidebarDockMutation.isPending}
          >
            <SidebarIcon className={cn(
              "h-4 w-4",
              isSidebarDocked ? "text-[var(--sidebar-active-fg)]" : "text-[var(--sidebar-fg)]"
            )} />
          </Button>

          {/* Profile button */}
          <Button
            variant="ghost"
            className={cn(
              "w-10 h-10 p-0 transition-colors rounded-none",
              "hover:bg-[var(--sidebar-hover-bg)]",
              activeSidebarMenu === 'perfil' && "bg-[var(--sidebar-active-bg)]"
            )}
            style={{
              backgroundColor: activeSidebarMenu === 'perfil' ? 'var(--sidebar-active-bg)' : 'transparent'
            }}
            onClick={() => handleGroupClick('perfil')}
          >
            {userData?.user?.avatar_url ? (
              <img 
                src={userData.user.avatar_url} 
                alt="Avatar"
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <User className={cn(
                "h-4 w-4",
                activeSidebarMenu === 'perfil' ? "text-[var(--sidebar-active-fg)]" : "text-[var(--sidebar-fg)]"
              )} />
            )}
          </Button>
        </div>

        {/* Configuration Section */}
        <div className="border-t border-[var(--sidebar-border)]">
          {/* Settings button */}
          <Button
            variant="ghost"
            className={cn(
              "w-10 h-10 p-0 transition-colors rounded-none",
              "hover:bg-[var(--sidebar-hover-bg)]",
              activeSidebarMenu === 'configuracion' && "bg-[var(--sidebar-active-bg)]"
            )}
            style={{
              backgroundColor: activeSidebarMenu === 'configuracion' ? 'var(--sidebar-active-bg)' : 'transparent'
            }}
            onClick={() => handleGroupClick('configuracion')}
          >
            <Settings className={cn(
              "h-4 w-4",
              activeSidebarMenu === 'configuracion' ? "text-[var(--sidebar-active-fg)]" : "text-[var(--sidebar-fg)]"
            )} />
          </Button>
        </div>
      </aside>

      {/* Secondary Sidebar */}
      {shouldShowSubmenu && activeGroupData && (
        <SidebarSubmenu
          group={activeGroupData}
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
        />
      )}
    </>
  );
}