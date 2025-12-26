import { useOptimisticMutation } from '@/core/save-engine';
import { apiRequest } from '@/lib/queryClient';

interface InviteMemberInput {
  email: string;
  roleId: string;
  organizationId: string;
  linkedUserId?: string;
}

export function useInviteMember(organizationId: string, linkedUserId?: string) {
  return useOptimisticMutation({
    mutationFn: async (input: InviteMemberInput) => {
      const response = await apiRequest('POST', '/api/invite-member', input);
      return response.json();
    },
    queryKey: ['organization-members', organizationId],
    optimisticUpdate: (oldData) => oldData,
    onSuccessMessage: 'Invitación enviada',
    onErrorMessage: 'No se pudo enviar la invitación',
    additionalQueryKeys: linkedUserId 
      ? [['is-member', linkedUserId, organizationId]]
      : [],
  });
}
