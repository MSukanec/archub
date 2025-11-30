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
    if (href === '/organization/dashboard') {
      return location === '/organization/dashboard';
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
    <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9999 }} onClick={handleCloseMenu}>
      <div 
        className="fixed inset-0 flex flex-row overflow-hidden"
        style={{ 
          backgroundColor: 'var(--main-sidebar-bg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center h-14 px-4 border-b border-[var(--main-sidebar-border)] bg-[var(--main-sidebar-bg)]">
            {sidebarLevel !== 'general' ? (
              <>
                <button
                  onClick={() => {
                    setSidebarLevel('general');
                  }}
                  className="flex items-center gap-2 flex-1 p-2 -ml-2 hover:bg-[var(--main-sidebar-button-hover-bg)] rounded-lg transition-colors"
                  data-testid="button-mobile-back"
                >
                  <ChevronLeft className="h-5 w-5 text-[var(--main-sidebar-fg)]" />
                  <h1 className="text-lg font-semibold !text-white">
                    {getContextTitle(sidebarLevel as SidebarLevel)}
                  </h1>
                </button>
                <button
                  onClick={handleCloseMenu}
                  className="p-2 -mr-2 hover:bg-[var(--main-sidebar-button-hover-bg)] rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-[var(--main-sidebar-fg)]" />
                </button>
              </>
            ) : (
              <>
                <h1 className="text-lg font-semibold flex-1 !text-white">
                  {getContextTitle(sidebarLevel as SidebarLevel)}
                </h1>
                <button
                  onClick={handleCloseMenu}
                  className="p-2 -mr-2 hover:bg-[var(--main-sidebar-button-hover-bg)] rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-[var(--main-sidebar-fg)]" />
                </button>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav>
              {sidebarLevel === 'general' ? (
                <>
                  {CONTEXT_BUTTONS.map((contextButton) => {
                    if (contextButton.adminOnly && !isAdmin) {
                      return null;
                    }

                    if (contextButton.id === 'general') {
                      const isActive = contextButton.href ? isButtonActive(contextButton.href) : false;
                      return (
                        <MobileMenuButton
                          key={contextButton.id}
                          icon={contextButton.icon}
                          label={contextButton.label}
                          onClick={() => {
                            if (contextButton.href) {
                              navigate(contextButton.href);
                              handleCloseMenu();
                            }
                          }}
                          isActive={isActive}
                          showChevron={false}
                          testId={contextButton.testId.replace('sidebar', 'mobile')}
                        />
                      );
                    }

                    if (contextButton.id === 'project') {
                      const hasProjects = projectsData && projectsData.length > 0;
                      const isActive = contextButton.href ? isButtonActive(contextButton.href) : 
                        location.startsWith('/project') || location.startsWith('/budgets') || 
                        location.startsWith('/construction') || location.startsWith('/clients');
                      
                      const button = (
                        <MobileMenuButton
                          key={contextButton.id}
                          icon={contextButton.icon}
                          label={contextButton.label}
                          onClick={() => {
                            if (!hasProjects) {
                              toast({
                                title: "No hay proyectos creados",
                                description: "Crea un proyecto primero desde Organización",
                                variant: "destructive"
                              });
                              return;
                            }
                            if (!selectedProjectId) {
                              toast({
                                title: "No hay proyecto seleccionado",
                                description: "Selecciona un proyecto primero",
                                variant: "destructive"
                              });
                              return;
                            }
                            setSidebarLevel('project');
                          }}
                          isActive={isActive}
                          showChevron={true}
                          disabled={!hasProjects}
                          testId={contextButton.testId.replace('sidebar', 'mobile')}
                        />
                      );

                      return button;
                    }

                    const isActive = contextButton.href ? isButtonActive(contextButton.href) :
                      location.startsWith(`/${contextButton.id}`);

                    const handleClick = () => {
                      setSidebarLevel(contextButton.id);
                    };

                    const button = (
                      <MobileMenuButton
                        key={contextButton.id}
                        icon={contextButton.icon}
                        label={contextButton.label}
                        onClick={handleClick}
                        isActive={isActive}
                        showChevron={true}
                        testId={contextButton.testId.replace('sidebar', 'mobile')}
                      />
                    );

                    if (contextButton.restricted === "coming_soon") {
                      return (
                        <ComingSoonRestricted key={contextButton.id}>
                          {button}
                        </ComingSoonRestricted>
                      );
                    } else if (contextButton.restricted) {
                      return (
                        <PlanRestricted key={contextButton.id} reason={contextButton.restricted}>
                          {button}
                        </PlanRestricted>
                      );
                    }

                    return button;
                  })}
                </>
              ) : (
                <>
                  {navigationItems.map((entry, index) => {
                    if ('type' in entry && entry.type === 'section') {
                      const section = entry as NavigationSection;
                      return (
                        <div key={`section-${index}`}>
                          <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--main-sidebar-fg)] opacity-60">
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
                                    handleCloseMenu();
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
                                ) : item.restricted ? (
                                  <PlanRestricted reason={item.restricted}>
                                    {button}
                                  </PlanRestricted>
                                ) : (
                                  button
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    const item = entry as NavigationItem;
                    const isActive = isButtonActive(item.href);
                    const dividerInfo = getDividerInfo(sidebarLevel as SidebarLevel, item, index);
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
                            handleCloseMenu();
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
                        {dividerInfo.show && (
                          <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--main-sidebar-fg)] opacity-60">
                            {dividerInfo.text}
                          </div>
                        )}
                        
                        {item.restricted === "coming_soon" ? (
                          <ComingSoonRestricted>
                            {button}
                          </ComingSoonRestricted>
                        ) : item.restricted ? (
                          <PlanRestricted reason={item.restricted}>
                            {button}
                          </PlanRestricted>
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

          <div className="p-4 border-t border-[var(--main-sidebar-border)]">
            <div className="flex items-center gap-3">
              {sidebarLevel === 'organization' && (
                <div className="flex-1 relative">
                  <button
                    onClick={() => setExpandedOrganizationSelector(!expandedOrganizationSelector)}
                    className="w-full p-3 text-left border-0 rounded-lg text-[var(--main-sidebar-fg)] flex items-center hover:bg-[var(--main-sidebar-button-hover-bg)] transition-colors duration-150"
                    style={{ backgroundColor: 'hsl(0, 0%, 20%)' }}
                  >
                    <Building className="h-5 w-5 mr-3" />
                    <span className="flex-1 truncate text-sm">
                      {currentOrganization?.name || "Seleccionar organización"}
                    </span>
                    <ChevronDown className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      expandedOrganizationSelector && "rotate-180"
                    )} />
                  </button>
                  
                  {expandedOrganizationSelector && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 border-0 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10" style={{ backgroundColor: 'hsl(0, 0%, 20%)' }}>
                      <button
                        className="w-full p-3 text-left text-sm bg-[hsl(76,100%,40%)] text-white"
                      >
                        {currentOrganization?.name || "Organización actual"}
                      </button>
                      <div className="p-3 text-center text-xs text-[var(--main-sidebar-fg)] opacity-60">
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
                    className="w-full p-3 text-left border-0 rounded-lg text-[var(--main-sidebar-fg)] flex items-center hover:bg-[var(--main-sidebar-button-hover-bg)] transition-colors duration-150"
                    style={{ backgroundColor: 'hsl(0, 0%, 20%)' }}
                  >
                    <FolderOpen className="h-5 w-5 mr-3" />
                    <span className="flex-1 truncate text-sm">
                      {currentProjectName}
                    </span>
                    <ChevronDown className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      expandedProjectSelector && "rotate-180"
                    )} />
                  </button>
                  
                  {expandedProjectSelector && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 border-0 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10" style={{ backgroundColor: 'hsl(0, 0%, 20%)' }}>
                      {projectsData?.map((project: any) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project.id)}
                          className={cn(
                            "w-full p-3 text-left text-sm hover:bg-[var(--main-sidebar-button-hover-bg)] transition-colors duration-150 text-[var(--main-sidebar-fg)]",
                            project.id === selectedProjectId && "bg-[hsl(76,100%,40%)] text-white"
                          )}
                        >
                          {project.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(sidebarLevel === 'admin' || sidebarLevel === 'community' || sidebarLevel === 'learning' || sidebarLevel === 'general' || sidebarLevel === 'settings' || sidebarLevel === 'user') && (
                <div className="flex-1" />
              )}

              <div className="relative">
                <Avatar 
                  className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity border-0 ring-0"
                  onClick={() => {
                    navigate('/profile');
                    handleCloseMenu();
                  }}
                >
                  <AvatarImage src={userData?.user?.avatar_url} />
                  <AvatarFallback className="bg-[var(--accent)] text-white text-sm border-0">
                    {userData?.user?.full_name?.substring(0, 2)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs border-2 border-[var(--card-bg)]"
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
