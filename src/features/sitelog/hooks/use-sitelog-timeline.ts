import { useQuery } from '@tanstack/react-query';
import { getTimelineData } from '../services/getTimelineData';
import type { TimePeriod } from '../types';

export function useSiteLogTimeline(
  organizationId: string | undefined,
  projectId: string | undefined,
  timePeriod: TimePeriod = 'days'
) {
  return useQuery({
    queryKey: ['sitelog-timeline', organizationId, projectId, timePeriod],
    queryFn: () => getTimelineData(organizationId!, projectId!, timePeriod),
    enabled: !!organizationId && !!projectId
  });
}
