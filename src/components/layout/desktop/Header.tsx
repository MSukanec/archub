import React, { useState } from "react";
import { Search, Bell, Settings, Home, Building, FolderOpen } from "lucide-react";
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

interface HeaderProps {
  // Header principal simplificado - solo props básicas si son necesarias
}

export function Header({}: HeaderProps = {}) {
  const [globalSearchValue, setGlobalSearchValue] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();

  const handleGlobalSearch = (value: string) => {
    setGlobalSearchValue(value);
    // Aquí puedes implementar la lógica de búsqueda global
  };

  const handleLogout = async () => {
    // Implementar logout
    navigate("/");
  };

  const getActiveSection = () => {
    if (location === '/' || location.includes('/dashboard')) return 'inicio';
    if (location.includes('/organization') || location.includes('/finances') || location.includes('/construction') || location.includes('/design') || location.includes('/resources') || location.includes('/members')) return 'organizacion';
    if (location.includes('/project')) return 'proyecto';
    return 'inicio';
  };

  const activeSection = getActiveSection();

  return (
    <div className="fixed top-0 left-0 right-0 w-full z-50 h-12 border-b border-[var(--main-sidebar-border)] bg-[var(--main-sidebar-bg)] transition-all duration-300">
      <div className="w-full h-12 px-6 flex items-center justify-between">
        {/* Left: Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* Inicio */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className={`h-8 transition-all duration-200 ${
              activeSection === 'inicio' 
                ? 'bg-[var(--main-sidebar-button-hover-bg)] text-white px-3' 
                : 'w-8 p-0 hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'inicio' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <Home className="w-4 h-4" />
            {activeSection === 'inicio' && <span className="ml-2 text-sm">Inicio</span>}
          </Button>

          {/* Organización */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/finances')}
            className={`h-8 transition-all duration-200 ${
              activeSection === 'organizacion' 
                ? 'bg-[var(--main-sidebar-button-hover-bg)] text-white px-3' 
                : 'w-8 p-0 hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'organizacion' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <Building className="w-4 h-4" />
            {activeSection === 'organizacion' && <span className="ml-2 text-sm">Organización</span>}
          </Button>

          {/* Proyecto */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/project')}
            className={`h-8 transition-all duration-200 ${
              activeSection === 'proyecto' 
                ? 'bg-[var(--main-sidebar-button-hover-bg)] text-white px-3' 
                : 'w-8 p-0 hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'proyecto' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <FolderOpen className="w-4 h-4" />
            {activeSection === 'proyecto' && <span className="ml-2 text-sm">Proyecto</span>}
          </Button>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-md mx-8">
          <div 
            className="relative flex items-center"
            onMouseLeave={() => {
              if (isSearchExpanded && !searchFocused) {
                setIsSearchExpanded(false);
                setSearchFocused(false);
              }
            }}
          >
            <div className={`
              transition-all duration-300 overflow-hidden w-full
              ${isSearchExpanded ? "opacity-100" : "opacity-100"}
            `}>
              <div className="relative flex items-center h-8 border border-[var(--main-sidebar-button-hover-bg)] rounded-lg bg-[var(--main-sidebar-button-hover-bg)]">
                <Search className="h-4 w-4 ml-3 flex-shrink-0" style={{color: 'var(--main-sidebar-fg)'}} />
                <Input
                  placeholder="Buscar en toda la aplicación..."
                  value={globalSearchValue}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="flex-1 h-full text-sm border-0 bg-transparent font-normal focus:ring-0 focus:outline-none pl-2 pr-3"
                  style={{color: 'var(--main-sidebar-button-hover-fg)', '--placeholder-color': 'var(--main-sidebar-fg)'} as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-[var(--main-sidebar-button-hover-bg)]"
            title="Notificaciones"
            style={{color: 'var(--main-sidebar-fg)'}}
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-[var(--main-sidebar-button-hover-bg)]"
            title="Configuración"
            onClick={() => navigate('/settings')}
            style={{color: 'var(--main-sidebar-fg)'}}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-[var(--main-sidebar-button-hover-bg)]">
                <Avatar className="h-7 w-7">
                  <AvatarImage 
                    src={userData?.user?.avatar_url || ''} 
                    alt={userData?.user?.full_name || 'Usuario'} 
                  />
                  <AvatarFallback className="text-xs">
                    {userData?.user?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[var(--popover-bg)] border-[var(--menues-border)]">
              <div className="px-2 py-1.5 text-sm">
                <div className="font-medium">{userData?.user?.full_name || 'Usuario'}</div>
                <div className="text-xs text-muted-foreground">{userData?.user?.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile/organizations')}>
                Organizaciones
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}