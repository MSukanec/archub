import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Building2, FolderOpen } from "lucide-react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { useProject } from "@/hooks/use-projects";
import { useProjectContext } from "@/stores/projectContext";
import { useNavigationStore } from "@/stores/navigationStore";
import { useUpdateUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences';

export function MainHeader() {
  const [, navigate] = useLocation();
  const { user } = useAuthStore();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId, setCurrentOrganization, setSelectedProject } = useProjectContext();
  const { setSidebarLevel } = useNavigationStore();
  const updateUserOrgPreferences = useUpdateUserOrganizationPreferences();
  
  // Get real data
  const { data: projectsLite = [] } = useProjectsLite(currentOrganizationId || undefined);
  const { data: currentProject } = useProject(selectedProjectId || undefined);
  
  // Get current organization name from the organizations list using currentOrganizationId
  const currentOrganization = userData?.organizations?.find(org => org.id === currentOrganizationId)?.name || 
                              userData?.organization?.name || 
                              "Organización";
  const currentProjectName = currentProject?.name || "Seleccionar Proyecto";

  const handleOrganizationClick = () => {
    setSidebarLevel('organization');
    navigate('/organization/dashboard');
  };

  const handleProjectClick = () => {
    setSidebarLevel('project');
    navigate('/project/dashboard');
  };

  const handleOrganizationChange = (orgId: string) => {
    setCurrentOrganization(orgId);
    setSidebarLevel('organization');
    navigate('/organization/dashboard');
    
    // CRITICAL: Save to Supabase to persist the organization change
    updateUserOrgPreferences.mutate({
      organizationId: orgId,
      lastProjectId: null // Reset project when changing organization
    });
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    setSidebarLevel('project');
    // NO navigate - solo cambiar proyecto activo
  };

  return (
    <div 
      className="w-full h-12 border-b flex items-center justify-between pr-4 z-50"
      style={{ 
        backgroundColor: "var(--main-sidebar-bg)",
        borderBottomColor: "var(--main-sidebar-border)"
      }}
    >
      {/* Left side: Logo and navigation */}
      <div className="flex items-center gap-4">
        {/* Logo - Perfectly aligned with sidebar icons at 24px from left edge */}
        <div className="shrink-0 w-12 h-12 flex items-center justify-center">
          <img 
            src="/ArchubLogo.png" 
            alt="Archub" 
            className="h-8 w-auto"
          />
        </div>

        {/* Organization selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleOrganizationClick}
            className="flex items-center h-8 px-2 text-xs font-medium transition-all duration-200 ease-out overflow-hidden rounded text-[var(--main-sidebar-button-fg)] bg-[var(--main-sidebar-button-bg)] hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-[var(--main-sidebar-button-hover-fg)]"
          >
            <Building2 className="h-4 w-4 mr-1" />
            {currentOrganization}
          </button>
          
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center h-8 px-1 transition-all duration-200 ease-out overflow-hidden rounded text-[var(--main-sidebar-button-fg)] bg-[var(--main-sidebar-button-bg)] hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-[var(--main-sidebar-button-hover-fg)]"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start">
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Seleccionar Organización
                </div>
                {userData?.organizations?.map((org) => (
                  <Button
                    key={org.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOrganizationChange(org.id)}
                    className="w-full justify-start h-8 text-xs"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {org.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Project selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleProjectClick}
            className="flex items-center h-8 px-2 text-xs font-medium transition-all duration-200 ease-out overflow-hidden rounded text-[var(--main-sidebar-button-fg)] bg-[var(--main-sidebar-button-bg)] hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-[var(--main-sidebar-button-hover-fg)]"
          >
            <FolderOpen className="h-4 w-4 mr-1" />
            {currentProjectName}
          </button>
          
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center h-8 px-1 transition-all duration-200 ease-out overflow-hidden rounded text-[var(--main-sidebar-button-fg)] bg-[var(--main-sidebar-button-bg)] hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-[var(--main-sidebar-button-hover-fg)]"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start">
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Seleccionar Proyecto
                </div>
                {projectsLite.map((project) => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleProjectChange(project.id)}
                    className="w-full justify-start h-8 text-xs"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    {project.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Right side: User avatar */}
      <div className="flex items-center">
        <div 
          className="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 ease-out hover:bg-[var(--main-sidebar-button-hover-bg)]"
          onClick={() => navigate('/profile')}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
            <AvatarFallback className="text-xs">
              {user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}