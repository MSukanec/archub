import { useQuery } from '@tanstack/react-query';
import { getLaborTypes } from '../services/getLaborTypes';
export function useLaborTypes() {
  return useQuery({
    queryKey: ['labor-types'],
    queryFn: () => getLaborTypes(),
    staleTime: 5 * 60 * 1000,
  });
}
