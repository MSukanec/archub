import { Tag } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { 
  FormPanel, 
  ViewPanel, 
  useProjectModalityForm,
  type ProjectModality 
} from '../forms/ProjectModalityForm';

interface ProjectModalityModalProps {
  modalData?: {
    projectModality?: ProjectModality;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function ProjectModalityModal({ modalData, onClose, mode = 'create' }: ProjectModalityModalProps) {
  const { projectModality } = modalData || {};

  const {
    form,
    onSubmit,
    reset,
    isSubmitting,
  } = useProjectModalityForm({
    projectModality,
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
          title: 'Detalle de Modalidad',
          description: 'Información de la modalidad de proyecto'
        };
      case 'edit':
        return {
          title: 'Editar Modalidad',
          description: 'Modifica los datos de la modalidad de proyecto'
        };
      case 'create':
      default:
        return {
          title: 'Nueva Modalidad',
          description: 'Crea una nueva modalidad de proyecto para tu organización'
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
        {mode === 'view' && projectModality ? (
          <ViewPanel data={projectModality} />
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
