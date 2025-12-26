import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Building,
  FolderOpen,
  Home,
  ChevronDown,
  Crown,
  GraduationCap,
  ArrowLeft,
  Globe,
  Palette,
  FileText,
  Users,
  Package,
  Layers,
  BookOpen,
  DollarSign,
  LogOut,
  User
} from "lucide-react";
import { 
  getNavigationItems, 
  getDividerInfo, 
  getContextTitle,
  CONTEXT_BUTTONS,
  MARKETING_NAVIGATION,
  type NavigationItem,
  type NavigationSection,
  type NavigationEntry,
  type SidebarLevel
} from "@/config/navigation";
import { MobileMenuButton } from "./MobileMenuButton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { Link, useLocation } from "wouter";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useMobileMenuStore } from "./useMobileMenuStore";
import { useProjects } from "@/features/projects";
import { PlanRestricted } from "@/features/users";
import { ComingSoonRestricted } from "@/components/shared/restrictions/guards/ComingSoonRestricted";
import { RoleRestricted } from "@/components/shared/restrictions/guards/RoleRestricted";
import { useProjectContext } from "@/stores/projectContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useUnreadSupportMessages } from "@/hooks/use-unread-support-messages";
import { useAuthStore } from "@/stores/authStore";
interface MobileMenuProps {
  onClose?: () => void;
  isOpen?: boolean;
}
interface ContentProps {
  onClose: () => void;
}
function MarketingMenuContent({ onClose }: ContentProps) {
  const [location, navigate] = useLocation();
  const { user: authUser, logout: authLogout } = useAuthStore();
  const handleMarketingNavClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth'});
      }
    } else {
      navigate(href);
    }
    onClose();
  };
  const handleLogout = () => {
    authLogout();
    onClose();
  };
  return (
    <>
      <nav>
        {authUser ? (
          <>
            <div onClick={() => { handleMarketingNavClick('/home'); }}>
              <MobileMenuButton
                icon={Home}
                label="Dashboard"
                onClick={() => {}}
                isActive={false}
                showChevron={false}
                testId="button-mobile-dashboard"
              />
            </div>
            <MobileMenuButton
              icon={LogOut}
              label="Cerrar sesión"
              onClick={handleLogout}
              isActive={false}
              showChevron={false}
              testId="button-mobile-logout"
            />
          </>
        ) : (
          <>
            <div onClick={() => { handleMarketingNavClick('/login'); }}>
              <MobileMenuButton
                icon={User}
                label="Iniciar Sesión"
                onClick={() => {}}
                isActive={false}
                showChevron={false}
                testId="button-mobile-login"
              />
            </div>
            <div onClick={() => { handleMarketingNavClick('/register'); }}>
              <MobileMenuButton
                icon={User}
                label="Comenzar Gratis"
                onClick={() => {}}
                isActive={false}
                showChevron={false}
                testId="button-mobile-register"
              />
            </div>
          </>
        )}
        <div className="h-6" />
        {MARKETING_NAVIGATION.map((item) => (
          <div key={item.id} onClick={() => handleMarketingNavClick(item.href)}>
            <MobileMenuButton
              icon={item.icon}
              label={item.label}
              onClick={() => {}}
              isActive={location === item.href}
              showChevron={false}
              testId={item.testId}
            />
          </div>
        ))}
      </nav>
      <div className="flex-1" />
    </>
  );
}
function DashboardMenuContent({ onClose }: ContentProps) {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const { selectedProjectId, setSelectedProject } = useProjectContext();
  
  const [expandedProjectSelector, setExpandedProjectSelector] = useState(false);
  const [expandedOrganizationSelector, setExpandedOrganizationSelector] = useState(false);
  
  const queryClient = useQueryClient();
  const currentOrganization = userData?.organization;
  const { data: projectsData } = useProjects(currentOrganization?.id);
  
  const currentProject = projectsData?.find((p: any) => p.id === selectedProjectId);
  const currentProjectName = currentProject?.name || "Seleccionar proyecto";
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const { data: notifications } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    enabled: !!userData?.user?.id,
  });
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.read_at).length : 0;
  const { data: unreadSupportCount = 0 } = useUnreadSupportMessages();
  const projectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !userData?.organization?.id) {
        throw new Error('No user or organization available');
      }
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert(
          {
            user_id: userData.user.id,
            organization_id: userData.organization.id,
            last_project_id: projectId,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,organization_id'}
        );
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      setSelectedProject(projectId);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
      setExpandedProjectSelector(false);
    }
  });
  const isButtonActive = (href: string) => {
    if (!href || href === '#') return false;
    
    if (href === '/organization/dashboard'|| href === '/project/dashboard'|| href === '/project') {
      return location === href;
    }
    
    if (href.startsWith('http')) {
      return false;
    }
    return location === href || location.startsWith(href + '/');
  };
  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    projectMutation.mutate(projectId);
    onClose();
  };
  const organizationName = userData?.organization?.name || 'Organización';
  const userFullName = userData?.user?.full_name || userData?.user?.first_name || 'Usuario';
  const navigationItems = getNavigationItems({
    sidebarLevel: sidebarLevel as SidebarLevel,
    selectedProjectId,
    isAdmin,
    organizationName,
    userFullName,
  });
  const handleContextChange = (newLevel: SidebarLevel) => {
    setSidebarLevel(newLevel as any);
  };
  const handleInternalNavigation = (href: string) => {
    navigate(href);
    onClose();
  };
  return (
    <>
      <div className="flex items-center h-14 px-4 bg-[var(--mobile-menu-header-bg)] relative">
        {sidebarLevel !== 'general'? (
          <>
            <button
              onClick={() => {
                setSidebarLevel('general');
              }}
              className="absolute left-4 p-2 hover:bg-[var(--mobile-menu-item-active-bg)] rounded-lg transition-colors z-10"
              data-testid="button-mobile-back"
            >
              <ArrowLeft className="h-5 w-5 text-[var(--mobile-menu-fg)]" />
            </button>
            <h1 className="flex-1 text-center text-lg font-semibold text-[var(--mobile-menu-fg)]">
              {getContextTitle(sidebarLevel as SidebarLevel)}
            </h1>
            <button
              onClick={onClose}
              className="absolute right-4 p-2 hover:bg-[var(--mobile-menu-item-active-bg)] rounded-lg transition-colors z-10"
            >
              <X className="h-5 w-5 text-[var(--mobile-menu-fg)]" />
            </button>
          </>
        ) : (
          <>
            <h1 className="flex-1 text-center text-lg font-semibold text-[var(--mobile-menu-fg)]">
              {getContextTitle(sidebarLevel as SidebarLevel)}
            </h1>
            <button
              onClick={onClose}
              className="absolute right-4 p-2 hover:bg-[var(--mobile-menu-item-active-bg)] rounded-lg transition-colors z-10"
            >
              <X className="h-5 w-5 text-[var(--mobile-menu-fg)]" />
            </button>
          </>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav>
          {sidebarLevel === 'general'? (
            <>
              {CONTEXT_BUTTONS.map((contextButton) => {
                const hasProjects = projectsData && projectsData.length > 0;
                if (contextButton.id === 'project') {
                  if (!hasProjects || !selectedProjectId) {
                    return null;
                  }
                  const isActive = contextButton.href ? isButtonActive(contextButton.href) : 
                    location.startsWith('/project') || location.startsWith('/budgets') || 
                    location.startsWith('/construction') || location.startsWith('/clients');
                  
                  return (
                    <MobileMenuButton
                      key={contextButton.id}
                      icon={contextButton.icon}
                      label={contextButton.label}
                      onClick={() => {
                        handleContextChange('project');
                      }}
                      isActive={isActive}
                      showChevron={true}
                      testId={contextButton.testId.replace('sidebar', 'mobile')}
                    />
                  );
                }
                const isActive = contextButton.href ? isButtonActive(contextButton.href) :
                  location.startsWith(`/${contextButton.id}`);
                const handleClick = () => {
                  if (contextButton.adminOnly && !isAdmin) return;
                  handleContextChange(contextButton.id as SidebarLevel);
                };
                const button = (
                  <MobileMenuButton
                    icon={contextButton.icon}
                    label={contextButton.label}
                    onClick={handleClick}
                    isActive={isActive}
                    showChevron={true}
                    testId={contextButton.testId.replace('sidebar', 'mobile')}
                  />
                );
                if (contextButton.id === 'founders'|| contextButton.id === 'community') {
                  return (
                    <RoleRestricted key={contextButton.id} requiredRole="admin" hideCompletely showAsPreview>
                      {button}
                    </RoleRestricted>
                  );
                }
                if (contextButton.restricted === "coming_soon") {
                  return (
                    <ComingSoonRestricted key={contextButton.id}>
                      {button}
                    </ComingSoonRestricted>
                  );
                }
                if (contextButton.adminOnly && !isAdmin) {
                  return null;
                }
                return <div key={contextButton.id}>{button}</div>;
              })}
            </>
          ) : (
            <>
              {navigationItems.map((entry, index) => {
                if ('type'in entry && entry.type === 'section') {
                  const section = entry as NavigationSection;
                  return (
                    <div key={`section-${index}`}>
                      <div className="px-6 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--mobile-menu-item-fg)] opacity-40">
                        {section.title}
                      </div>
                      {section.items.map((item) => {
                        const isActive = isButtonActive(item.href);
                        const isExternal = item.href.startsWith('http');
                        
                        const button = (
                          <MobileMenuButton
                            icon={item.icon}
                            label={item.label}
                          onClick={() => {
                            if (isExternal) {
                              window.open(item.href, '_blank');
                            } else {
                              handleInternalNavigation(item.href);
                            }
                          }}
                            isActive={isActive}
                            showChevron={false}
                            testId={item.testId || `button-mobile-${item.id}`}
                            badgeCount={item.id === 'support'&& isAdmin ? unreadSupportCount : undefined}
                          />
                        );
                        
                        return (
                          <div key={item.id}>
                            {item.restricted === "coming_soon" ? (
                              <ComingSoonRestricted>
                                {button}
                              </ComingSoonRestricted>
                            ) : item.restricted === "lab_user" ? (
                              <RoleRestricted requiredRole="lab_user" hideCompletely>
                                {button}
                              </RoleRestricted>
                            ) : (
                              button
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                
                if ('type'in entry && entry.type === 'section-header') {
                  return (
                    <div key={`header-${entry.id}`} className="px-6 py-2 mt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--mobile-menu-item-fg)] opacity-40">
                      {entry.label}
                    </div>
                  );
                }
                
                if ('type'in entry && entry.type === 'spacer') {
                  return <div key={`spacer-${entry.id}`} className="h-2" />;
                }
                
                const item = entry as NavigationItem;
                const isActive = isButtonActive(item.href);
                const isExternal = item.href.startsWith('http');
                
                const button = (
                  <MobileMenuButton
                    icon={item.icon}
                    label={item.label}
                    onClick={() => {
                      if (isExternal) {
                        window.open(item.href, '_blank');
                      } else {
                        handleInternalNavigation(item.href);
                      }
                    }}
                    isActive={isActive}
                    showChevron={false}
                    testId={item.testId || `button-mobile-${item.id}`}
                    badgeCount={item.id === 'support'&& isAdmin ? unreadSupportCount : undefined}
                  />
                );
                
                return (
                  <div key={item.id}>
                    {item.restricted === "coming_soon" ? (
                      <ComingSoonRestricted>
                        {button}
                      </ComingSoonRestricted>
                    ) : item.restricted === "lab_user" ? (
                      <RoleRestricted requiredRole="lab_user" hideCompletely>
                        {button}
                      </RoleRestricted>
                    ) : (
                      button
                    )}
                  </div>
                );
              })}
            </>
          )}
        </nav>
      </div>
      <div className="p-4 bg-[var(--mobile-menu-footer-bg)]">
        <div className="flex items-center gap-3">
          {sidebarLevel === 'organization'&& (
            <div className="flex-1 relative">
              <button
                onClick={() => setExpandedOrganizationSelector(!expandedOrganizationSelector)}
                className="w-full p-3 text-left border border-[var(--mobile-menu-item-active-bg)] rounded-xl text-[var(--mobile-menu-fg)] flex items-center hover:bg-[var(--mobile-menu-item-active-bg)] transition-colors duration-150"
                style={{ backgroundColor: 'var(--mobile-menu-item-active-bg)'}}
              >
                <Building className="h-5 w-5 mr-3 text-[var(--accent)]" />
                <span className="flex-1 truncate text-sm font-medium">
                  {currentOrganization?.name || "Seleccionar organización"}
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 opacity-50 transition-transform duration-200",
                  expandedOrganizationSelector && "rotate-180"
                )} />
              </button>
              
              {expandedOrganizationSelector && (
                <div className="absolute bottom-full left-0 right-0 mb-2 border border-[var(--mobile-menu-border)] rounded-xl shadow-2xl max-h-40 overflow-y-auto z-10" style={{ backgroundColor: 'var(--mobile-menu-bg)'}}>
                  <button
                    className="w-full p-3 text-left text-sm bg-[var(--accent)] text-white"
                  >
                    {currentOrganization?.name || "Organización actual"}
                  </button>
                  <div className="p-3 text-center text-xs text-[var(--mobile-menu-item-fg)] opacity-60">
                    Multi-organización próximamente
                  </div>
                </div>
              )}
            </div>
          )}
          {sidebarLevel === 'project'&& (
            <div className="flex-1 relative">
              <button
                onClick={() => setExpandedProjectSelector(!expandedProjectSelector)}
                className="w-full p-3 text-left border border-[var(--mobile-menu-item-active-bg)] rounded-xl text-[var(--mobile-menu-fg)] flex items-center hover:bg-[var(--mobile-menu-item-active-bg)] transition-colors duration-150"
                style={{ backgroundColor: 'var(--mobile-menu-item-active-bg)'}}
              >
                <FolderOpen className="h-5 w-5 mr-3 text-[var(--accent)]" />
                <span className="flex-1 truncate text-sm font-medium">
                  {currentProjectName}
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 opacity-50 transition-transform duration-200",
                  expandedProjectSelector && "rotate-180"
                )} />
              </button>
              
              {expandedProjectSelector && (
                <div className="absolute bottom-full left-0 right-0 mb-2 border border-[var(--mobile-menu-border)] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-10" style={{ backgroundColor: 'var(--mobile-menu-bg)'}}>
                  {projectsData?.map((project: any) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project.id)}
                      className={cn(
                        "w-full p-3 text-left text-sm hover:bg-[var(--mobile-menu-item-active-bg)] transition-colors duration-150 text-[var(--mobile-menu-item-fg)]",
                        project.id === selectedProjectId && "bg-[var(--accent)] text-white"
                      )}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {(sidebarLevel === 'admin'|| sidebarLevel === 'community'|| sidebarLevel === 'learning'|| sidebarLevel === 'general'|| sidebarLevel === 'founders') && (
            <div className="flex-1" />
          )}
          <div className="relative">
            <Avatar 
              className="h-11 w-11 cursor-pointer hover:opacity-80 transition-opacity border-2 border-[var(--mobile-menu-border)]"
              onClick={() => {
                handleInternalNavigation('/user');
              }}
            >
              <AvatarImage src={userData?.user?.avatar_url} />
              <AvatarFallback className="bg-[var(--accent)] text-white text-sm font-bold">
                {userData?.user?.full_name?.substring(0, 2)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] font-bold border-2 border-[var(--mobile-menu-footer-bg)]"
              >
                {unreadCount > 9 ? '9+': unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
export function MobileMenu({ onClose }: MobileMenuProps = {}): React.ReactPortal | null {
  const { isOpen: storeIsOpen, mode, closeMenu } = useMobileMenuStore();
  const isMarketingMode = mode === 'marketing';
  
  useEffect(() => {
    if (storeIsOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [storeIsOpen]);
  if (!storeIsOpen) return null;
  const handleCloseMenu = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeMenu();
    onClose?.();
  };
  const menuContent = (
    <div className="fixed inset-0" style={{ backgroundColor: 'var(--mobile-menu-overlay-bg)', zIndex: 9999 }} onClick={() => closeMenu()}>
      <div 
        className="fixed inset-0 flex flex-row overflow-hidden"
        style={{ 
          backgroundColor: 'var(--mobile-menu-bg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {isMarketingMode ? (
            <>
              <div className="flex items-center h-14 px-4 bg-[var(--mobile-menu-header-bg)] relative">
                <h1 className="flex-1 text-center text-lg font-semibold text-[var(--mobile-menu-fg)]">
                  Menú
                </h1>
                <button
                  onClick={handleCloseMenu}
                  className="absolute right-4 p-2 hover:bg-[var(--mobile-menu-item-active-bg)] rounded-lg transition-colors z-10"
                >
                  <X className="h-5 w-5 text-[var(--mobile-menu-fg)]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col">
                <MarketingMenuContent onClose={handleCloseMenu} />
              </div>
              <div className="p-4 bg-[var(--mobile-menu-footer-bg)]">
                <div className="flex items-center gap-3">
                  <div className="flex-1" />
                </div>
              </div>
            </>
          ) : (
            <DashboardMenuContent onClose={handleCloseMenu} />
          )}
        </div>
      </div>
    </div>
  );
  return createPortal(menuContent, document.body);
}
