import { Package } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody } from '@/components/modal'
import { MaterialPaymentFormFields } from '../forms/MaterialPaymentFormFields'

interface MaterialPaymentModalProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    paymentId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function MaterialPaymentModal({ modalData, onClose, mode = 'create' }: MaterialPaymentModalProps) {
  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: 'Ver Pago de Materiales',
          description: 'Consulta los detalles del pago seleccionado',
        };
      case 'edit':
        return {
          title: 'Editar Pago de Materiales',
          description: 'Modifica los datos del pago seleccionado',
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Pago de Materiales',
          description: 'Registra un nuevo pago de materiales',
        };
    }
  };

  const header = getHeader();

  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={Package}
      />
      <ModalBody>
        <MaterialPaymentFormFields
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

export default MaterialPaymentModal
