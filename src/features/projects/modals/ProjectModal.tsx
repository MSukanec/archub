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
  mode?: 'create'| 'edit'| 'view';
  onClose: () => void;
}
export function ProjectModal({ modalData, project: projectProp, mode: modeProp, onClose }: ProjectModalProps) {
  const project = projectProp || modalData?.project || modalData?.editingProject;
  const mode = modeProp || modalData?.mode || (project ? 'edit': 'create');
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
    handleImageDelete,
    mode: formMode,
    isSubmitting,
    isUploadingImage,
    isDeletingImage,
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
    },
  });
  const handleClose = () => {
    if (isUploadingImage || isDeletingImage) {
      toast({
        title: "Espera un momento",
        description: isUploadingImage ? "La imagen se está subiendo, por favor espera..." : "La imagen se está eliminando, por favor espera...",
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
          currentImageUrl={mode === 'edit'? currentImageUrl : null}
          imagePreviewUrl={imagePreviewUrl}
          onFileSelect={handleFileSelect}
          mode={mode}
          handleImageDelete={handleImageDelete}
          isUploadingImage={isUploadingImage}
          isDeletingImage={isDeletingImage}
        />
      </ModalBody>
      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={handleClose}
        submitText={mode === 'edit'? 'Actualizar Proyecto': 'Crear Proyecto'}
        onSubmit={() => form.handleSubmit(onSubmit)()}
        isSubmitting={isSubmitting}
      />
    </ModalLayout>
  );
}
