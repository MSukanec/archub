import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjects } from '@/hooks/use-projects';
import { useProjectContext } from '@/stores/projectContext';
import { supabase } from '@/lib/supabase';
import { SidebarAvatarButton } from './SidebarAvatarButton';
import { useLocation } from 'wouter';
import { useState } from 'react';

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
  const { selectedProjectId: contextProjectId, setSelectedProject, isViewingOrganization, setViewingOrganization } = useProjectContext();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

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
    // Navigate to the projects page
    navigate('/projects');
  };

  return (
    <aside 
      className="bg-[var(--main-sidebar-bg)] w-[60px] z-30 flex flex-col h-full rounded-r-2xl"
    >
      {/* All Buttons Section */}
      <div className="flex-1 px-2 pt-3 flex flex-col">
        {/* Top Section: Organization + New Project */}
        <div className="space-y-2 mb-3">
          {/* Organization Button */}
          <SidebarAvatarButton
            avatarUrl={userData?.organization?.logo_url}
            backgroundColor="var(--accent)"
            borderColor="rgba(255, 255, 255, 0.3)"
            letter={userData?.organization?.name ? getOrganizationInitials(userData.organization.name) : 'O'}
            shape="rounded"
            isActive={isViewingOrganization}
            onClick={() => {
              setViewingOrganization(!isViewingOrganization);
            }}
          />
          
          {/* Create New Project Button */}
          <div
            className="w-9 h-9 flex items-center justify-center cursor-pointer"
            onClick={handleCreateProject}
            data-testid="create-project-button"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/30 mb-3"></div>
        
        {/* Projects Section */}
        <div className="space-y-2">
          {sortedProjects.map((project: any) => {
            const isActive = selectedProjectId === project.id;
            return (
              <div key={project.id} style={{ opacity: isActive ? 1 : 0.6 }}>
                <SidebarAvatarButton
                  backgroundColor={project.color || 'var(--main-sidebar-button-bg)'}
                  letter={getProjectInitials(project.name)}
                  isActive={isActive}
                  shape="circular"
                  onClick={() => handleProjectSelect(project.id)}
                  testId={`project-avatar-${project.id}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* User Profile Avatar - Bottom */}
      <div className="px-2 pb-3">
        <SidebarAvatarButton
          avatarUrl={userData?.user?.avatar_url}
          backgroundColor="var(--accent)"
          borderColor="rgba(255, 255, 255, 0.3)"
          letter={userData?.user?.full_name ? userData.user.full_name.charAt(0).toUpperCase() : 'U'}
          shape="circular"
          onClick={() => {
            navigate('/profile');
          }}
          testId="user-profile-avatar"
        />
      </div>
    </aside>
  );
}