import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronsUpDown } from "lucide-react";
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
  FileText, 
  Calendar,
  Crown,
  DollarSign,
  BarChart3
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
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();

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
      setSidebarLevel('project'); // Switch to project mode
      // No navegamos automáticamente - solo cambiamos el proyecto activo
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
          className="h-8 w-8 flex items-center justify-center transition-opacity duration-200 hover:opacity-80 border-0 bg-transparent rounded"
          style={{
            borderRadius: '4px'
          }}
          onClick={() => {
            // Optional: could navigate to home or do nothing
          }}
        >
          <img 
            src="/ArchubLogo.png" 
            alt="Archub" 
            className="h-7 w-7 object-contain"
          />
        </button>
      </div>

      {/* COMENTADO: Todos los botones de organization y project selectors */}

      {/* Right side - utility buttons and user avatar */}
      <div className="flex-1" />
      
      
      {/* Utility buttons */}
      <div className="flex items-center gap-1 mr-4">
        {/* Movimientos */}
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
          onClick={() => navigate('/finances/movements')}
          data-testid="header-movements"
        >
          <DollarSign className="h-4 w-4" />
        </Button>

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

        {/* Análisis de Costos */}
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
          onClick={() => navigate('/analysis')}
          data-testid="header-analysis"
        >
          <BarChart3 className="h-4 w-4" />
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

      {/* User Avatar - Solo avatar 32x32px sin borde ni texto */}
      <div className="flex items-center">
        <div 
          className="cursor-pointer"
          onClick={() => navigate('/profile')}
          data-testid="header-user-avatar"
        >
          {currentUser?.user?.avatar_url ? (
            <img 
              src={currentUser.user.avatar_url} 
              alt="Avatar"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{ 
                backgroundColor: "var(--accent)",
                color: "var(--accent-foreground)"
              }}
            >
              {currentUser?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}