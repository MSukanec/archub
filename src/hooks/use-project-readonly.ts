import { useProjectContext } from '@/stores/projectContext';
import { useProject } from '@/features/projects';
/**
 * Hook that determines if the current project is in read-only mode.
 * A project is read-only when is_over_limit is true (soft-locked due to plan limits).
 * 
 * @returns Object containing isReadOnly status and the current project data
 */
export function useProjectReadOnly() {
  const { selectedProjectId } = useProjectContext();
  const { data: project, isLoading } = useProject(selectedProjectId || undefined);
  
  const isReadOnly = (project as any)?.is_over_limit === true;
  
  return {
    isReadOnly,
    isLoading,
    project,
    projectId: selectedProjectId,
  };
}
