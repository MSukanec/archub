import { useQuery } from '@tanstack/react-query';
import { getGeneralCosts } from '../services/getGeneralCosts';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';

export function useGeneralCosts(organizationId: string | null) {
  return useQuery({
    queryKey: GENERAL_COSTS_QUERY_KEYS.list(organizationId),
    queryFn: () => getGeneralCosts(organizationId!),
    enabled: !!organizationId,
  });
}
