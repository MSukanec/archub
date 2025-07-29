import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OrganizationMember {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string;
  email: string;
}

export function useOrganizationMembers(organizationId?: string) {
  return useQuery({
    queryKey: ['organizationMembers', organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          users (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching organization members:', error);
        throw error;
      }

      // Transform data to flatten the user information
      const members = data?.map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        full_name: member.users?.full_name || 'Usuario sin nombre',
        avatar_url: member.users?.avatar_url || '',
        email: member.users?.email || '',
      })) || [];

      return members as OrganizationMember[];
    },
    enabled: !!organizationId,
  });
}