import { useRef } from 'react';
import { HandHeart } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { PartnerFormFields } from '../forms/PartnerFormFields';

export interface PartnerModalProps {
  modalData?: {
    organizationId?: string;
    partnerId?: string;
    mode?: 'create' | 'edit';
  };
  onClose: () => void;
}

export function PartnerModal({ modalData, onClose }: PartnerModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  
  const { organizationId, partnerId, mode = 'create' } = modalData || {};
  const isEditing = mode === 'edit' && !!partnerId;

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const headerContent = (
    <ModalHeader 
      title={isEditing ? 'Editar Socio' : 'Ingresar Socio'}
      description={isEditing 
        ? 'Actualiza la información del socio de tu organización.' 
        : 'Selecciona un contacto existente para agregarlo como socio de tu organización.'
      }
      icon={HandHeart}
    />
  );

  const footerContent = (
    <ModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      submitText={isEditing ? 'Actualizar' : 'Agregar Socio'}
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
        <PartnerFormFields
          organizationId={organizationId}
          partnerId={partnerId}
          mode={isEditing ? 'edit' : 'create'}
          onSuccess={onClose}
          onCancel={onClose}
          hideActions={true}
          formRef={formRef}
        />
      </ModalBody>
    </ModalLayout>
  );
}
