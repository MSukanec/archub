import { Tag } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { 
  FormPanel, 
  ViewPanel, 
  useProjectTypeForm,
  type ProjectType 
} from '../forms/ProjectTypeForm';

interface ProjectTypeModalProps {
  modalData?: {
    projectType?: ProjectType;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function ProjectTypeModal({ modalData, onClose, mode = 'create' }: ProjectTypeModalProps) {
  const { projectType } = modalData || {};

  const {
    form,
    onSubmit,
    reset,
    isSubmitting,
  } = useProjectTypeForm({
    projectType,
    mode,
    onSuccess: () => {
      reset();
      onClose();
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: 'Detalle de Tipo',
          description: 'Información del tipo de proyecto'
        };
      case 'edit':
        return {
          title: 'Editar Tipo',
          description: 'Modifica los datos del tipo de proyecto'
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Tipo',
          description: 'Crea un nuevo tipo de proyecto para tu organización'
        };
    }
  };

  const header = getHeader();

  return (
    <ModalLayout onClose={handleClose} size="md">
      <ModalHeader 
        title={header.title}
        description={header.description}
        icon={Tag}
      />
      
      <ModalBody>
        {mode === 'view' && projectType ? (
          <ViewPanel data={projectType} />
        ) : (
          <FormPanel form={form} onSubmit={onSubmit} />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={handleClose}
          rightLabel={mode === 'create' ? 'Crear' : 'Actualizar'}
          onRightClick={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitDisabled={isSubmitting}
        />
      )}
    </ModalLayout>
  );
}
