import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './use-current-user';

export interface PendingInvitation {
  id: string;
  organization_id: string;
  organization_name: string;
  role_id: string;
  role_name: string;
  invited_by: string;
  created_at: string;
}

export function usePendingInvitations() {
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.user?.id;

  return useQuery<PendingInvitation[]>({
    queryKey: ['pending-invitations', userId],
    enabled: !!userId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
