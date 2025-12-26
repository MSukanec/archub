import { useRef } from 'react';
import { Building } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { AdminOrganizationForm } from '../forms/AdminOrganizationForm';
interface Organization {
  id: string;
  name: string;
  is_active: boolean;
  plan_id: string;
  settings?: {
    is_founder?: boolean;
    [key: string]: any;
  } | null;
}
interface OrganizationModalProps {
  modalData?: {
    organization?: Organization;
    isEditing?: boolean;
    mode?: 'create'| 'edit'| 'view';
  };
  onClose: () => void;
}
export function AdminOrganizationModal({ modalData, onClose }: OrganizationModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { organization, isEditing = false, mode: modeFromData } = modalData || {};
  
  const mode = modeFromData || (organization ? 'edit': 'create');
  const getHeader = () => {
    switch (mode) {
      case 'view':
        return { title: 'Ver Organización', description: 'Detalles de la organización'};
      case 'edit':
        return { title: 'Editar Organización', description: 'Modifica los datos de la organización'};
      default:
        return { title: 'Nueva Organización', description: 'Crea una nueva organización'};
    }
  };
  const getSubmitText = () => {
    switch (mode) {
      case 'view': return 'Cerrar';
      case 'edit': return 'Guardar Cambios';
      default: return 'Crear';
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
      size="md"
      headerContent={
        <ModalHeader
          title={header.title}
          description={header.description}
          icon={Building}
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
        <AdminOrganizationForm
          organizationId={organization?.id}
          organization={organization}
          mode={mode}
          onSuccess={onClose}
          onCancel={onClose}
          hideActions={true}
          formRef={formRef}
        />
      </ModalBody>
    </ModalLayout>
  );
}