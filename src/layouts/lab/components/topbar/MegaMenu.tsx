import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, Building, FolderOpen, GraduationCap, Crown, Globe, Award, User, Home, Mail, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationStore, type SidebarLevel } from '@/stores/navigationStore';
import { useProjectContext } from '@/stores/projectContext';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CONTEXT_BUTTONS, 
  ORGANIZATION_NAVIGATION, 
  PROJECT_NAVIGATION, 
  ADMIN_NAVIGATION,
  LEARNING_NAVIGATION,
  COMMUNITY_NAVIGATION,
  type NavigationEntry,
  type NavigationItem
} from '@/config/navigation';

interface MegaMenuTriggerProps {
  label: string;
  sublabel?: string;
  isOpen: boolean;
  className?: string;
}

function MegaMenuTrigger({ label, sublabel, isOpen, className }: MegaMenuTriggerProps) {
  return (
    <div
      className={cn(
        "h-full flex flex-col justify-center px-4 border-r cursor-pointer transition-colors",
        "border-r-[var(--header-border)]",
        isOpen 
          ? "border-t-2 border-t-[var(--accent)]" 
          : "border-t border-t-[var(--header-border)]",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-start text-left">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)] font-medium">
            {sublabel || 'Contexto'}
          </span>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {label}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-3 h-3 text-[var(--text-muted)] transition-transform",
          isOpen && "rotate-180"
        )} />
      </div>
    </div>
  );
}

interface ContextOption {
  id: SidebarLevel;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  description?: string;
  disabled?: boolean;
}

export function ContextMegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const { selectedProjectId } = useProjectContext();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const isFounder = userData?.organization?.settings?.is_founder === true;

  const contextOptions: ContextOption[] = [
    {
      id: 'organization',
      label: 'Organización',
      icon: Building,
      href: '/organization/dashboard',
      description: 'Gestión general, miembros y configuración'
    },
    {
      id: 'project',
      label: 'Proyecto',
      icon: FolderOpen,
      href: '/project/dashboard',
      description: 'Construcción, materiales y bitácora',
      disabled: !selectedProjectId
    },
    {
      id: 'learning',
      label: 'Capacitaciones',
      icon: GraduationCap,
      href: '/learning/dashboard',
      description: 'Cursos y formación profesional'
    },
  ];

  if (isFounder) {
    contextOptions.push({
      id: 'founders',
      label: 'Fundadores',
      icon: Award,
      href: '/founders',
      description: 'Portal exclusivo de fundadores'
    });
  }

  if (isAdmin) {
    contextOptions.push({
      id: 'community',
      label: 'Comunidad',
      icon: Globe,
      href: '/community/dashboard',
      description: 'Gestión de la comunidad'
    });
    contextOptions.push({
      id: 'admin',
      label: 'Administración',
      icon: Crown,
      href: '/admin/dashboard',
      description: 'Panel de administración'
    });
  }

  const currentContext = contextOptions.find(c => c.id === sidebarLevel) || contextOptions[0];

  const handleSelect = (option: ContextOption) => {
    if (option.disabled) return;
    setSidebarLevel(option.id);
    navigate(option.href);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-full"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <MegaMenuTrigger
        sublabel="Contexto"
        label={currentContext.label}
        isOpen={isOpen}
        className="w-[250px]"
      />
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 bg-background border-b border-[var(--header-border)] shadow-lg z-50"
          style={{ 
            left: containerRef.current ? -containerRef.current.offsetLeft : 0,
            width: '100vw',
            marginTop: '-2px'
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {contextOptions.map((option) => {
                const Icon = option.icon;
                const isActive = sidebarLevel === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    disabled={option.disabled}
                    className={cn(
                      "flex flex-col items-start gap-2 p-4 rounded-lg text-left transition-all",
                      "hover:bg-[var(--card-hover-bg)]",
                      isActive && "bg-[var(--accent)]/10 border border-[var(--accent)]/20",
                      option.disabled && "opacity-50 cursor-not-allowed"
                    )}
                    data-testid={`megamenu-context-${option.id}`}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      isActive ? "bg-[var(--accent)] text-white" : "bg-[var(--muted)] text-[var(--foreground)]"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-[var(--foreground)]">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PagesMegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { sidebarLevel } = useNavigationStore();
  const isAdmin = useIsAdmin();

  const getNavigationItems = (): NavigationEntry[] => {
    switch (sidebarLevel) {
      case 'organization':
      case 'general':
        return ORGANIZATION_NAVIGATION;
      case 'project':
        return PROJECT_NAVIGATION;
      case 'learning':
        return LEARNING_NAVIGATION;
      case 'community':
        return COMMUNITY_NAVIGATION;
      case 'admin':
        return ADMIN_NAVIGATION;
      default:
        return ORGANIZATION_NAVIGATION;
    }
  };

  const navigationItems = getNavigationItems();
  
  const getCurrentPageLabel = (): string => {
    for (const item of navigationItems) {
      if ('href' in item && item.href === location) {
        return item.label;
      }
    }
    return 'Seleccionar página';
  };

  const handleSelect = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  const groupedItems = navigationItems.reduce<{ section: string; items: NavigationItem[] }[]>((acc, item) => {
    if ('type' in item && item.type === 'section-header') {
      acc.push({ section: (item as any).label, items: [] });
    } else if ('href' in item && acc.length > 0) {
      acc[acc.length - 1].items.push(item as NavigationItem);
    } else if ('href' in item) {
      if (acc.length === 0) {
        acc.push({ section: 'General', items: [] });
      }
      acc[acc.length - 1].items.push(item as NavigationItem);
    }
    return acc;
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative h-full"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <MegaMenuTrigger
        sublabel="Página"
        label={getCurrentPageLabel()}
        isOpen={isOpen}
        className="w-[250px]"
      />
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 bg-background border-b border-[var(--header-border)] shadow-lg z-50"
          style={{ 
            left: containerRef.current ? -containerRef.current.offsetLeft : 0,
            width: '100vw',
            marginTop: '-2px'
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
              {groupedItems.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <h3 className="text-xs uppercase tracking-wider text-[var(--text-subtle)] font-semibold mb-3">
                    {group.section}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.href)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                            "hover:bg-[var(--card-hover-bg)]",
                            isActive && "bg-[var(--accent)]/10 text-[var(--accent)]"
                          )}
                          data-testid={item.testId || `megamenu-page-${item.id}`}
                        >
                          <Icon className={cn(
                            "w-4 h-4",
                            isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                          )} />
                          <span className={cn(
                            "text-sm",
                            isActive ? "font-medium text-[var(--accent)]" : "text-[var(--foreground)]"
                          )}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export interface PageTab {
  id: string;
  label: string;
}

interface TabsMegaMenuProps {
  tabs: PageTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabsMegaMenu({ tabs, activeTab, onTabChange }: TabsMegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (tabs.length === 0) return null;

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  const handleSelect = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-full w-[250px]"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div
        className={cn(
          "h-full flex flex-col justify-center px-4 border-r cursor-pointer transition-colors",
          "border-r-[var(--header-border)]",
          isOpen 
            ? "border-t-2 border-t-[var(--accent)]" 
            : "border-t border-t-[var(--header-border)]"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)] font-medium">
              Vista
            </span>
            <span className="text-sm font-medium text-[var(--foreground)]">
              {currentTab.label}
            </span>
          </div>
          <ChevronDown className={cn(
            "w-3 h-3 text-[var(--text-muted)] transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </div>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 bg-background border-b border-[var(--header-border)] shadow-lg z-50"
          style={{ 
            left: containerRef.current ? -containerRef.current.offsetLeft : 0,
            width: '100vw',
            marginTop: '-2px'
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelect(tab.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      "hover:bg-[var(--card-hover-bg)]",
                      isActive && "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                    )}
                    data-testid={`megamenu-tab-${tab.id}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UserAvatarMenu() {
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const [avatarPopoverOpen, setAvatarPopoverOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Popover open={avatarPopoverOpen} onOpenChange={setAvatarPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          className="group relative cursor-pointer transition-all duration-200 hover:scale-105 h-full flex items-center px-4"
          data-testid="button-user-menu"
          title="Menú de usuario"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData?.user?.avatar_url} />
            <AvatarFallback className="text-xs font-semibold uppercase bg-accent text-white border-0">
              {userData?.user?.first_name?.[0] || userData?.user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side="bottom" 
        align="end"
        className="w-[200px] p-2"
        sideOffset={8}
      >
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              navigate('/user');
              setAvatarPopoverOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
            data-testid="button-profile"
          >
            <User className="h-4 w-4" />
            <span>Mi Perfil</span>
          </button>
          
          <div className="h-px bg-border my-1" />
          
          <button
            onClick={() => {
              navigate('/');
              setAvatarPopoverOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
            data-testid="button-home"
          >
            <Home className="h-4 w-4" />
            <span>Página de Inicio</span>
          </button>

          <button
            onClick={() => {
              navigate('/contact');
              setAvatarPopoverOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
            data-testid="button-contact"
          >
            <Mail className="h-4 w-4" />
            <span>Contacto</span>
          </button>
          
          <div className="h-px bg-border my-1" />
          
          <button
            onClick={() => {
              navigate('/select-mode');
              setAvatarPopoverOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
            data-testid="button-change-mode"
          >
            <Settings className="h-4 w-4" />
            <span>Cambiar Modo</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left text-foreground hover:text-red-600 dark:hover:text-red-500"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
