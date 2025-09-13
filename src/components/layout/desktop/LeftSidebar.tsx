import { Plus } from 'lucide-react';
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

export function LeftSidebar() {
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

  return (
    <aside 
      className="bg-[var(--main-sidebar-bg)] w-[60px] z-30 flex flex-col h-full rounded-r-2xl"
    >
      {/* All Buttons Section */}
      <div className="flex-1 px-3 pt-3 space-y-2">
        {/* Organization Button */}
        <SidebarAvatarButton
          avatarUrl={userData?.organization?.logo_url}
          backgroundColor="var(--accent)"
          borderColor="rgba(255, 255, 255, 0.3)"
          letter={userData?.organization?.name ? getOrganizationInitials(userData.organization.name) : 'O'}
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
              isActive={isActive}
              shape="circular"
              onClick={() => handleProjectSelect(project.id)}
              testId={`project-avatar-${project.id}`}
            />
          );
        })}

        {/* Create New Project Button */}
        <div
          className="flex items-center justify-center cursor-pointer p-2"
          onClick={handleCreateProject}
          data-testid="create-project-button"
        >
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}