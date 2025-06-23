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
import SidebarButton from "./SidebarButton";
import { useToast } from "@/hooks/use-toast";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isDocked, isHovered, setHovered } = useSidebarStore();
  const { currentSidebarContext } = useNavigationStore();
  const { toast } = useToast();
  
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast({
        title: "Tema actualizado",
        description: "El tema se ha cambiado correctamente"
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "No se pudo cambiar el tema",
        variant: "destructive"
      });
    }
  });

  return (
    <aside 
      className={cn(
        "fixed top-9 left-0 h-[calc(100vh-36px)] border-r bg-[var(--menues-bg)] border-[var(--menues-border)] transition-all duration-300 z-40 flex flex-col",
        isExpanded ? "w-[240px]" : "w-[40px]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Navigation Items */}
      <div className="flex-1 p-1">
        <div className="flex flex-col gap-[2px]">
          {navigationItems.map((item) => (
            <SidebarButton
              key={item.href}
              icon={<item.icon className="w-[18px] h-[18px]" />}
              label={item.label}
              isActive={location === item.href}
              isExpanded={isExpanded}
              onClick={() => navigate(item.href)}
            />
          ))}
        </div>
      </div>

      {/* Bottom Section - Fixed Buttons */}
      <div className="border-t border-[var(--menues-border)] p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Settings */}
          <SidebarButton
            icon={<Settings className="w-[18px] h-[18px]" />}
            label="Configuración"
            isActive={location === '/configuracion'}
            isExpanded={isExpanded}
            onClick={() => navigate('/configuracion')}
          />

          {/* Theme Toggle */}
          <SidebarButton
            icon={userData?.preferences?.theme === 'dark' ? 
              <Sun className="w-[18px] h-[18px]" /> : 
              <Moon className="w-[18px] h-[18px]" />
            }
            label="Cambiar tema"
            isActive={false}
            isExpanded={isExpanded}
            onClick={() => toggleThemeMutation.mutate()}
          />

          {/* Profile */}
          <SidebarButton
            icon={<UserCircle className="w-[18px] h-[18px]" />}
            label="Mi Perfil"
            isActive={location === '/perfil'}
            isExpanded={isExpanded}
            onClick={() => navigate('/perfil')}
            avatarUrl={userData?.user?.avatar_url}
          />
        </div>
      </div>
    </aside>
  );
}