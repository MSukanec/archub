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
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      // Get the current session token for authentication
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // Use API endpoint instead of direct Supabase query
      // This avoids stack depth limit from recursive JOINs in PostgREST
      const response = await fetch(`/api/organization-members/${organizationId}`, {
        credentials: "include",
        headers,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch organization members' }));
        console.error('Error fetching organization members:', error);
        throw new Error(error.error || 'Failed to fetch organization members');
      }

      const members = await response.json();
      return members as OrganizationMember[];
    },
    enabled: !!organizationId,
  });
}