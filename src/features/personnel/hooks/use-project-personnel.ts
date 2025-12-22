import { useQuery } from '@tanstack/react-query';
import { getProjectPersonnel } from '../services';
import { PERSONNEL_QUERY_KEYS } from '../constants';
import type { ProjectPersonnel } from '../types';

export function useProjectPersonnel(projectId?: string, organizationId?: string) {
  return useQuery({
    queryKey: PERSONNEL_QUERY_KEYS.byProject(projectId || ''),
    queryFn: () => getProjectPersonnel(projectId || '', organizationId || ''),
    enabled: !!projectId && !!organizationId,
    staleTime: 30000,
    gcTime: 60000,
  });
}
