import { useRef } from 'react'
import { Users } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { PersonnelPaymentFormFields } from '../forms/PersonnelPaymentForm'

interface PersonnelPaymentModalProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    paymentId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function PersonnelPaymentModal({ modalData, onClose, mode = 'create' }: PersonnelPaymentModalProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: 'Ver Pago de Personal',
          description: 'Consulta los detalles del pago seleccionado',
        };
      case 'edit':
        return {
          title: 'Editar Pago de Personal',
          description: 'Modifica los datos del pago seleccionado',
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Pago de Personal',
          description: 'Registra un nuevo pago de personal',
        };
    }
  };

  const getSubmitText = () => {
    switch (mode) {
      case 'view':
        return 'Cerrar';
      case 'edit':
        return 'Guardar Cambios';
      case 'create':
      default:
        return 'Registrar Pago';
    }
  };

  const handleSubmit = () => {
    if (mode === 'view') {
      onClose();
    } else if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const header = getHeader();

  return (
    <ModalLayout 
      onClose={onClose} 
      size="lg"
      headerContent={
        <ModalHeader
          title={header.title}
          description={header.description}
          icon={Users}
        />
      }
      footerContent={
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={getSubmitText()}
          onSubmit={handleSubmit}
        />
      }
    >
      <ModalBody>
        <PersonnelPaymentFormFields
          projectId={modalData?.projectId}
          organizationId={modalData?.organizationId}
          paymentId={modalData?.paymentId}
          mode={mode}
          onSuccess={onClose}
          onCancel={onClose}
          hideActions={true}
          formRef={formRef}
        />
      </ModalBody>
    </ModalLayout>
  )
}

export default PersonnelPaymentModal
