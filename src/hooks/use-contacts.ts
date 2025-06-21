import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Contact {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  location: string;
  notes: string;
  contact_type_id: string;
  created_at: string;
  contact_type?: {
    id: string;
    name: string;
  };
}

export function useContacts(organizationId: string | undefined) {
  return useQuery<Contact[]>({
    queryKey: ['contacts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          contact_type:contact_types(id, name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!organizationId
  });
}