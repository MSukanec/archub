import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjects } from '@/hooks/use-projects';
import { useProjectContext } from '@/stores/projectContext';
import { supabase } from '@/lib/supabase';
import { SidebarAvatarButton } from './SidebarAvatarButton';

function getOrganizationInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getProjectInitials(name: string): string {
  return (name?.trim()?.[0] || '').toUpperCase();
}

export function RightSidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const { data: userData } = useCurrentUser();
  const { selectedProjectId: contextProjectId, setSelectedProject } = useProjectContext();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: isLoadingProjects } = useProjects(
    userData?.organization?.id || ''
  );

  const selectedProjectId = contextProjectId || userData?.preferences?.last_project_id || null;

  // Sort projects to show active project first
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.id === selectedProjectId) return -1;
    if (b.id === selectedProjectId) return 1;
    return 0;
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userData?.user?.id || !userData?.organization?.id) {
        throw new Error('Usuario u organización no disponibles');
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
    }
  });

  const handleProjectSelect = (projectId: string) => {
    if (selectedProjectId === projectId) return;
    updateProjectMutation.mutate(projectId);
  };

  const handleCreateProject = () => {
    // TODO: Open create project modal
    console.log('Create new project');
  };

  const isExpanded = isHovered;

  return (
    <aside 
      className={cn(
        "bg-[var(--main-sidebar-bg)] transition-[width] duration-300 z-30 flex flex-col h-full rounded-r-2xl",
        isExpanded ? "w-64" : "w-[60px]"
      )}
      style={{
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* All Buttons Section */}
      <div className="flex-1 pl-[14px] pr-2 pt-3 space-y-2">
        {/* Organization Button */}
        <SidebarAvatarButton
          avatarUrl={userData?.organization?.logo_url}
          backgroundColor="var(--accent)"
          borderColor="rgba(255, 255, 255, 0.3)"
          letter={userData?.organization?.name ? getOrganizationInitials(userData.organization.name) : 'O'}
          primaryText={userData?.organization?.name || 'Organización'}
          secondaryText="Organización"
          isExpanded={isExpanded}
          shape="rounded"
        />
        
        {/* Project Buttons */}
        {sortedProjects.map((project: any) => {
          const isActive = selectedProjectId === project.id;
          return (
            <SidebarAvatarButton
              key={project.id}
              backgroundColor={project.color || 'var(--main-sidebar-button-bg)'}
              letter={getProjectInitials(project.name)}
              primaryText={project.name}
              secondaryText={project.project_data?.project_type?.name || 'Sin tipo'}
              isExpanded={isExpanded}
              isActive={isActive}
              shape="circular"
              onClick={() => handleProjectSelect(project.id)}
              testId={`project-avatar-${project.id}`}
            />
          );
        })}

        {/* Create New Project Button */}
        <div
          className={cn(
            "flex items-center cursor-pointer rounded-lg p-2 justify-start",
            "hover:bg-white/10 transition-colors duration-200"
          )}
          onClick={handleCreateProject}
          data-testid="create-project-button"
        >
          <div className="w-8 h-8 flex-shrink-0 flex justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className={cn(
            "ml-3 flex-1 min-w-0 leading-tight overflow-hidden transition-[max-width,opacity,transform] duration-300",
            isExpanded ? "max-w-[220px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-1"
          )}>
            <p className="text-sm font-medium text-white truncate leading-tight whitespace-nowrap">
              Nuevo Proyecto
            </p>
            <p className="text-xs text-white/60 truncate leading-tight -mt-0.5 whitespace-nowrap">
              Crear proyecto
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}