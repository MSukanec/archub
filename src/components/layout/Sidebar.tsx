import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
import { SidebarSubmenu } from "./SidebarSubmenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Home,
  Building2,
  Folder,
  Users,
  DollarSign,
  FileText,
  Settings,
  User,
  FolderOpen,
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
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [isMainSidebarHovered, setIsMainSidebarHovered] = useState(false);
  const [isSubmenuHovered, setIsSubmenuHovered] = useState(false);
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjects(userData?.preferences?.last_organization_id);

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

  const handleGroupClick = (groupId: string, href?: string) => {
    if (href) {
      // Direct navigation for items without submenu (like Dashboard)
      setActiveGroup(null);
      return;
    }
    
    // Toggle submenu for groups with items
    if (activeGroup === groupId) {
      setActiveGroup(null); // Close if already open
    } else {
      setActiveGroup(groupId); // Open new group
    }
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
          setActiveGroup(null);
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
          setActiveGroup(null);
        }
      }, 200);
    }
  };

  const isGroupActive = (group: typeof menuGroups[0]) => {
    if (group.href) {
      return location === group.href;
    }
    return group.items.some(item => location === item.href);
  };

  const getActiveGroup = () => {
    return menuGroups.find(group => isGroupActive(group));
  };

  const activeGroupData = getActiveGroup();
  const submenuGroup = menuGroups.find(g => g.id === activeGroup);

  // Generate projects submenu items
  const getProjectsSubmenu = () => {
    if (activeGroup !== 'proyectos-lista') return [];
    
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

  // Show submenu based on different conditions
  const shouldShowSubmenu = (() => {
    // Always show if docked
    if (isSidebarDocked) return true;
    
    // Show if user clicked on a group OR is hovering over either sidebar
    if (activeGroup && (isMainSidebarHovered || isSubmenuHovered)) return true;
    
    // Auto-show for current page only if user hasn't manually clicked anything
    if (!activeGroup && activeGroupData && activeGroupData.items.length > 0) return true;
    
    return false;
  })();

  return (
    <>
      {/* Main Sidebar - Always compact with icons only */}
      <aside
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
                    (isGroupActive(group) || activeGroup === group.id) && "bg-[var(--sidebar-active-bg)]"
                  )}
                  style={{
                    backgroundColor: (isGroupActive(group) || activeGroup === group.id) ? 'var(--sidebar-active-bg)' : 'transparent'
                  }}
                  onClick={() => handleGroupClick(group.id)}
                >
                  <group.icon 
                    className={cn(
                      "h-4 w-4",
                      (isGroupActive(group) || activeGroup === group.id) ? "text-[var(--sidebar-active-fg)]" : "text-[var(--sidebar-fg)]"
                    )} 
                  />
                </Button>
              )}
            </div>
          ))}
        </nav>

        {/* User and Projects Section */}
        <div className="border-t border-[var(--sidebar-border)]">
          {/* Settings button */}
          <Button
            variant="ghost"
            className={cn(
              "w-10 h-10 p-0 transition-colors rounded-none",
              "hover:bg-[var(--sidebar-hover-bg)]",
              activeGroup === 'configuracion' && "bg-[var(--sidebar-active-bg)]"
            )}
            style={{
              backgroundColor: activeGroup === 'configuracion' ? 'var(--sidebar-active-bg)' : 'transparent'
            }}
            onClick={() => handleGroupClick('configuracion')}
          >
            <Settings className={cn(
              "h-4 w-4",
              activeGroup === 'configuracion' ? "text-[var(--sidebar-active-fg)]" : "text-[var(--sidebar-fg)]"
            )} />
          </Button>

          {/* Profile button */}
          <Button
            variant="ghost"
            className={cn(
              "w-10 h-10 p-0 transition-colors rounded-none",
              "hover:bg-[var(--sidebar-hover-bg)]",
              activeGroup === 'perfil' && "bg-[var(--sidebar-active-bg)]"
            )}
            style={{
              backgroundColor: activeGroup === 'perfil' ? 'var(--sidebar-active-bg)' : 'transparent'
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
                activeGroup === 'perfil' ? "text-[var(--sidebar-active-fg)]" : "text-[var(--sidebar-fg)]"
              )} />
            )}
          </Button>

          {/* Projects list and management button */}
          <Button
            variant="ghost"
            className={cn(
              "w-10 h-10 p-0 transition-colors rounded-none",
              "hover:bg-[var(--sidebar-hover-bg)]",
              activeGroup === 'proyectos-lista' && "bg-[var(--sidebar-active-bg)]"
            )}
            style={{
              backgroundColor: activeGroup === 'proyectos-lista' ? 'var(--sidebar-active-bg)' : 'transparent'
            }}
            onClick={() => handleGroupClick('proyectos-lista')}
          >
            <FolderOpen className={cn(
              "h-4 w-4",
              activeGroup === 'proyectos-lista' ? "text-[var(--sidebar-active-fg)]" : "text-[var(--sidebar-fg)]"
            )} />
          </Button>
        </div>
      </aside>

      {/* Secondary Sidebar - Shows submenu */}
      {shouldShowSubmenu && (
        <SidebarSubmenu
          title={activeGroup === 'proyectos-lista' ? 'Proyectos' : (submenuGroup?.label || activeGroupData?.label || '')}
          items={activeGroup === 'proyectos-lista' ? getProjectsSubmenu() : (submenuGroup?.items || activeGroupData?.items || [])}
          isVisible={true}
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
        />
      )}
    </>
  );
}