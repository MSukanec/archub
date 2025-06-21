import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ContactType {
  id: string;
  name: string;
  created_at: string;
}

export function useContactTypes() {
  return useQuery<ContactType[]>({
    queryKey: ['contact-types'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('contact_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching contact types:', error);
        throw error;
      }

      return data || [];
    }
  });
}