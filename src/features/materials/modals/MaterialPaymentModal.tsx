import { useRef } from 'react'
import { Package } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { MaterialPaymentFormFields } from '../forms/MaterialPaymentFormFields'
interface MaterialPaymentModalProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    paymentId?: string;
  };
  onClose: () => void;
  mode?: 'create'| 'edit'| 'view';
}
export function MaterialPaymentModal({ modalData, onClose, mode = 'create'}: MaterialPaymentModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
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
          icon={Package}
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
        <MaterialPaymentFormFields
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
export default MaterialPaymentModal
