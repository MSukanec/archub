import { useRef } from 'react'
import { TrendingUp } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { PartnerContributionForm } from '../forms/PartnerContributionForm'

interface PartnerContributionModalProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    contributionId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function PartnerContributionModal({ modalData, onClose, mode = 'create' }: PartnerContributionModalProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: 'Ver Aporte',
          description: 'Consulta los detalles del aporte de socio seleccionado',
        };
      case 'edit':
        return {
          title: 'Editar Aporte',
          description: 'Modifica los datos del aporte de socio seleccionado',
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Aporte de Socio',
          description: 'Registra un nuevo aporte de capital de un socio',
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
        return 'Registrar Aporte';
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
          icon={TrendingUp}
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
        <PartnerContributionForm
          projectId={modalData?.projectId}
          organizationId={modalData?.organizationId}
          contributionId={modalData?.contributionId}
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

export default PartnerContributionModal
