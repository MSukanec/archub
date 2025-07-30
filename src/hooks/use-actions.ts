import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Action {
  id: string;
  name: string;
  created_at: string;
}

export function useActions() {
  return useQuery({
    queryKey: ['actions'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      return data as Action[];
    },
  });
}