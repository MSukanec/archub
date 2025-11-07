import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  
  if (!open || !currentInvitation) return null;

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

  // Header content
  const headerContent = (
    <FormModalHeader
      title="Invitación a organización"
      description={
        hasMultiple
          ? `Tienes ${invitations.length} invitaciones pendientes (${currentIndex + 1}/${invitations.length})`
          : 'Te invitaron a unirte a una organización'
      }
      icon={Mail}
    />
  );

  // View panel with invitation details
  const viewPanel = (
    <div className="space-y-4" data-testid="invitation-modal">
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground mb-2">
          Te invitaron a unirte a
        </p>
        <p className="text-lg font-semibold text-foreground">
          {currentInvitation.organization_name}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <p className="text-sm text-muted-foreground">
            como
          </p>
          <Badge variant="secondary" className="font-medium">
            {currentInvitation.role_name}
          </Badge>
        </div>
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
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} de {invitations.length}
          </p>
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
  );

  // Footer with action buttons
  const footerContent = (
    <FormModalFooter
      leftLabel="Rechazar"
      onLeftClick={handleReject}
      rightLabel={acceptMutation.isPending ? 'Aceptando...' : 'Aceptar invitación'}
      onRightClick={handleAccept}
      submitVariant="default"
      submitDisabled={isLoading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={null}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={false}
      onClose={onClose}
      wide={false}
    />
  );
}
