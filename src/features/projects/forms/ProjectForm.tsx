import { FolderPlus } from "lucide-react";
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from "@/components/modal";
import { useToast } from "@/hooks/use-toast";
import { 
  FormPanel, 
  ViewPanel, 
  useProjectForm,
  type Project 
} from './ProjectFormFields';

interface ProjectFormProps {
  modalData?: any;
  project?: Project;
  mode?: 'create' | 'edit' | 'view';
  onClose: () => void;
}

export function ProjectForm({ modalData, project: projectProp, mode: modeProp, onClose }: ProjectFormProps) {
  const project = projectProp || modalData?.project || modalData?.editingProject;
  const mode = modeProp || modalData?.mode || (project ? 'edit' : 'create');
  const { toast } = useToast();

  const {
    form,
    onSubmit,
    reset,
    projectTypes,
    projectModalities,
    organizationCurrencies,
    organizationId,
    currentImageUrl,
    imagePreviewUrl,
    handleFileSelect,
    isSubmitting,
    isUploadingImage,
  } = useProjectForm({
    project,
    mode,
    onSuccess: () => {
      reset();
      onClose();
    },
  });

  const handleClose = () => {
    if (isUploadingImage) {
      toast({
        title: "Espera un momento",
        description: "La imagen se está subiendo, por favor espera...",
        variant: "default"
      });
      return;
    }
    reset();
    onClose();
  };

  const getTitle = () => {
    if (mode === 'view') return project?.name || 'Proyecto';
    if (mode === 'edit') return 'Editar Proyecto';
    return 'Nuevo Proyecto';
  };

  const getDescription = () => {
    if (mode === 'view') return 'Detalles del proyecto';
    if (mode === 'edit') return 'Modifica los datos y configuración básica del proyecto';
    return 'Crea un nuevo proyecto para tu organización';
  };

  if (mode === 'view') {
    return (
      <ModalLayout onClose={handleClose} size="lg">
        <ModalHeader
          title={getTitle()}
          description={getDescription()}
          icon={FolderPlus}
        />
        <ModalBody>
          <ViewPanel 
            project={project} 
            projectTypes={projectTypes} 
            projectModalities={projectModalities} 
          />
        </ModalBody>
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={handleClose}
        />
      </ModalLayout>
    );
  }

  return (
    <ModalLayout onClose={handleClose} size="lg">
      <ModalHeader
        title={getTitle()}
        description={getDescription()}
        icon={FolderPlus}
      />
      <ModalBody>
        <FormPanel
          form={form}
          onSubmit={onSubmit}
          projectTypes={projectTypes}
          projectModalities={projectModalities}
          organizationCurrencies={organizationCurrencies}
          organizationId={organizationId}
          currentImageUrl={mode === 'edit' ? currentImageUrl : null}
          imagePreviewUrl={imagePreviewUrl}
          onFileSelect={handleFileSelect}
        />
      </ModalBody>
      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={handleClose}
        submitText={mode === 'edit' ? 'Actualizar Proyecto' : 'Crear Proyecto'}
        onSubmit={() => form.handleSubmit(onSubmit)()}
        isSubmitting={isSubmitting}
      />
    </ModalLayout>
  );
}

export default ProjectForm;
