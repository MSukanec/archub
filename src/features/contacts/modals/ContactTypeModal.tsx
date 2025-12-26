import { Tag } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { FormPanel, useContactTypeForm } from '../forms/ContactTypeForm';
import type { ContactType } from '../types';
interface ContactTypeModalProps {
  modalData?: {
    contactType?: ContactType;
    isEditing?: boolean;
  };
  onClose: () => void;
  mode?: 'create'| 'edit';
}
export function ContactTypeModal({ modalData, onClose, mode: propMode }: ContactTypeModalProps) {
  const { contactType, isEditing = false } = modalData || {};
  const mode = propMode || (isEditing || contactType ? 'edit': 'create');
  const { form, onSubmit, isSubmitting, canSubmit, handleClose } = useContactTypeForm({
    contactType,
    mode,
    onClose,
  });
  const getHeader = () => {
    switch (mode) {
      case 'edit':
        return { 
          title: 'Editar Tipo de Contacto', 
          description: 'Modifica el nombre del tipo de contacto'
        };
      case 'create':
      default:
        return { 
          title: 'Nuevo Tipo de Contacto', 
          description: 'Crea un nuevo tipo de contacto personalizado para tu organización'
        };
    }
  };
  const header = getHeader();
  return (
    <ModalLayout onClose={handleClose} size="sm">
      <ModalHeader 
        title={header.title}
        description={header.description}
        icon={Tag}
      />
      
      <ModalBody>
        <FormPanel form={form} onSubmit={onSubmit} />
      </ModalBody>
      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={handleClose}
        rightLabel={mode === 'create'? 'Crear Tipo': 'Guardar Cambios'}
        onRightClick={form.handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        canSubmit={() => canSubmit}
      />
    </ModalLayout>
  );
}
