import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjects } from "@/hooks/use-projects";
import { useProjectContext } from "@/stores/projectContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  Contact, 
  CheckSquare, 
  FileText, 
  Package2, 
  Users,
  Calendar,
  Crown
} from "lucide-react";
import { useLocation } from "wouter";
import { useNavigationStore } from "@/stores/navigationStore";

function getProjectInitials(name: string): string {
  return (name?.trim()?.[0] || '').toUpperCase();
}

export function Header() {
  const { data: currentUser } = useCurrentUser();
  const { selectedProjectId: contextProjectId, setSelectedProject, setCurrentOrganization } = useProjectContext();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { setSidebarLevel } = useNavigationStore();

  const { data: projects = [], isLoading: isLoadingProjects } = useProjects(
    currentUser?.organization?.id || ''
  );

  const selectedProjectId = contextProjectId || currentUser?.preferences?.last_project_id || null;
  const currentProject = projects.find(p => p.id === selectedProjectId);

  // Sort projects to show active project first
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.id === selectedProjectId) return -1;
    if (b.id === selectedProjectId) return 1;
    return 0;
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (projectId: string | null) => {
      if (!currentUser?.user?.id || !currentUser?.organization?.id) {
        throw new Error('Usuario u organización no disponibles');
      }
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert(
          {
            user_id: currentUser.user.id,
            organization_id: currentUser.organization.id,
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
    }
  });

  const organizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!currentUser?.user?.id) {
        throw new Error('Usuario no disponible');
      }

      const response = await fetch('/api/user/select-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.user.id,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          organization_id: organizationId
        })
      });

      if (!response.ok) {
        throw new Error('Error al cambiar de organización');
      }

      return response.json();
    },
    onSuccess: (data, organizationId) => {
      // Update project context to clear project and set new organization
      setCurrentOrganization(organizationId);
      setSelectedProject(null); // Clear project since we're switching organizations
      
      // Invalidate queries to refresh data for new organization
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
    }
  });

  const handleProjectSelect = (projectId: string) => {
    if (selectedProjectId === projectId) return;
    updateProjectMutation.mutate(projectId);
  };

  const handleOrganizationSelect = (organizationId: string) => {
    if (currentUser?.organization?.id === organizationId) return;
    organizationMutation.mutate(organizationId);
  };
  
  return (
    <header 
      className="h-12 flex items-center pr-6 border-b"
      style={{
        backgroundColor: "var(--header-bg)",
        borderColor: "var(--header-border)",
      }}
    >
      {/* Logo - Aligned with sidebar icons (32x32 square button) */}
      <div className="flex items-center w-12 justify-center">
        <button
          className="h-8 w-8 flex items-center justify-center text-sm font-bold transition-opacity duration-200 hover:opacity-80 border-0 bg-transparent rounded"
          style={{
            color: "var(--header-fg)",
            borderRadius: '4px'
          }}
          onClick={() => {
            // Optional: could navigate to home or do nothing
          }}
        >
          A
        </button>
      </div>

      {/* Organization Selector - Starts exactly where sidebar ends (47px) */}
      <div className="flex items-center ml-0">
        <Button
          variant="ghost"
          className="h-8 px-3 justify-start text-sm font-normal border-0"
          style={{
            color: "var(--header-button-fg)",
            backgroundColor: "var(--header-button-bg)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
            e.currentTarget.style.color = "var(--header-button-hover-fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
            e.currentTarget.style.color = "var(--header-button-fg)";
          }}
          onClick={() => {
            setSidebarLevel('organization');
            navigate('/organization/dashboard');
          }}
        >
          {currentUser?.organization?.name || "Seleccionar Organización"}
        </Button>
        
        {/* Organization dropdown arrow button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 ml-1 border-0"
              style={{
                color: "var(--header-button-fg)",
                backgroundColor: "var(--header-button-bg)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
                e.currentTarget.style.color = "var(--header-button-hover-fg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
                e.currentTarget.style.color = "var(--header-button-fg)";
              }}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {currentUser?.organizations?.map((org) => (
              <DropdownMenuItem 
                key={org.id}
                onClick={() => handleOrganizationSelect(org.id)}
                data-testid={`organization-option-${org.id}`}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: org.id === currentUser?.organization?.id ? "var(--accent)" : "var(--muted)",
                    color: org.id === currentUser?.organization?.id ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  }}
                >
                  {org.name.charAt(0).toUpperCase()}
                </div>
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Project Selector */}
      <div className="flex items-center ml-4">
        <Button
          variant="ghost"
          className="h-8 px-3 justify-start text-sm font-normal border-0"
          style={{
            color: "var(--header-button-fg)",
            backgroundColor: "var(--header-button-bg)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
            e.currentTarget.style.color = "var(--header-button-hover-fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
            e.currentTarget.style.color = "var(--header-button-fg)";
          }}
          onClick={() => {
            setSidebarLevel('project');
            if (selectedProjectId) {
              navigate('/project/dashboard');
            }
          }}
        >
          {currentProject?.name || "Seleccionar Proyecto"}
        </Button>
        
        {/* Project dropdown arrow button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 ml-1 border-0"
              style={{
                color: "var(--header-button-fg)",
                backgroundColor: "var(--header-button-bg)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
                e.currentTarget.style.color = "var(--header-button-hover-fg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
                e.currentTarget.style.color = "var(--header-button-fg)";
              }}
              data-testid="project-selector-dropdown"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {isLoadingProjects ? (
              <DropdownMenuItem disabled className="opacity-50">
                Cargando proyectos...
              </DropdownMenuItem>
            ) : sortedProjects.length === 0 ? (
              <DropdownMenuItem disabled className="opacity-50">
                No hay proyectos disponibles
              </DropdownMenuItem>
            ) : (
              sortedProjects.map((project) => (
                <DropdownMenuItem 
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className="flex items-center gap-3 p-3"
                  data-testid={`project-option-${project.id}`}
                >
                  {/* Project Avatar */}
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      backgroundColor: project.color || 'var(--main-sidebar-button-bg)',
                    }}
                  >
                    {getProjectInitials(project.name)}
                  </div>
                  
                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{project.name}</span>
                      {project.id === selectedProjectId && (
                        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate block">
                      {project.project_data?.project_type?.name || 'Sin tipo'}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side - utility buttons and user avatar */}
      <div className="flex-1" />
      
      
      {/* Utility buttons */}
      <div className="flex items-center gap-1 mr-4">
        {/* Contactos */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8"
          style={{
            color: "var(--header-button-fg)",
            backgroundColor: "var(--header-button-bg)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
            e.currentTarget.style.color = "var(--header-button-hover-fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
            e.currentTarget.style.color = "var(--header-button-fg)";
          }}
          onClick={() => navigate('/organization/contacts')}
          data-testid="header-contacts"
        >
          <Contact className="h-4 w-4" />
        </Button>

        {/* Calendar/Tablero */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8"
          style={{
            color: "var(--header-button-fg)",
            backgroundColor: "var(--header-button-bg)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
            e.currentTarget.style.color = "var(--header-button-hover-fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
            e.currentTarget.style.color = "var(--header-button-fg)";
          }}
          onClick={() => navigate('/general/calendar')}
          data-testid="header-calendar"
        >
          <Calendar className="h-4 w-4" />
        </Button>

        {/* Media */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8"
          style={{
            color: "var(--header-button-fg)",
            backgroundColor: "var(--header-button-bg)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
            e.currentTarget.style.color = "var(--header-button-hover-fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
            e.currentTarget.style.color = "var(--header-button-fg)";
          }}
          onClick={() => navigate('/general/media')}
          data-testid="header-media"
        >
          <FileText className="h-4 w-4" />
        </Button>

        {/* Tareas */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8"
          style={{
            color: "var(--header-button-fg)",
            backgroundColor: "var(--header-button-bg)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
            e.currentTarget.style.color = "var(--header-button-hover-fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
            e.currentTarget.style.color = "var(--header-button-fg)";
          }}
          onClick={() => navigate('/library/tasks')}
          data-testid="header-tasks"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>

        {/* Materiales */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8"
          style={{
            color: "var(--header-button-fg)",
            backgroundColor: "var(--header-button-bg)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
            e.currentTarget.style.color = "var(--header-button-hover-fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
            e.currentTarget.style.color = "var(--header-button-fg)";
          }}
          onClick={() => navigate('/library/materials')}
          data-testid="header-materials"
        >
          <Package2 className="h-4 w-4" />
        </Button>

        {/* Mano de Obra */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8"
          style={{
            color: "var(--header-button-fg)",
            backgroundColor: "var(--header-button-bg)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
            e.currentTarget.style.color = "var(--header-button-hover-fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
            e.currentTarget.style.color = "var(--header-button-fg)";
          }}
          onClick={() => navigate('/library/labor')}
          data-testid="header-labor"
        >
          <Users className="h-4 w-4" />
        </Button>
        
        {/* Administración */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8"
          style={{
            color: "var(--header-button-fg)",
            backgroundColor: "var(--header-button-bg)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
            e.currentTarget.style.color = "var(--header-button-hover-fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
            e.currentTarget.style.color = "var(--header-button-fg)";
          }}
          onClick={() => {
            setSidebarLevel('admin');
            navigate('/admin/dashboard');
          }}
          data-testid="header-admin"
        >
          <Crown className="h-4 w-4" />
        </Button>
      </div>

      {/* User Avatar */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          className="h-8 px-2 gap-2"
          style={{
            color: "var(--header-button-fg)",
            backgroundColor: "var(--header-button-bg)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-hover-bg)";
            e.currentTarget.style.color = "var(--header-button-hover-fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--header-button-bg)";
            e.currentTarget.style.color = "var(--header-button-fg)";
          }}
          onClick={() => navigate('/profile')}
          data-testid="header-user-avatar"
        >
          {currentUser?.user?.avatar_url ? (
            <img 
              src={currentUser.user.avatar_url} 
              alt="Avatar"
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ 
                backgroundColor: "var(--accent)",
                color: "var(--accent-foreground)"
              }}
            >
              {currentUser?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          {currentUser?.user?.full_name && (
            <span className="text-sm font-medium">
              {currentUser.user.full_name}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}