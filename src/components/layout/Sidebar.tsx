import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Home,
  Users,
  Building,
  Settings,
  Moon,
  Sun,
  UserCircle,
  FileText,
  DollarSign,
} from "lucide-react";

// Default organization sidebar items
const organizationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Contactos', href: '/contactos', icon: Users },
  { label: 'Gestión de Organizaciones', href: '/organizaciones', icon: Building },
];

// TODO: Add other sidebar contexts (project, design, construction, finance)
const getSidebarItems = (context: string) => {
  switch (context) {
    case 'organization':
    default:
      return organizationItems;
  }
};

export function Sidebar() {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: userData } = useCurrentUser();
  
  // For now, always show organization context
  // TODO: Make this dynamic based on which breadcrumb is clicked
  const currentContext = 'organization';
  const currentItems = getSidebarItems(currentContext);



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
      className={cn(
        "fixed left-0 top-10 h-[calc(100vh-40px)] bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col z-40 transition-all duration-200",
        isExpanded ? "w-64" : "w-12"
      )}
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--sidebar-border)'
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Navigation Items */}
      <nav className="flex-1 p-2">
        {currentItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-9 mb-1 text-sm font-normal",
                "hover:bg-[var(--sidebar-hover-bg)]",
                location === item.href && "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]",
                !isExpanded && "px-2" // Centered when collapsed
              )}
              style={{
                backgroundColor: location === item.href ? 'var(--sidebar-active-bg)' : 'transparent',
                color: location === item.href ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg)'
              }}
            >
              <item.icon className={cn("h-4 w-4", isExpanded && "mr-3")} />
              {isExpanded && <span>{item.label}</span>}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-[var(--sidebar-border)]">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-9 mb-1 text-sm font-normal hover:bg-[var(--sidebar-hover-bg)]",
            !isExpanded && "px-2"
          )}
          onClick={() => toggleThemeMutation.mutate()}
          disabled={toggleThemeMutation.isPending}
        >
          {userData?.preferences?.theme === 'dark' ? (
            <Sun className={cn("h-4 w-4", isExpanded && "mr-3")} />
          ) : (
            <Moon className={cn("h-4 w-4", isExpanded && "mr-3")} />
          )}
          {isExpanded && <span>Cambiar tema</span>}
        </Button>

        {/* Profile */}
        <Link href="/perfil">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-9 mb-1 text-sm font-normal",
              "hover:bg-[var(--sidebar-hover-bg)]",
              location === '/perfil' && "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]",
              !isExpanded && "px-2"
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
                className={cn("w-4 h-4 rounded-full", isExpanded && "mr-3")}
              />
            ) : (
              <UserCircle className={cn("h-4 w-4", isExpanded && "mr-3")} />
            )}
            {isExpanded && <span>Mi Perfil</span>}
          </Button>
        </Link>

        {/* Settings */}
        <Link href="/configuracion">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-9 text-sm font-normal",
              "hover:bg-[var(--sidebar-hover-bg)]",
              location === '/configuracion' && "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]",
              !isExpanded && "px-2"
            )}
            style={{
              backgroundColor: location === '/configuracion' ? 'var(--sidebar-active-bg)' : 'transparent',
              color: location === '/configuracion' ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg)'
            }}
          >
            <Settings className={cn("h-4 w-4", isExpanded && "mr-3")} />
            {isExpanded && <span>Configuración</span>}
          </Button>
        </Link>
      </div>
    </aside>
  );
}