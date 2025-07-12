import { useQuery } from '@tanstack/react-query';

interface Country {
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
  });
}