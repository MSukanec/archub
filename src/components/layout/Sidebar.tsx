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

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isDocked, isHovered, setDocked, setHovered } = useSidebarStore();
  
  const isExpanded = isDocked || isHovered;

  // Navigation items
  const navigationItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Contactos', href: '/contactos' },
    { icon: Building, label: 'Gestión de Organizaciones', href: '/organizaciones' },
    { icon: FolderOpen, label: 'Gestión de Proyectos', href: '/proyectos' },
    { icon: FileText, label: 'Bitácora de Obra', href: '/bitacora' },
    { icon: DollarSign, label: 'Movimientos', href: '/movimientos' },
  ];

  // Theme toggle mutation
  const toggleThemeMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('Missing required data');
      }
      
      const newTheme = userData.preferences.theme === 'dark' ? 'light' : 'dark';
      
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
        "fixed left-0 top-10 h-[calc(100vh-40px)] bg-background border-r border-border flex flex-col z-40",
        "transition-all duration-300 ease-in-out",
        isExpanded ? "w-[240px]" : "w-[40px]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Navigation Items */}
      <div className="flex-1 py-2 px-1">
        {navigationItems.map((item) => (
          <button
            key={item.href}
            className={cn(
              'flex items-center w-full h-8 rounded-md transition-all duration-300 ease-in-out mb-1',
              location === item.href 
                ? 'bg-muted text-foreground font-semibold' 
                : 'hover:bg-muted transition-colors'
            )}
            onClick={() => navigate(item.href)}
            title={!isExpanded ? item.label : undefined}
          >
            {/* Icon container - fixed position, always centered when collapsed */}
            <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
              <item.icon className="h-5 w-5" />
            </div>
            
            {/* Label - only show when expanded */}
            {isExpanded && (
              <span className="ml-2 text-sm whitespace-nowrap overflow-hidden">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom Section - Fixed Buttons */}
      <div className="py-2 px-1 border-t border-border">
        {/* Settings */}
        <button
          className={cn(
            'flex items-center w-full h-8 rounded-md transition-all duration-300 ease-in-out mb-1',
            location === '/configuracion' 
              ? 'bg-muted text-foreground font-semibold' 
              : 'hover:bg-muted transition-colors'
          )}
          onClick={() => navigate('/configuracion')}
          title={!isExpanded ? 'Configuración' : undefined}
        >
          <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
            <Settings className="h-5 w-5" />
          </div>
          {isExpanded && (
            <span className="ml-2 text-sm whitespace-nowrap overflow-hidden">
              Configuración
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          className={cn(
            'flex items-center w-full h-8 rounded-md transition-all duration-300 ease-in-out mb-1',
            'hover:bg-muted transition-colors'
          )}
          onClick={() => toggleThemeMutation.mutate()}
          disabled={toggleThemeMutation.isPending}
          title={!isExpanded ? 'Cambiar tema' : undefined}
        >
          <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
            {userData?.preferences?.theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </div>
          {isExpanded && (
            <span className="ml-2 text-sm whitespace-nowrap overflow-hidden">
              Cambiar tema
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          className={cn(
            'flex items-center w-full h-8 rounded-md transition-all duration-300 ease-in-out',
            location === '/perfil' 
              ? 'bg-muted text-foreground font-semibold' 
              : 'hover:bg-muted transition-colors'
          )}
          onClick={() => navigate('/perfil')}
          title={!isExpanded ? 'Mi Perfil' : undefined}
        >
          <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
            {userData?.user?.avatar_url ? (
              <img 
                src={userData.user.avatar_url} 
                alt="Avatar"
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <UserCircle className="h-5 w-5" />
            )}
          </div>
          {isExpanded && (
            <span className="ml-2 text-sm whitespace-nowrap overflow-hidden">
              Mi Perfil
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
