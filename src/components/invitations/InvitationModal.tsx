import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import type { PendingInvitation } from '@/hooks/use-pending-invitations';

interface InvitationModalProps {
  invitations: PendingInvitation[];
  open: boolean;
  onClose: () => void;
}

export function InvitationModal({ invitations, open, onClose }: InvitationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();
  const { data: user } = useCurrentUser();
  
  const currentInvitation = invitations[currentIndex];
  const hasMultiple = invitations.length > 1;

  const acceptMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiRequest('POST', '/api/accept-invitation', { invitationId });
      return response.json();
    },
    onSuccess: () => {
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

  const handleAccept = () => {
    if (currentInvitation) {
      acceptMutation.mutate(currentInvitation.id);
    }
  };

  const handleReject = () => {
    if (currentInvitation) {
      rejectMutation.mutate(currentInvitation.id);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < invitations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const isLoading = acceptMutation.isPending || rejectMutation.isPending;

  if (!currentInvitation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md"
        data-testid="invitation-modal"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle>Invitación a organización</DialogTitle>
              {hasMultiple && (
                <DialogDescription>
                  {currentIndex + 1} de {invitations.length} invitaciones
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Te invitaron a unirte a
            </p>
            <p className="text-lg font-semibold text-foreground">
              {currentInvitation.organization_name}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              como <span className="font-medium text-foreground">{currentInvitation.role_name}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleReject}
              variant="secondary"
              className="flex-1"
              disabled={isLoading}
              data-testid="button-reject-invitation"
            >
              Rechazar
            </Button>
            <Button
              onClick={handleAccept}
              variant="default"
              className="flex-1"
              disabled={isLoading}
              data-testid="button-accept-invitation"
            >
              {acceptMutation.isPending ? 'Aceptando...' : 'Aceptar invitación'}
            </Button>
          </div>

          {hasMultiple && (
            <div className="flex items-center justify-between border-t pt-4">
              <Button
                onClick={handlePrevious}
                variant="ghost"
                size="sm"
                disabled={currentIndex === 0 || isLoading}
                data-testid="button-previous-invitation"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                onClick={handleNext}
                variant="ghost"
                size="sm"
                disabled={currentIndex === invitations.length - 1 || isLoading}
                data-testid="button-next-invitation"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
