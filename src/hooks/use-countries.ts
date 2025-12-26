import { useQuery } from '@tanstack/react-query';

export interface Country {
  id: string;
  name: string;
  alpha_3: string;
  country_code: string;
}

export function useCountries() {
  return useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await fetch('/api/countries');
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      return response.json();
    },
    staleTime: Infinity, // Countries don't change, cache forever
    gcTime: Infinity, // Keep in cache forever (previously cacheTime)
  });
}