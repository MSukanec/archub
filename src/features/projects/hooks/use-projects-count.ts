import { useQuery } from '@tanstack/react-query';
import { getProjectsCount } from '../services/getProjectsCount';
import { useProjectContext } from '@/stores/projectContext';
import { QUERY_KEYS } from '../constants';

export function useProjectsCount(organizationId?: string | undefined) {
  const { currentOrganizationId } = useProjectContext();
  
  // Use ProjectContext organizationId as primary source, fallback to parameter
  const effectiveOrganizationId = organizationId || currentOrganizationId;
  
  return useQuery({
    queryKey: [QUERY_KEYS.PROJECTS_COUNT, effectiveOrganizationId],
    queryFn: () => getProjectsCount(effectiveOrganizationId!),
    enabled: !!effectiveOrganizationId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    placeholderData: (prev) => prev ?? 0,
  });
}
