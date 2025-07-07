import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  category: string;
  created_at: string;
}

export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await supabase
        .from('units')
        .select('id, name, symbol, category, created_at')
        .order('category, name');

      if (error) {
        console.error('Error fetching units:', error);
        throw error;
      }

      return data as Unit[];
    },
  });
}