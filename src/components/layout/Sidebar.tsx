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
  const { data: userData } = useCurrentUser();

  const handleGroupClick = (groupId: string, href?: string) => {
    if (href) {
      // Direct navigation for items without submenu (like Dashboard)
      setActiveGroup(null);
      return;
    }
    
    // Toggle submenu for groups with items
    setActiveGroup(activeGroup === groupId ? null : groupId);
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

  return (
    <>
      {/* Main Sidebar - Always compact with icons only */}
      <aside
        className="fixed left-0 top-0 h-full w-12 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col z-50"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)'
        }}
      >
        {/* Logo/Header */}
        <div className="h-12 flex items-center justify-center border-b border-[var(--sidebar-border)]">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-[var(--sidebar-hover-bg)]"
            >
              <Building2 className="h-4 w-4 text-[var(--sidebar-fg)]" />
            </Button>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {menuGroups.map((group) => (
            <div key={group.id}>
              {group.href ? (
                <Link href={group.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-8 h-8 p-0 transition-colors",
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
                  size="sm"
                  className={cn(
                    "w-8 h-8 p-0 transition-colors",
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
      </aside>

      {/* Secondary Sidebar - Shows submenu for active group */}
      {submenuGroup && (
        <SidebarSubmenu
          title={submenuGroup.label}
          items={submenuGroup.items}
          isVisible={true}
        />
      )}

      {/* Auto-show submenu for currently active page group */}
      {!submenuGroup && activeGroupData && activeGroupData.items.length > 0 && (
        <SidebarSubmenu
          title={activeGroupData.label}
          items={activeGroupData.items}
          isVisible={true}
        />
      )}
    </>
  );
}