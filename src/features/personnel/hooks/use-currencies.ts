import { useQuery } from '@tanstack/react-query';
import { getCurrencies } from '../services/getCurrencies';

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: () => getCurrencies(),
    staleTime: 5 * 60 * 1000,
  });
}
