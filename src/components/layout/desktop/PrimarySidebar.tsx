import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  FolderOpen,
  HardHat,
  Library,
  Shield,
  Sun,
  Moon,
  PanelLeftOpen,
  PanelLeftClose,
  Bell
} from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { supabase } from "@/lib/supabase";
import SidebarButton from "./SidebarButton";

export function PrimarySidebar() {
  const [location, navigate] = useLocation();
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const isAdmin = useIsAdmin();
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Sidebar state
  const { isDocked, setDocked } = useSidebarStore();
  const { setDocked: setSecondarySidebarDocked } = useSecondarySidebarStore();
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Initialize theme from user preferences
  useEffect(() => {
    const currentTheme = (userData?.preferences?.theme as 'light' | 'dark') || 'light';
    setTheme(currentTheme);
    
    // Apply theme to document
    const rootElement = document.documentElement;
    if (currentTheme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
  }, [userData?.preferences?.theme]);

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
      description: newDocked ? "El sidebar permanecerá visible" : "El sidebar se ocultará automáticamente"
    });
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Apply theme to document
    const rootElement = document.documentElement;
    if (newTheme === 'dark') {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
    
    // Save theme preference
    savePreferencesMutation.mutate({ theme: newTheme });
    
    toast({
      title: `Modo ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`,
      description: `La interfaz ahora está en modo ${newTheme === 'dark' ? 'oscuro' : 'claro'}`
    });
  };

  const primarySections = [
    {
      id: 'organization',
      label: 'Organización', 
      icon: Building2,
      level: 'organization' as const,
      navigateTo: false
    },
    {
      id: 'project',
      label: 'Proyecto',
      icon: FolderOpen,
      level: 'project' as const,
      navigateTo: false
    },
    {
      id: 'construction',
      label: 'Construcción',
      icon: HardHat,
      level: 'construction' as const,
      navigateTo: false
    },
    {
      id: 'library',
      label: 'Biblioteca',
      icon: Library,
      level: 'library' as const,
      navigateTo: false
    },
    ...(isAdmin ? [{
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      level: 'admin' as const,
      navigateTo: false
    }] : [])
  ];

  const handleSectionClick = (section: typeof primarySections[0]) => {
    setSidebarLevel(section.level);
  };

  const isActive = (level: string) => {
    return sidebarLevel === level;
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen z-50 bg-[var(--main-sidebar-bg)] border-r border-[var(--main-sidebar-border)] transition-all duration-300",
        "w-[40px] flex flex-col"
      )}
      style={{
        overflow: 'hidden'
      }}
    >
      {/* Logo Archub - misma altura que PageHeader */}
      <div className="h-12 flex-shrink-0 flex items-center justify-center">
        <span className="text-xl font-black text-white">
          A
        </span>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 p-1">
        <div className="flex flex-col gap-[2px] h-full">
        {primarySections.map((section) => (
          <SidebarButton
            key={section.id}
            icon={<section.icon className="w-[18px] h-[18px]" />}
            label={section.label}
            isActive={isActive(section.level)}
            isExpanded={false}
            onClick={() => handleSectionClick(section)}
            variant="main"
          />
        ))}
        </div>
      </div>
      
      {/* Bottom Section - Fixed Buttons */}
      <div className="p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Divisor */}
          <div className="h-px bg-white/20 mb-2"></div>
          
          {/* Theme Toggle */}
          <SidebarButton
            icon={theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            label={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
            isExpanded={false}
            onClick={handleThemeToggle}
            variant="main"
          />
          
          {/* Sidebar Pin/Unpin */}
          <SidebarButton
            icon={isDocked ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
            label={isDocked ? "Desanclar Sidebar" : "Anclar Sidebar"}
            isExpanded={false}
            onClick={handleDockToggle}
            variant="main"
          />
          
          {/* Notifications */}
          <SidebarButton
            icon={<Bell className="w-[18px] h-[18px]" />}
            label="Notificaciones"
            isExpanded={false}
            onClick={() => console.log('Notificaciones clicked')}
            variant="main"
          />
          
          {/* User Avatar */}
          <SidebarButton
            avatarUrl={userData?.user?.avatar_url}
            userFullName={userData?.user?.full_name}
            label={userData?.user?.full_name || 'Usuario'}
            isExpanded={false}
            onClick={() => navigate('/profile')}
            variant="main"
            disableHover={true}
          />
          
        </div>
      </div>
    </aside>
  );
}