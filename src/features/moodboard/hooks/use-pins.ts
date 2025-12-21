import { useQuery } from '@tanstack/react-query';
import { getPins } from '../services/getPins';
import { QUERY_KEYS } from '../constants';

export function usePins() {
  return useQuery({
    queryKey: [QUERY_KEYS.PINS],
    queryFn: () => getPins(),
  });
}
