import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/features/users/hooks';
import { useNavigationStore } from '@/stores/navigationStore';
import type { PendingInvitation } from '@/hooks/use-pending-invitations';

export interface UseInvitationFormProps {
  invitations: PendingInvitation[];
  currentIndex: number;
  onClose: () => void;
  setCurrentIndex: (index: number) => void;
}

export function useInvitationForm({
  invitations,
  currentIndex,
  onClose,
  setCurrentIndex,
}: UseInvitationFormProps) {
  const { toast } = useToast();
  const { data: user } = useCurrentUser();
  const [, navigate] = useLocation();
  const setCurrentProject = useNavigationStore((state) => state.setCurrentProject);

  const acceptMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiRequest('POST', '/api/accept-invitation', { invitationId });
      return response.json();
    },
    onSuccess: async (_data, invitationId) => {
      const acceptedInvitation = invitations.find(inv => inv.id === invitationId);
      
      toast({
        title: '¡Invitación aceptada!',
        description: 'Te uniste exitosamente a la organización',
      });
      queryClient.invalidateQueries({ queryKey: ['pending-invitations', user?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      if (currentIndex < invitations.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
        if (acceptedInvitation && user?.user?.id) {
          await supabase
            .from('user_preferences')
            .update({ last_organization_id: acceptedInvitation.organization_id })
            .eq('user_id', user.user.id);
          
          setCurrentProject(null);
          queryClient.invalidateQueries({ queryKey: ['current-user'] });
          navigate('/organization/dashboard');
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo aceptar la invitación',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiRequest('POST', '/api/reject-invitation', { invitationId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Invitación rechazada',
        description: 'Has rechazado la invitación',
      });
      queryClient.invalidateQueries({ queryKey: ['pending-invitations', user?.user?.id] });
      
      if (currentIndex < invitations.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo rechazar la invitación',
        variant: 'destructive',
      });
    },
  });

  return {
    acceptMutation,
    rejectMutation,
    isLoading: acceptMutation.isPending || rejectMutation.isPending,
  };
}
