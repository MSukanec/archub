import { useRef } from 'react'
import { TrendingDown } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { PartnerWithdrawalForm } from '../forms/PartnerWithdrawalForm'
interface PartnerWithdrawalModalProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    withdrawalId?: string;
  };
  onClose: () => void;
  mode?: 'create'| 'edit'| 'view';
}
export function PartnerWithdrawalModal({ modalData, onClose, mode = 'create'}: PartnerWithdrawalModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: 'Ver Retiro',
          description: 'Consulta los detalles del retiro de socio seleccionado',
        };
      case 'edit':
        return {
          title: 'Editar Retiro',
          description: 'Modifica los datos del retiro de socio seleccionado',
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Retiro de Socio',
          description: 'Registra un nuevo retiro de capital de un socio',
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
        return 'Registrar Retiro';
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
          icon={TrendingDown}
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
        <PartnerWithdrawalForm
          projectId={modalData?.projectId}
          organizationId={modalData?.organizationId}
          withdrawalId={modalData?.withdrawalId}
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
export default PartnerWithdrawalModal
