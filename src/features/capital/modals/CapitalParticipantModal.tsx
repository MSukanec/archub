import { useRef } from 'react';
import { HandHeart } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { CapitalParticipantForm } from '../forms/CapitalParticipantForm';
export interface CapitalParticipantModalProps {
  modalData?: {
    organizationId?: string;
    participantId?: string;
    mode?: 'create'| 'edit';
  };
  onClose: () => void;
}
export function CapitalParticipantModal({ modalData, onClose }: CapitalParticipantModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  
  const { organizationId, participantId, mode = 'create'} = modalData || {};
  const isEditing = mode === 'edit'&& !!participantId;
  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };
  const headerContent = (
    <ModalHeader 
      title={isEditing ? 'Editar Participante': 'Agregar Participante'}
      description={isEditing 
        ? 'Actualiza la información del participante de capital.'
        : 'Selecciona un contacto existente para agregarlo como participante de capital.'
      }
      icon={HandHeart}
    />
  );
  const footerContent = (
    <ModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      submitText={isEditing ? 'Actualizar': 'Agregar Participante'}
      onSubmit={handleSubmit}
    />
  );
  return (
    <ModalLayout
      onClose={onClose}
      size="md"
      headerContent={headerContent}
      footerContent={footerContent}
    >
      <ModalBody>
        <CapitalParticipantForm
          organizationId={organizationId}
          partnerId={participantId}
          mode={isEditing ? 'edit': 'create'}
          onSuccess={onClose}
          onCancel={onClose}
          hideActions={true}
          formRef={formRef}
        />
      </ModalBody>
    </ModalLayout>
  );
}
// Backward compatibility alias
export const PartnerModal = CapitalParticipantModal;
