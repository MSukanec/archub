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
  ChevronLeft,
  Globe,
} from "lucide-react";
import { 
  getNavigationItems, 
  getDividerInfo, 
  getContextTitle,
  CONTEXT_BUTTONS,
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
import { useLocation } from "wouter";
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

interface MobileMenuProps {
  onClose: () => void;
  isOpen: boolean;
}

export function MobileMenu({ onClose }: MobileMenuProps): React.ReactPortal {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const { selectedProjectId, setSelectedProject } = useProjectContext();
  
  const [expandedProjectSelector, setExpandedProjectSelector] = useState(false);
  const [expandedOrganizationSelector, setExpandedOrganizationSelector] = useState(false);
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
          { onConflict: 'user_id,organization_id' }
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
    
    // Exact matches for dashboards and project root
    if (href === '/organization/dashboard' || href === '/project/dashboard' || href === '/project') {
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

  const { closeMenu } = useMobileMenuStore();
  
  const handleCloseMenu = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeMenu();
    onClose();
  };

  const menuContent = (
    <div className="fixed inset-0" style={{ backgroundColor: 'var(--mobile-menu-overlay-bg)', zIndex: 9999 }} onClick={handleCloseMenu}>
      <div 
        className="fixed inset-0 flex flex-row overflow-hidden"
        style={{ 
          backgroundColor: 'var(--mobile-menu-bg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center h-14 px-4 border-b border-[var(--mobile-menu-border)] bg-[var(--mobile-menu-header-bg)]">
            {sidebarLevel !== 'general' ? (
              <>
                <button
                  onClick={() => {
                    setSidebarLevel('general');
                  }}
                  className="flex items-center gap-2 flex-1 p-2 -ml-2 hover:bg-[var(--mobile-menu-item-active-bg)] rounded-lg transition-colors"
                  data-testid="button-mobile-back"
                >
                  <ChevronLeft className="h-5 w-5 text-[var(--mobile-menu-fg)]" />
                  <h1 className="text-lg font-semibold !text-white">
                    {getContextTitle(sidebarLevel as SidebarLevel)}
                  </h1>
                </button>
                <button
                  onClick={handleCloseMenu}
                  className="p-2 -mr-2 hover:bg-[var(--mobile-menu-item-active-bg)] rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-[var(--mobile-menu-item-fg)]" />
                </button>
              </>
            ) : (
              <>
                <h1 className="text-lg font-semibold flex-1 !text-white">
                  {getContextTitle(sidebarLevel as SidebarLevel)}
                </h1>
                <button
                  onClick={handleCloseMenu}
                  className="p-2 -mr-2 hover:bg-[var(--mobile-menu-item-active-bg)] rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-[var(--mobile-menu-item-fg)]" />
                </button>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav>
              {sidebarLevel === 'general' ? (
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
                            setSidebarLevel('project');
                            if (contextButton.href) {
                              navigate(contextButton.href);
                            }
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
                      setSidebarLevel(contextButton.id);
                      if (contextButton.href) {
                        navigate(contextButton.href);
                      }
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

                    // Apply RoleRestricted for founders and community (same as desktop)
                    if (contextButton.id === 'founders' || contextButton.id === 'community') {
                      return (
                        <RoleRestricted key={contextButton.id} requiredRole="admin" hideCompletely showAsPreview>
                          {button}
                        </RoleRestricted>
                      );
                    }

                    // Apply ComingSoonRestricted for coming_soon items
                    if (contextButton.restricted === "coming_soon") {
                      return (
                        <ComingSoonRestricted key={contextButton.id}>
                          {button}
                        </ComingSoonRestricted>
                      );
                    }

                    // Skip admin-only buttons for non-admins
                    if (contextButton.adminOnly && !isAdmin) {
                      return null;
                    }

                    return <div key={contextButton.id}>{button}</div>;
                  })}
                </>
              ) : (
                <>
                  {navigationItems.map((entry, index) => {
                    if ('type' in entry && entry.type === 'section') {
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
                                    navigate(item.href);
                                  }
                                }}
                                isActive={isActive}
                                showChevron={false}
                                testId={item.testId || `button-mobile-${item.id}`}
                                badgeCount={item.id === 'support' && isAdmin ? unreadSupportCount : undefined}
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
                    
                    if ('type' in entry && entry.type === 'section-header') {
                      return (
                        <div key={`header-${entry.id}`} className="px-6 py-2 mt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--mobile-menu-item-fg)] opacity-40">
                          {entry.label}
                        </div>
                      );
                    }
                    
                    if ('type' in entry && entry.type === 'spacer') {
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
                            navigate(item.href);
                          }
                        }}
                        isActive={isActive}
                        showChevron={false}
                        testId={item.testId || `button-mobile-${item.id}`}
                        badgeCount={item.id === 'support' && isAdmin ? unreadSupportCount : undefined}
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

          <div className="p-4 border-t border-[var(--mobile-menu-border)] bg-[var(--mobile-menu-footer-bg)]">
            <div className="flex items-center gap-3">
              {sidebarLevel === 'organization' && (
                <div className="flex-1 relative">
                  <button
                    onClick={() => setExpandedOrganizationSelector(!expandedOrganizationSelector)}
                    className="w-full p-3 text-left border-0 rounded-xl text-[var(--mobile-menu-fg)] flex items-center hover:bg-[var(--mobile-menu-item-active-bg)] transition-colors duration-150"
                    style={{ backgroundColor: 'var(--mobile-menu-item-active-bg)' }}
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
                    <div className="absolute bottom-full left-0 right-0 mb-2 border border-[var(--mobile-menu-border)] rounded-xl shadow-2xl max-h-40 overflow-y-auto z-10" style={{ backgroundColor: 'var(--mobile-menu-bg)' }}>
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

              {sidebarLevel === 'project' && (
                <div className="flex-1 relative">
                  <button
                    onClick={() => setExpandedProjectSelector(!expandedProjectSelector)}
                    className="w-full p-3 text-left border-0 rounded-xl text-[var(--mobile-menu-fg)] flex items-center hover:bg-[var(--mobile-menu-item-active-bg)] transition-colors duration-150"
                    style={{ backgroundColor: 'var(--mobile-menu-item-active-bg)' }}
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
                    <div className="absolute bottom-full left-0 right-0 mb-2 border border-[var(--mobile-menu-border)] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-10" style={{ backgroundColor: 'var(--mobile-menu-bg)' }}>
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

              {(sidebarLevel === 'admin' || sidebarLevel === 'community' || sidebarLevel === 'learning' || sidebarLevel === 'general' || sidebarLevel === 'founders') && (
                <div className="flex-1" />
              )}

              <div className="relative">
                <Avatar 
                  className="h-11 w-11 cursor-pointer hover:opacity-80 transition-opacity border-2 border-[var(--mobile-menu-border)]"
                  onClick={() => {
                    navigate('/user');
                    handleCloseMenu();
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
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}
