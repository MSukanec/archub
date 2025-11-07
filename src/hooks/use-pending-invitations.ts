import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './use-current-user';
import { supabase } from '@/lib/supabase';

export interface PendingInvitationMember {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface PendingInvitation {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_avatar: string | null;
  role_id: string;
  role_name: string;
  invited_by: string;
  created_at: string;
  members: PendingInvitationMember[];
}

export function usePendingInvitations() {
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.user?.id;

  return useQuery<PendingInvitation[]>({
    queryKey: ['pending-invitations', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get the current session token for authentication
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/pending-invitations/${userId}`, {
        credentials: 'include',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending invitations');
      }
      
      return response.json();
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
