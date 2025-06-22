import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Building,
  Palette,
  HardHat,
  DollarSign,
  Settings,
  User,
  Moon,
  Sun,
  Home,
  Users,
  FileText,
  TrendingUp,
  ClipboardList,
  Calculator,
  UserCircle,
  Shield,
} from "lucide-react";

// Define sidebar contexts
const sidebarContexts = {
  organizacion: [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Contactos', href: '/contactos', icon: Users },
    { label: 'Gestión de Organizaciones', href: '/organizaciones', icon: Building },
  ],
  diseno: [
    { label: 'Planos', href: '/planos', icon: FileText },
    { label: 'Especificaciones', href: '/especificaciones', icon: ClipboardList },
    { label: 'Aprobaciones', href: '/aprobaciones', icon: Shield },
  ],
  obra: [
    { label: 'Gestión de Proyectos', href: '/proyectos', icon: Building },
    { label: 'Bitácora de Obra', href: '/bitacora', icon: FileText },
    { label: 'Avances', href: '/avances', icon: TrendingUp },
  ],
  finanzas: [
    { label: 'Movimientos', href: '/movimientos', icon: DollarSign },
    { label: 'Presupuestos', href: '/presupuestos', icon: Calculator },
    { label: 'Reportes', href: '/reportes', icon: TrendingUp },
  ]
};

// Define context mapping based on routes
const getContextFromLocation = (location: string): string => {
  if (location.startsWith('/planos') || location.startsWith('/especificaciones') || location.startsWith('/aprobaciones')) {
    return 'diseno';
  }
  if (location.startsWith('/proyectos') || location.startsWith('/bitacora') || location.startsWith('/avances')) {
    return 'obra';
  }
  if (location.startsWith('/movimientos') || location.startsWith('/presupuestos') || location.startsWith('/reportes')) {
    return 'finanzas';
  }
  return 'organizacion'; // Default
};

export function Sidebar() {
  const [location] = useLocation();
  const { data: userData } = useCurrentUser();
  
  // Determine current context based on location
  const currentContext = getContextFromLocation(location);
  const currentItems = sidebarContexts[currentContext as keyof typeof sidebarContexts] || sidebarContexts.organizacion;



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







  return (
    <aside
      className="fixed left-0 top-10 h-[calc(100vh-40px)] w-64 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col z-40"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--sidebar-border)'
      }}
    >
      {/* Context Selector */}
      <div className="p-4 border-b border-[var(--sidebar-border)]">
        <div className="flex gap-1">
          <Button
            variant={currentContext === 'organizacion' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 text-xs"
            asChild
          >
            <Link href="/dashboard">
              <Building className="h-3 w-3 mr-1" />
              Organización
            </Link>
          </Button>
          <Button
            variant={currentContext === 'diseno' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 text-xs"
            asChild
          >
            <Link href="/planos">
              <Palette className="h-3 w-3 mr-1" />
              Diseño
            </Link>
          </Button>
          <Button
            variant={currentContext === 'obra' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 text-xs"
            asChild
          >
            <Link href="/proyectos">
              <HardHat className="h-3 w-3 mr-1" />
              Obra
            </Link>
          </Button>
          <Button
            variant={currentContext === 'finanzas' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 text-xs"
            asChild
          >
            <Link href="/movimientos">
              <DollarSign className="h-3 w-3 mr-1" />
              Finanzas
            </Link>
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2">
        {currentItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-9 px-3 mb-1 text-sm font-normal",
                "hover:bg-[var(--sidebar-hover-bg)]",
                location === item.href && "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]"
              )}
              style={{
                backgroundColor: location === item.href ? 'var(--sidebar-active-bg)' : 'transparent',
                color: location === item.href ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg)'
              }}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-[var(--sidebar-border)]">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          className="w-full justify-start h-9 px-3 mb-1 text-sm font-normal hover:bg-[var(--sidebar-hover-bg)]"
          onClick={() => toggleThemeMutation.mutate()}
          disabled={toggleThemeMutation.isPending}
        >
          {userData?.preferences?.theme === 'dark' ? (
            <Sun className="mr-3 h-4 w-4" />
          ) : (
            <Moon className="mr-3 h-4 w-4" />
          )}
          Cambiar tema
        </Button>

        {/* Profile */}
        <Link href="/perfil">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-9 px-3 mb-1 text-sm font-normal",
              "hover:bg-[var(--sidebar-hover-bg)]",
              location === '/perfil' && "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]"
            )}
            style={{
              backgroundColor: location === '/perfil' ? 'var(--sidebar-active-bg)' : 'transparent',
              color: location === '/perfil' ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg)'
            }}
          >
            {userData?.user?.avatar_url ? (
              <img 
                src={userData.user.avatar_url} 
                alt="Avatar"
                className="w-4 h-4 rounded-full mr-3"
              />
            ) : (
              <UserCircle className="mr-3 h-4 w-4" />
            )}
            Mi Perfil
          </Button>
        </Link>

        {/* Settings */}
        <Link href="/configuracion">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-9 px-3 text-sm font-normal",
              "hover:bg-[var(--sidebar-hover-bg)]",
              location === '/configuracion' && "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]"
            )}
            style={{
              backgroundColor: location === '/configuracion' ? 'var(--sidebar-active-bg)' : 'transparent',
              color: location === '/configuracion' ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg)'
            }}
          >
            <Settings className="mr-3 h-4 w-4" />
            Configuración
          </Button>
        </Link>
      </div>
    </aside>
  );
}