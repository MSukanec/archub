import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarSubmenu } from "./SidebarSubmenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  Building2,
  Folder,
  Users,
  DollarSign,
  FileText,
  Settings,
  User,
} from "lucide-react";

// Define menu structure
const menuGroups = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    items: [] // No submenu - direct navigation
  },
  {
    id: 'organizacion',
    label: 'Organización',
    icon: Users,
    items: [
      { label: 'Gestión de Organizaciones', href: '/organizaciones' },
      { label: 'Contactos', href: '/contactos' }
    ]
  },
  {
    id: 'proyectos',
    label: 'Proyectos',
    icon: Folder,
    items: [
      { label: 'Gestión de Proyectos', href: '/proyectos' }
    ]
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
      { label: 'Admin de Organizaciones', href: '/admin/organizaciones' },
      { label: 'Ver perfil', href: '/perfil' }
    ]
  }
];

export function Sidebar() {
  const [location] = useLocation();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [isSubmenuHovered, setIsSubmenuHovered] = useState(false);
  const { data: userData } = useCurrentUser();

  // Check if sidebar should be docked from user preferences
  const isSidebarDocked = userData?.preferences?.sidebar_docked ?? false;

  const handleGroupClick = (groupId: string, href?: string) => {
    if (href) {
      // Direct navigation for items without submenu (like Dashboard)
      setActiveGroup(null);
      return;
    }
    
    // Toggle submenu for groups with items
    setActiveGroup(activeGroup === groupId ? null : groupId);
  };

  const handleSubmenuMouseEnter = () => {
    setIsSubmenuHovered(true);
  };

  const handleSubmenuMouseLeave = () => {
    setIsSubmenuHovered(false);
    // Close submenu after a small delay if not docked
    if (!isSidebarDocked) {
      setTimeout(() => {
        setActiveGroup(null);
      }, 150); // Small delay to prevent flicker
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

  // Show submenu based on different conditions
  const shouldShowSubmenu = (() => {
    // Always show if docked
    if (isSidebarDocked) return true;
    
    // Show if user clicked on a group
    if (submenuGroup) return true;
    
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
      >
        {/* Logo/Header */}
        <div className="h-10 flex items-center justify-center border-b border-[var(--sidebar-border)]">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="w-10 h-10 p-0 hover:bg-[var(--sidebar-hover-bg)]"
            >
              <Building2 className="h-4 w-4 text-[var(--sidebar-fg)]" />
            </Button>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1">
          {menuGroups.map((group) => (
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

        {/* User Avatar - Bottom */}
        <div className="border-t border-[var(--sidebar-border)]">
          <Link href="/perfil">
            <Button
              variant="ghost"
              className={cn(
                "w-10 h-10 p-0 transition-colors rounded-none",
                "hover:bg-[var(--sidebar-hover-bg)]",
                location === '/perfil' && "bg-[var(--sidebar-active-bg)]"
              )}
              style={{
                backgroundColor: location === '/perfil' ? 'var(--sidebar-active-bg)' : 'transparent'
              }}
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
                  location === '/perfil' ? "text-[var(--sidebar-active-fg)]" : "text-[var(--sidebar-fg)]"
                )} />
              )}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Secondary Sidebar - Shows submenu */}
      {shouldShowSubmenu && (
        <div
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
        >
          <SidebarSubmenu
            title={submenuGroup?.label || activeGroupData?.label || ''}
            items={submenuGroup?.items || activeGroupData?.items || []}
            isVisible={true}
          />
        </div>
      )}
    </>
  );
}