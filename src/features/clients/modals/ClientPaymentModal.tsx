import { DollarSign } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody } from '@/components/modal'
import { ClientPaymentFormFields } from '../forms/ClientPaymentFormFields'

interface ClientPaymentModalProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    paymentId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function ClientPaymentModal({ modalData, onClose, mode = 'create' }: ClientPaymentModalProps) {
  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: 'Ver Pago',
          description: 'Consulta los detalles del pago seleccionado',
        };
      case 'edit':
        return {
          title: 'Editar Pago',
          description: 'Modifica los datos del pago seleccionado',
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Pago de Cliente',
          description: 'Registra un nuevo pago de cliente al proyecto',
        };
    }
  };

  const header = getHeader();

  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={DollarSign}
      />
      <ModalBody>
        <ClientPaymentFormFields
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

export default ClientPaymentModal
