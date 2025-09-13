import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjects } from '@/hooks/use-projects';
import { useProjectContext } from '@/stores/projectContext';
import { supabase } from '@/lib/supabase';

function getOrganizationInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getProjectInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function RightSidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const { data: userData } = useCurrentUser();
  const { currentProjectId, setCurrentProject } = useProjectContext();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: isLoadingProjects } = useProjects(
    userData?.organization?.id || ''
  );

  const selectedProjectId = currentProjectId || userData?.preferences?.last_project_id || null;

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
      setCurrentProject(projectId);
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
        "bg-[var(--main-sidebar-bg)] transition-all duration-300 z-30 flex flex-col h-full rounded-r-2xl",
        isExpanded ? "w-64" : "w-[60px]"
      )}
      style={{
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Organization Avatar - Top */}
      <div className="h-12 flex-shrink-0 pl-[14px] pr-2 pt-3">
        <div 
          className={cn(
            "flex items-center cursor-pointer transition-all duration-200 rounded-lg p-2 hover:bg-white/10",
            isExpanded ? "justify-start" : "justify-center"
          )}
        >
          {/* Organization Avatar */}
          <div className="flex-shrink-0 flex justify-center">
            {userData?.organization?.logo_url ? (
              <img 
                src={userData.organization.logo_url} 
                alt="Organización"
                className="w-8 h-8 rounded-lg border-2 border-white/30"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold border-2 border-white/30 text-sm"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {userData?.organization?.name ? getOrganizationInitials(userData.organization.name) : 'O'}
              </div>
            )}
          </div>
          
          {/* Organization Name - only when expanded */}
          {isExpanded && (
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/90 truncate">
                {userData?.organization?.name || 'Organización'}
              </p>
              <p className="text-xs text-white/60 truncate">
                Organización
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Projects Section */}
      <div className="flex-1 pl-[14px] pr-2">
        {/* Section Header - only when expanded */}
        {isExpanded && (
          <div className="h-8 flex items-center px-2 mb-[2px]">
            <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--main-sidebar-button-fg)' }}>
              PROYECTOS
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-[2px]">
          {/* Project Avatars */}
          {sortedProjects.map((project: any) => {
            const isActive = selectedProjectId === project.id;
            return (
              <div
                key={project.id}
                className={cn(
                  "flex items-center cursor-pointer transition-all duration-200 rounded-lg p-2",
                  "hover:bg-white/10",
                  isExpanded ? "justify-start" : "justify-center"
                )}
                onClick={() => handleProjectSelect(project.id)}
                data-testid={`project-avatar-${project.id}`}
              >
                {/* Project Avatar */}
                <div className="flex-shrink-0 flex justify-center">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold border-2 text-sm transition-all",
                      isActive ? "border-white" : "border-transparent"
                    )}
                    style={{ 
                      backgroundColor: project.color || 'var(--main-sidebar-button-bg)'
                    }}
                  >
                    {getProjectInitials(project.name)}
                  </div>
                </div>
                
                {/* Project Name - only when expanded */}
                {isExpanded && (
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-white/60 truncate">
                      {project.project_data?.modality?.name || project.project_data?.project_type?.name || 'Sin tipo'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Create New Project Button */}
          <div
            className={cn(
              "flex items-center cursor-pointer transition-all duration-200 rounded-lg p-2",
              "hover:bg-white/10",
              isExpanded ? "justify-start" : "justify-center"
            )}
            onClick={handleCreateProject}
            data-testid="create-project-button"
          >
            {/* Plus Icon */}
            <div className="flex-shrink-0 flex justify-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>
            
            {/* Create Project Text - only when expanded */}
            {isExpanded && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Nuevo Proyecto
                </p>
                <p className="text-xs text-white/60 truncate">
                  Crear proyecto
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}