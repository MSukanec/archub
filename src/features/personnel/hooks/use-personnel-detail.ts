import { useQuery } from '@tanstack/react-query';
import { getPersonnelDetail } from '../services/getPersonnelDetail';
import { PERSONNEL_QUERY_KEYS } from '../constants';
export function usePersonnelDetail(personnelId?: string) {
  return useQuery({
    queryKey: PERSONNEL_QUERY_KEYS.detail(personnelId || ''),
    queryFn: () => getPersonnelDetail(personnelId || ''),
    enabled: !!personnelId,
    staleTime: 0,
  });
}
