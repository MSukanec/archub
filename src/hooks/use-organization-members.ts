import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role_id: string;
  is_active: boolean;
  joined_at: string;
  last_active_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

export function useOrganizationMembers(organizationId?: string) {
  const { data: userData } = useCurrentUser();
  const effectiveOrgId = organizationId || userData?.organization?.id;

  return useQuery({
    queryKey: ['organization-members', effectiveOrgId],
    queryFn: async () => {
      if (!effectiveOrgId) throw new Error('Organization ID required');
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          organization_id,
          role_id,
          is_active,
          joined_at,
          last_active_at,
          users:user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('organization_id', effectiveOrgId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      
      // Transform the data to flatten the user relationship
      return (data || []).map(member => ({
        ...member,
        user: Array.isArray(member.users) ? member.users[0] : member.users
      })) as OrganizationMember[];
    },
    enabled: !!effectiveOrgId
  });
}