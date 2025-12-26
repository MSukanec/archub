import { useRef } from 'react'
import { Receipt } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { CapitalAdjustmentForm } from '../forms/CapitalAdjustmentForm'

interface CapitalAdjustmentModalProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    adjustmentId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function CapitalAdjustmentModal({ modalData, onClose, mode = 'create' }: CapitalAdjustmentModalProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: 'Ver Ajuste',
          description: 'Consulta los detalles del ajuste de capital seleccionado',
        };
      case 'edit':
        return {
          title: 'Editar Ajuste',
          description: 'Modifica los datos del ajuste de capital seleccionado',
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Ajuste de Capital',
          description: 'Registra un ajuste positivo o negativo al capital',
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
        return 'Registrar Ajuste';
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
          icon={Receipt}
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
        <CapitalAdjustmentForm
          projectId={modalData?.projectId}
          organizationId={modalData?.organizationId}
          adjustmentId={modalData?.adjustmentId}
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

export default CapitalAdjustmentModal
