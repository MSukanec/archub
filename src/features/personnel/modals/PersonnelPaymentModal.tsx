import { Users } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody } from '@/components/modal'
import { PersonnelPaymentFormFields } from '../forms/PersonnelPaymentFormFields'

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

  const header = getHeader();

  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={Users}
      />
      <ModalBody>
        <PersonnelPaymentFormFields
          projectId={modalData?.projectId}
          organizationId={modalData?.organizationId}
          paymentId={modalData?.paymentId}
          mode={mode}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </ModalBody>
    </ModalLayout>
  )
}

export default PersonnelPaymentModal
