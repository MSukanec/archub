import React, { useState, useEffect } from "react";
import { Search, Bell, Settings, Home, Building, FolderOpen, PanelLeftOpen, PanelLeftClose, Sun, Moon, Library, Package, Crown } from "lucide-react";
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

interface HeaderProps {
  // Header principal simplificado - solo props básicas si son necesarias
}

export function Header({}: HeaderProps = {}) {
  const [globalSearchValue, setGlobalSearchValue] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Sidebar state
  const { isDocked, setDocked } = useSidebarStore();
  const { setSidebarLevel } = useNavigationStore();
  const { setDocked: setSecondarySidebarDocked } = useSecondarySidebarStore();
  
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

  const handleGlobalSearch = (value: string) => {
    setGlobalSearchValue(value);
    // Aquí puedes implementar la lógica de búsqueda global
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
    if (location === '/' || location.includes('/dashboard')) return 'inicio';
    if (location.includes('/organization') || location.includes('/finances') || location.includes('/construction') || location.includes('/design') || location.includes('/resources') || location.includes('/members')) return 'organizacion';
    if (location.includes('/project')) return 'proyecto';
    if (location.includes('/library')) return 'biblioteca';
    if (location.includes('/proveedor')) return 'proveedor';
    if (location.includes('/admin')) return 'administracion';
    return 'inicio';
  };

  const activeSection = getActiveSection();

  return (
    <div className="fixed top-0 left-0 right-0 w-full z-50 h-12 border-b border-[var(--main-sidebar-border)] bg-[var(--main-sidebar-bg)] transition-all duration-300">
      <div className="w-full h-12 p-1 flex items-center justify-between">
        {/* Left: Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* Inicio */}
          <button
            onClick={() => {
              navigate('/');
              setSidebarLevel('main');
            }}
            className={`h-8 flex items-center rounded transition-all duration-200 ${
              activeSection === 'inicio' 
                ? 'bg-[var(--main-sidebar-button-hover-bg)] text-white px-3' 
                : 'w-8 justify-center hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'inicio' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <Home className="w-4 h-4" />
            {activeSection === 'inicio' && <span className="ml-2 text-sm">Inicio</span>}
          </button>

          {/* Organización */}
          <button
            onClick={() => {
              navigate('/finances');
              setSidebarLevel('organization');
            }}
            className={`h-8 flex items-center rounded transition-all duration-200 ${
              activeSection === 'organizacion' 
                ? 'bg-[var(--main-sidebar-button-hover-bg)] text-white px-3' 
                : 'w-8 justify-center hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'organizacion' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <Building className="w-4 h-4" />
            {activeSection === 'organizacion' && <span className="ml-2 text-sm">Organización</span>}
          </button>

          {/* Proyecto */}
          <button
            onClick={() => {
              navigate('/project');
              setSidebarLevel('project');
            }}
            className={`h-8 flex items-center rounded transition-all duration-200 ${
              activeSection === 'proyecto' 
                ? 'bg-[var(--main-sidebar-button-hover-bg)] text-white px-3' 
                : 'w-8 justify-center hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'proyecto' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <FolderOpen className="w-4 h-4" />
            {activeSection === 'proyecto' && <span className="ml-2 text-sm">Proyecto</span>}
          </button>

          {/* Biblioteca */}
          <button
            onClick={() => {
              navigate('/library');
              setSidebarLevel('library');
            }}
            className={`h-8 flex items-center rounded transition-all duration-200 ${
              activeSection === 'biblioteca' 
                ? 'bg-[var(--main-sidebar-button-hover-bg)] text-white px-3' 
                : 'w-8 justify-center hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'biblioteca' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <Library className="w-4 h-4" />
            {activeSection === 'biblioteca' && <span className="ml-2 text-sm">Biblioteca</span>}
          </button>

          {/* Proveedor */}
          <button
            onClick={() => {
              navigate('/proveedor');
              setSidebarLevel('provider');
            }}
            className={`h-8 flex items-center rounded transition-all duration-200 ${
              activeSection === 'proveedor' 
                ? 'bg-[var(--main-sidebar-button-hover-bg)] text-white px-3' 
                : 'w-8 justify-center hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'proveedor' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <Package className="w-4 h-4" />
            {activeSection === 'proveedor' && <span className="ml-2 text-sm">Proveedor</span>}
          </button>

          {/* Administración */}
          <button
            onClick={() => {
              navigate('/admin');
              setSidebarLevel('admin');
            }}
            className={`h-8 flex items-center rounded transition-all duration-200 ${
              activeSection === 'administracion' 
                ? 'bg-[var(--main-sidebar-button-hover-bg)] text-white px-3' 
                : 'w-8 justify-center hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
            style={{color: activeSection === 'administracion' ? 'white' : 'var(--main-sidebar-fg)'}}
          >
            <Crown className="w-4 h-4" />
            {activeSection === 'administracion' && <span className="ml-2 text-sm">Administración</span>}
          </button>
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
          <button
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[var(--main-sidebar-button-hover-bg)] transition-all duration-200"
            title="Notificaciones"
            style={{color: 'var(--main-sidebar-fg)'}}
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Sidebar Pin/Unpin */}
          <button
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[var(--main-sidebar-button-hover-bg)] transition-all duration-200"
            title={isDocked ? "Desanclar Sidebar" : "Anclar Sidebar"}
            onClick={handleDockToggle}
            style={{color: 'var(--main-sidebar-fg)'}}
          >
            {isDocked ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[var(--main-sidebar-button-hover-bg)] transition-all duration-200"
            title={isDark ? "Modo Claro" : "Modo Oscuro"}
            onClick={handleThemeToggle}
            style={{color: 'var(--main-sidebar-fg)'}}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Settings */}
          <button
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[var(--main-sidebar-button-hover-bg)] transition-all duration-200"
            title="Configuración"
            onClick={() => navigate('/settings')}
            style={{color: 'var(--main-sidebar-fg)'}}
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[var(--main-sidebar-button-hover-bg)] transition-all duration-200">
                <Avatar className="h-7 w-7">
                  <AvatarImage 
                    src={userData?.user?.avatar_url || ''} 
                    alt={userData?.user?.full_name || 'Usuario'} 
                  />
                  <AvatarFallback className="text-xs">
                    {userData?.user?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
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