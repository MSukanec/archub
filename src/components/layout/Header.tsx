import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLocation } from "wouter";

export function Header() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjects(userData?.preferences?.last_organization_id);
  const { setSidebarContext, currentSidebarContext } = useNavigationStore();

  // Organization selection mutation
  const selectOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('Missing required data');
      }
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('id', userData.preferences.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });

  // Project selection mutation
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('Missing required data');
      }
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('id', userData.preferences.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });

  const currentOrganization = userData?.organization;
  const currentProject = projects.find(p => p.id === userData?.preferences?.last_project_id);

  return (
    <header className="h-10 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex items-center">
      {/* Logo */}
      <div className="w-10 h-10 flex items-center justify-center border-r border-[var(--sidebar-border)]">
        <span className="text-lg font-bold text-[var(--sidebar-fg)]">A</span>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-4">
        {/* Organization - Text clickable + Dropdown arrow */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="h-8 px-2 text-sm font-medium text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover-bg)]"
            onClick={() => {
              setSidebarContext('organization');
              navigate('/organizaciones');
            }}
          >
            {currentOrganization?.name || 'Sin organización'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[var(--sidebar-hover-bg)]"
              >
                <ChevronDown className="h-3 w-3 text-[var(--sidebar-fg)]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <div className="px-2 py-1.5 text-xs text-[var(--sidebar-secondary-fg)] font-medium">
                Buscar organización...
              </div>
              <DropdownMenuSeparator />
              {userData?.organizations?.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => selectOrganizationMutation.mutate(org.id)}
                  className="flex items-center justify-between"
                >
                  <span>{org.name}</span>
                  {org.id === currentOrganization?.id && (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="mr-2 h-4 w-4" />
                Nueva organización
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Only show project breadcrumb if NOT in organization context */}
        {currentSidebarContext !== 'organization' && (
          <>
            <span className="text-[var(--sidebar-secondary-fg)]">›</span>

            {/* Project - Text clickable + Dropdown arrow */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="h-8 px-2 text-sm font-medium text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover-bg)]"
                onClick={() => {
                  setSidebarContext('project');
                  navigate('/proyectos');
                }}
              >
                {currentProject?.name || 'Sin proyecto'}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-[var(--sidebar-hover-bg)]"
                  >
                    <ChevronDown className="h-3 w-3 text-[var(--sidebar-fg)]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <div className="px-2 py-1.5 text-xs text-[var(--sidebar-secondary-fg)] font-medium">
                    Buscar proyecto...
                  </div>
                  <DropdownMenuSeparator />
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => selectProjectMutation.mutate(project.id)}
                      className="flex items-center justify-between"
                    >
                      <span>{project.name}</span>
                      {project.id === currentProject?.id && (
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo proyecto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </header>
  );
}