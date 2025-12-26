import { useState } from 'react';
import { ChevronLeft, ChevronRight, Mail, Building2 } from 'lucide-react';
import { FormModalLayout } from '@/components/modal';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CompactAvatarGroup } from '@/components/shared/CompactAvatarGroup';
import { useInvitationForm, type UseInvitationFormProps } from '../forms/InvitationForm';
import type { PendingInvitation } from '@/hooks/use-pending-invitations';
interface InvitationModalProps {
  invitations: PendingInvitation[];
  open: boolean;
  onClose: () => void;
}
export function InvitationModal({ invitations, open, onClose }: InvitationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentInvitation = invitations[currentIndex];
  const hasMultiple = invitations.length > 1;
  
  if (!open || !currentInvitation) return null;
  const { acceptMutation, rejectMutation, isLoading } = useInvitationForm({
    invitations,
    currentIndex,
    onClose,
    setCurrentIndex,
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
        <p className="text-sm text-muted-foreground mb-3">
          Te invitaron a unirte a
        </p>
        
        {/* Organization info with avatar */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="w-14 h-14 border-2 border-background">
            {currentInvitation.organization_avatar ? (
              <AvatarImage 
                src={currentInvitation.organization_avatar} 
                alt={currentInvitation.organization_name} 
              />
            ) : (
              <AvatarFallback>
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <p className="text-lg font-semibold text-foreground">
              {currentInvitation.organization_name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">
                como
              </p>
              <Badge className="font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90">
                {currentInvitation.role_name}
              </Badge>
            </div>
          </div>
        </div>
        {/* Members preview */}
        {currentInvitation.members && currentInvitation.members.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              {currentInvitation.members.length} {currentInvitation.members.length === 1 ? 'miembro': 'miembros'}
            </p>
            <CompactAvatarGroup members={currentInvitation.members} maxDisplay={4} size="md" />
          </div>
        )}
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
      rightLabel={acceptMutation.isPending ? 'Aceptando...': 'Aceptar invitación'}
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
