import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Building2, 
  FolderOpen, 
  Users, 
  Activity, 
  UserCheck, 
  Settings, 
  LayoutDashboard,
  Palette,
  HardHat,
  DollarSign,
  ShoppingCart,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText
} from "lucide-react";

import { useSidebarStore } from "@/stores/sidebarStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  action?: () => void;
  children?: MenuItem[];
}

export function Sidebar() {
  const [location] = useLocation();
  const { isExpanded, setExpanded, context, setContext, openAccordions, toggleAccordion } = useSidebarStore();
  const { data: userData } = useCurrentUser();

  // Organization sidebar menu
  const organizationMenu: MenuItem[] = [
    { label: "Resumen", icon: Home, path: "/organization/dashboard" },
    { label: "Proyectos", icon: FolderOpen, path: "/organization/projects" },
    { label: "Contactos", icon: Users, path: "/organization/contacts" },
    { label: "Actividad", icon: Activity, path: "/organization/activity" },
    { label: "Miembros", icon: UserCheck, path: "/organization/members" },
    { label: "Preferencias", icon: Settings, path: "/organization/preferences" },
  ];

  // Project sidebar menu
  const projectMenu: MenuItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/project/dashboard" },
    { label: "Diseño", icon: Palette, path: "/project/design" },
    { 
      label: "Obra", 
      icon: HardHat, 
      children: [
        { label: "Resumen de Obra", icon: Home, path: "/obra/dashboard" },
        { label: "Bitácora", icon: FileText, path: "/obra/site-logs" },
      ]
    },
    { 
      label: "Finanzas", 
      icon: DollarSign, 
      children: [
        { label: "Resumen de Finanzas", icon: Home, path: "/finanzas/dashboard" },
        { label: "Movimientos", icon: FileText, path: "/finanzas/movimientos" },
      ]
    },
    { label: "Comercialización", icon: ShoppingCart, path: "/project/commercialization" },
    { 
      label: "Volver", 
      icon: ArrowLeft, 
      action: () => setContext('organization')
    },
  ];

  // Admin sidebar menu (empty for now)
  const adminMenu: MenuItem[] = [];

  const getCurrentMenu = () => {
    switch (context) {
      case 'organization': return organizationMenu;
      case 'project': return projectMenu;
      case 'admin': return adminMenu;
      default: return organizationMenu;
    }
  };

  const handleMouseEnter = () => setExpanded(true);
  const handleMouseLeave = () => setExpanded(false);

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const isActive = item.path && location === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const isAccordionOpen = hasChildren && openAccordions.includes(item.label.toLowerCase());

    const handleClick = () => {
      if (item.action) {
        item.action();
      } else if (hasChildren) {
        toggleAccordion(item.label.toLowerCase());
      }
    };

    const content = (
      <div 
        className={`
          flex items-center w-full h-10 rounded-lg transition-all duration-200
          ${isActive ? 'bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]' : 'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'}
          ${isChild ? 'ml-4' : ''}
          ${!isExpanded ? 'justify-center' : 'px-2'}
        `}
        onClick={handleClick}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {isExpanded && (
          <>
            <span className="ml-2 text-sm font-medium flex-1">{item.label}</span>
            {hasChildren && (
              <span className="ml-auto">
                {isAccordionOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
            )}
          </>
        )}
      </div>
    );

    if (item.path) {
      return (
        <Link key={item.label} href={item.path}>
          {content}
        </Link>
      );
    }

    return (
      <button key={item.label} className="w-full">
        {content}
      </button>
    );
  };

  return (
    <div
      className="fixed left-0 top-0 z-50 h-full bg-[var(--menues-bg)] border-r border-[var(--menues-border)] flex flex-col transition-all duration-300 ease-in-out"
      style={{ width: isExpanded ? '240px' : '40px' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-10 mt-2 mb-2">
        <Link href="/organization/dashboard">
          <div className="w-10 h-10 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg flex items-center justify-center font-bold text-lg hover:opacity-80 transition-opacity">
            A
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--menues-border)] mx-2 mb-2" />

      {/* Navigation Menu */}
      <nav className="flex-1 p-1 space-y-1">
        {getCurrentMenu().map(item => (
          <div key={item.label}>
            {renderMenuItem(item)}
            {item.children && openAccordions.includes(item.label.toLowerCase()) && isExpanded && (
              <div className="mt-1 space-y-1">
                {item.children.map(child => renderMenuItem(child, true))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-1 space-y-1 border-t border-[var(--menues-border)] pt-2">
        {/* Settings Button */}
        <Link href="/settings">
          <div className={`
            flex items-center w-full h-10 rounded-lg transition-all duration-200
            text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]
            ${!isExpanded ? 'justify-center' : 'px-2'}
          `}>
            <Settings className="w-4 h-4 flex-shrink-0" />
            {isExpanded && (
              <span className="ml-2 text-sm font-medium">Configuración</span>
            )}
          </div>
        </Link>

        {/* Profile Button */}
        <Link href="/profile">
          <div className={`
            flex items-center w-full h-10 rounded-lg transition-all duration-200
            text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]
            ${!isExpanded ? 'justify-center' : 'px-2'}
          `}>
            <Avatar className="w-4 h-4 flex-shrink-0">
              <AvatarImage src={userData?.user?.avatar_url} />
              <AvatarFallback className="text-xs bg-[var(--accent)] text-[var(--accent-foreground)]">
                {userData?.user?.full_name?.charAt(0) || userData?.user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {isExpanded && (
              <span className="ml-2 text-sm font-medium">Mi Perfil</span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}