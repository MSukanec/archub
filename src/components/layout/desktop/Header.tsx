import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Building2, 
  FolderOpen, 
  DollarSign, 
  Library, 
  Shield,
  Bell,
  PanelLeftOpen,
  PanelLeftClose,
  Sun,
  Moon
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useThemeStore } from "@/stores/themeStore";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import SidebarButton from "./SidebarButton";

interface Tab {
  id: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
}

interface HeaderProps {
  icon?: React.ComponentType<any>;
  title?: string;
  pageTitle?: string;
  subtitle?: string;
  tabs?: Tab[];
  actions?: React.ReactNode[];
  onTabChange?: (tabId: string) => void;
  showHeaderSearch?: boolean;
  headerSearchValue?: string;
  onHeaderSearchChange?: (value: string) => void;
  action?: {
    icon?: React.ComponentType<any>;
    label: string;
    onClick: () => void;
  };
  showCurrencySelector?: boolean;
  currencyView?: string;
  onCurrencyViewChange?: (view: string) => void;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "secondary" | "outline" | "ghost";
    icon?: React.ComponentType<any>;
  };
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonText?: string;
  isViewMode?: boolean;
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { data: userData, isLoading } = useCurrentUser();
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const { isDocked, setDocked } = useSidebarStore();
  const { isDark, toggleTheme, setTheme } = useThemeStore();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
    savePreferencesMutation.mutate({ sidebar_docked: newDocked });
    
    toast({
      title: newDocked ? "Sidebar anclado" : "Sidebar desanclado",
      description: newDocked ? "El sidebar permanecerá visible" : "El sidebar se ocultará automáticamente"
    });
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(!isDark);
    
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

  // Get user initials for avatar fallback
  const getUserInitials = (): string => {
    if (!userData?.user?.full_name) return 'U';
    const names = userData.user.full_name.trim().split(' ');
    if (names.length > 1) {
      return names.slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
    }
    return userData.user.full_name.slice(0, 2).toUpperCase();
  };

  // Check if user is admin
  const isAdmin = userData?.role?.name === 'Administrador' || userData?.role?.name === 'Admin';
  
  // Check if there's an active project
  const isGlobalView = !userData?.preferences?.last_project_id;

  // Primary navigation sections
  const primarySections = [
    {
      id: 'organization',
      label: 'Organización', 
      icon: Building2,
      level: 'organization' as const,
      isActive: sidebarLevel === 'organization'
    },
    // Only show Project section if there's an active project
    ...(!isGlobalView ? [
      {
        id: 'project',
        label: 'Proyecto',
        icon: FolderOpen,
        level: 'project' as const,
        isActive: sidebarLevel === 'project'
      }
    ] : []),
    {
      id: 'finances',
      label: 'Finanzas',
      icon: DollarSign,
      level: 'finances' as const,
      isActive: sidebarLevel === 'finances'
    },
    {
      id: 'library',
      label: 'Biblioteca',
      icon: Library,
      level: 'library' as const,
      isActive: sidebarLevel === 'library'
    },
    ...(isAdmin ? [{
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      level: 'admin' as const,
      isActive: sidebarLevel === 'admin'
    }] : [])
  ];

  // Handle navigation click
  const handleNavigationClick = (section: any) => {
    setSidebarLevel(section.level);
    
    // Navigate to default route for each section
    switch (section.level) {
      case 'organization':
        navigate('/organization/data');
        break;
      case 'project':
        navigate('/general/info');
        break;
      case 'finances':
        navigate('/organization/finances/movements');
        break;
      case 'library':
        navigate('/library/documentation');
        break;
      case 'admin':
        navigate('/admin/general');
        break;
    }
  };

  if (isLoading || !userData) {
    return null;
  }

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-12 bg-[var(--layout-bg)] border-b border-[var(--menues-border)]",
        "flex items-center justify-between px-4",
        className
      )}
    >
      {/* Left Side - Navigation */}
      <div className="flex items-center gap-1">
        {primarySections.map((section) => (
          <SidebarButton
            key={section.id}
            icon={<section.icon className="w-4 h-4" />}
            label={section.label}
            isActive={section.isActive}
            isExpanded={true} // Header buttons are always expanded
            isHeaderButton={true}
            variant="main"
            onClick={() => handleNavigationClick(section)}
            disableHover={false}
          />
        ))}
      </div>

      {/* Right Side - User Controls */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            // TODO: Implement notifications
            toast({
              title: "Notificaciones",
              description: "Próximamente disponible"
            });
          }}
        >
          <Bell className="w-4 h-4" />
        </Button>

        {/* Dock/Undock Sidebar */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDockToggle}
        >
          {isDocked ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleThemeToggle}
        >
          {isDark ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* User Avatar */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => {
            navigate('/profile');
          }}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage 
              src={userData.user.avatar_url || ""} 
              alt={userData.user.full_name || "User"} 
            />
            <AvatarFallback className="text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  );
}