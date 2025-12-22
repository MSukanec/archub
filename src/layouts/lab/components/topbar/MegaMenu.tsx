import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, Building, FolderOpen, GraduationCap, Crown, Globe, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationStore, type SidebarLevel } from '@/stores/navigationStore';
import { useProjectContext } from '@/stores/projectContext';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
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
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
}

function MegaMenuTrigger({ label, sublabel, isOpen, onMouseEnter, onMouseLeave, className }: MegaMenuTriggerProps) {
  return (
    <div
      className={cn(
        "h-full flex flex-col justify-center px-4 border-r border-[var(--header-border)] cursor-pointer transition-colors",
        isOpen ? "bg-[var(--card-hover-bg)]" : "hover:bg-[var(--card-hover-bg)]",
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  const handleSelect = (option: ContextOption) => {
    if (option.disabled) return;
    setSidebarLevel(option.id);
    navigate(option.href);
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <MegaMenuTrigger
        sublabel="Contexto"
        label={currentContext.label}
        isOpen={isOpen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-44"
      />
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 w-screen bg-[var(--header-bg)] border-b border-[var(--header-border)] shadow-lg z-50"
          style={{ 
            left: containerRef.current ? -containerRef.current.offsetLeft : 0,
            width: '100vw'
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  const handleSelect = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <MegaMenuTrigger
        sublabel="Página"
        label={getCurrentPageLabel()}
        isOpen={isOpen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-52"
      />
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 w-screen bg-[var(--header-bg)] border-b border-[var(--header-border)] shadow-lg z-50"
          style={{ 
            left: containerRef.current ? -containerRef.current.offsetLeft : 0,
            width: '100vw'
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
