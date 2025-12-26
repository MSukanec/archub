import { useQuery } from '@tanstack/react-query';
import { useOrganizationMembers } from '@/features/organization';
import { getActivityData } from '../services/getActivityData';
import type { ActivityTimePeriod } from '../types';

export function useSiteLogActivity(
  organizationId: string | undefined,
  projectId: string | undefined,
  timePeriod: ActivityTimePeriod = 'week'
) {
  const { data: membersData } = useOrganizationMembers(organizationId);
  
  return useQuery({
    queryKey: ['sitelog-activity', organizationId, projectId, timePeriod],
    queryFn: () => getActivityData(organizationId!, projectId!, timePeriod, membersData!),
    enabled: !!organizationId && !!projectId && !!membersData
  });
}
