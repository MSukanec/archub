import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Settings, 
  Moon, 
  Sun, 
  UserCircle,
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  FolderOpen
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isDocked, isHovered, setDocked, setHovered } = useSidebarStore();
  const { currentSidebarContext } = useNavigationStore();
  
  const isExpanded = isDocked || isHovered;

  // Different navigation items based on context
  const sidebarContexts = {
    organization: [
      { icon: Home, label: 'Dashboard', href: '/dashboard' },
      { icon: Users, label: 'Contactos', href: '/contactos' },
      { icon: Building, label: 'Gestión de Organizaciones', href: '/organizaciones' },
    ],
    project: [
      { icon: FolderOpen, label: 'Gestión de Proyectos', href: '/proyectos' },
      { icon: FileText, label: 'Bitácora de Obra', href: '/bitacora' },
      { icon: DollarSign, label: 'Movimientos', href: '/movimientos' },
    ]
  };

  const navigationItems = sidebarContexts[currentSidebarContext] || sidebarContexts.organization;

  // Theme toggle mutation
  const toggleThemeMutation = useMutation({
    mutationFn: async () => {
      const currentTheme = userData?.preferences?.theme || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('Missing required data');
      }
      
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

  return (
    <aside 
      className={cn(
        "fixed top-9 left-0 h-[calc(100vh-36px)] border-r bg-[var(--menues-bg)] border-[var(--menues-border)] transition-all z-40 flex flex-col",
        isExpanded ? "w-[240px]" : "w-[40px]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Navigation Items */}
      <div className="flex-1 py-2">
        <div className="flex flex-col gap-1">
          {navigationItems.map((item) => (
            <button
              key={item.href}
              className={cn(
                'flex items-center px-2 py-2 mx-1 rounded-md transition-all gap-2',
                isExpanded ? '' : 'justify-center',
                location === item.href 
                  ? 'bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]' 
                  : 'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
              )}
              onClick={() => navigate(item.href)}
              title={!isExpanded ? item.label : undefined}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <item.icon className="h-4 w-4" />
              </div>
              {isExpanded && (
                <span className="text-sm truncate ml-2">{item.label}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Section - Fixed Buttons */}
      <div className="border-t border-[var(--menues-border)] py-2">
        <div className="flex flex-col gap-1">
          {/* Settings */}
          <button
            className={cn(
              'flex items-center px-2 py-2 mx-1 rounded-md transition-all gap-2',
              isExpanded ? '' : 'justify-center',
              location === '/configuracion' 
                ? 'bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]' 
                : 'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
            )}
            onClick={() => navigate('/configuracion')}
            title={!isExpanded ? 'Configuración' : undefined}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <Settings className="h-4 w-4" />
            </div>
            {isExpanded && (
              <span className="text-sm truncate ml-2">Configuración</span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            className={cn(
              'flex items-center px-2 py-2 mx-1 rounded-md transition-all gap-2',
              isExpanded ? '' : 'justify-center',
              'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
            )}
            onClick={() => toggleThemeMutation.mutate()}
            disabled={toggleThemeMutation.isPending}
            title={!isExpanded ? 'Cambiar tema' : undefined}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {userData?.preferences?.theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </div>
            {isExpanded && (
              <span className="text-sm truncate ml-2">Cambiar tema</span>
            )}
          </button>

          {/* Profile */}
          <button
            className={cn(
              'flex items-center px-2 py-2 mx-1 rounded-md transition-all gap-2',
              isExpanded ? '' : 'justify-center',
              location === '/perfil' 
                ? 'bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]' 
                : 'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
            )}
            onClick={() => navigate('/perfil')}
            title={!isExpanded ? 'Mi Perfil' : undefined}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {userData?.user?.avatar_url ? (
                <img 
                  src={userData.user.avatar_url} 
                  alt="Avatar"
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <UserCircle className="h-4 w-4" />
              )}
            </div>
            {isExpanded && (
              <span className="text-sm truncate ml-2">Mi Perfil</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}