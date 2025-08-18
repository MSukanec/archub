import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Partner {
  id: string
  created_at: string
  contacts: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    company_name: string | null
  }
}

export function usePartners(organizationId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['partners', organizationId],
    queryFn: async (): Promise<Partner[]> => {
      if (!organizationId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('partners')
        .select(`
          id,
          created_at,
          contacts!inner(
            id,
            first_name,
            last_name,
            email,
            phone,
            company_name
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching partners:', error);
        throw error;
      }
      
      console.log('Partners fetched:', data);
      return (data as Partner[]) || [];
    },
    enabled: options?.enabled !== false && !!organizationId && !!supabase,
  });
}