import { FolderPlus } from "lucide-react";
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from "@/components/modal";
import { useToast } from "@/hooks/use-toast";
import { 
  FormPanel, 
  ViewPanel, 
  useProjectForm,
  type Project 
} from '../forms/ProjectForm';

interface ProjectModalProps {
  modalData?: any;
  project?: Project;
  mode?: 'create' | 'edit' | 'view';
  onClose: () => void;
}

export function ProjectModal({ modalData, project: projectProp, mode: modeProp, onClose }: ProjectModalProps) {
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
    callbacks: {
      onImageUploadStart: () => {
        toast({
          title: "Subiendo imagen...",
          description: "Tu imagen se está procesando",
        });
      },
      onImageUploadSuccess: () => {
        toast({
          title: "Imagen subida",
          description: "La imagen principal se ha guardado correctamente"
        });
      },
      onImageUploadError: (error) => {
        toast({
          title: "Error al subir imagen",
          description: error.message || "No se pudo subir la imagen.",
          variant: "destructive"
        });
      },
      onSubmitSuccess: (submitMode) => {
        toast({
          title: submitMode === 'edit' ? "Proyecto actualizado" : "Proyecto creado",
          description: submitMode === 'edit' 
            ? "El proyecto ha sido actualizado exitosamente"
            : "El nuevo proyecto ha sido creado exitosamente y está activo"
        });
      },
      onSubmitError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Hubo un error al procesar el proyecto",
          variant: "destructive",
        });
      },
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
