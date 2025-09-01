import React, { useState } from "react";
import { Search, Bell, Settings, Home, ChevronRight } from "lucide-react";
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

  const getBreadcrumb = () => {
    // Generar breadcrumb basado en la ruta actual
    if (location.includes('/finances')) return 'Finanzas';
    if (location.includes('/construction')) return 'Construcción';
    if (location.includes('/design')) return 'Diseño';
    if (location.includes('/resources')) return 'Recursos';
    if (location.includes('/members')) return 'Miembros';
    return 'Dashboard';
  };

  return (
    <div className="fixed top-0 left-0 right-0 w-full z-50 h-12 border-b border-[var(--menues-border)] bg-[var(--layout-bg)] transition-all duration-300">
      <div className="w-full h-12 px-6 flex items-center justify-between">
        {/* Left: Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="h-8 px-2 text-sm hover:text-foreground"
          >
            <Home className="w-4 h-4" />
          </Button>
          <ChevronRight className="w-3 h-3" />
          <span>{getBreadcrumb()}</span>
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
              <div className="relative flex items-center h-8 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)]">
                <Search className="h-4 w-4 ml-3 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder="Buscar en toda la aplicación..."
                  value={globalSearchValue}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="flex-1 h-full text-sm border-0 bg-transparent font-normal placeholder:text-[var(--muted-foreground)] focus:ring-0 focus:outline-none pl-2 pr-3"
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
            className="h-8 w-8 p-0"
            title="Notificaciones"
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Configuración"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
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
            <DropdownMenuContent align="end" className="w-56">
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