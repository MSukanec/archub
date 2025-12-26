import { useQuery } from '@tanstack/react-query';
import { getProjectsCount } from '../services/getProjectsCount';
import { useProjectContext } from '@/stores/projectContext';
import { projectsKeys } from '@/core/query-keys';
export function useProjectsCount(organizationId?: string | undefined) {
  const { currentOrganizationId } = useProjectContext();
  
  const effectiveOrganizationId = organizationId || currentOrganizationId || undefined;
  
  return useQuery({
    queryKey: projectsKeys.count(effectiveOrganizationId),
    queryFn: () => getProjectsCount(effectiveOrganizationId!),
    enabled: !!effectiveOrganizationId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    placeholderData: (prev) => prev ?? 0,
  });
}
