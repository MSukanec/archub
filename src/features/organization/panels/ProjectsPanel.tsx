import { Folder, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatCard, StatCardTitle, StatCardContent } from '@/components/dashboard';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { ProjectItemCard } from '@/features/projects';

interface ProjectsPanelProps {
  projects: any[];
  activeProjectId: string | null | undefined;
  isLoading: boolean;
  onSelectProject: (projectId: string) => void;
  onEditProject: (project: any) => void;
  onNavigateToProjects: () => void;
}

export function ProjectsPanel({
  projects,
  activeProjectId,
  isLoading,
  onSelectProject,
  onEditProject,
  onNavigateToProjects,
}: ProjectsPanelProps) {
  const projectsWithActive = projects.map(project => ({
    ...project,
    is_active: project.id === activeProjectId
  }));
  
  const sortedProjects = activeProjectId ? [
    ...projectsWithActive.filter(project => project.id === activeProjectId),
    ...projectsWithActive.filter(project => project.id !== activeProjectId)
  ] : projectsWithActive;

  const activeProjects = sortedProjects.filter(p => p.status === 'active');

  return (
    <StatCard href="/organization/projects">
      <StatCardTitle>Proyectos Activos</StatCardTitle>
      <StatCardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeProjects.map((project) => (
              <ProjectItemCard
                key={project.id}
                project={project}
                onClick={() => onSelectProject(project.id)}
                onNavigateToProject={() => onSelectProject(project.id)}
                onEdit={() => onEditProject(project)}
                isActive={project.id === activeProjectId}
                projectColor={project.use_custom_color && project.custom_color_hex 
                  ? project.custom_color_hex 
                  : project.color || 'var(--accent)'}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Folder className="w-12 h-12" />}
            title="No hay proyectos en proceso"
            description="Ve a la página de gestión de proyectos para cambiar el estado de un proyecto"
            action={
              <Button
                variant="default"
                onClick={onNavigateToProjects}
                data-testid="button-ir-gestion-proyectos"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Ir a Gestión de Proyectos
              </Button>
            }
          />
        )}
      </StatCardContent>
    </StatCard>
  );
}
