import { useQuery } from '@tanstack/react-query';
import { getPersonnelRates } from '../services/getPersonnelRates';
import { PERSONNEL_QUERY_KEYS } from '../constants';

export function usePersonnelRates(personnelId?: string, organizationId?: string) {
  return useQuery({
    queryKey: PERSONNEL_QUERY_KEYS.rates(personnelId || ''),
    queryFn: () => getPersonnelRates(personnelId || '', organizationId || ''),
    enabled: !!personnelId && !!organizationId,
  });
}
