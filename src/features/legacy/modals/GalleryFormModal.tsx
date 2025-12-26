import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { uploadGalleryFiles, type GalleryFileInput } from '@/utils/uploadGalleryFiles';
import { deleteMediaFile } from '@/features/media/services/deleteMediaFile';
import { FormModalLayout } from '@/components/modal';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { useModalPanelStore } from '@/components/modal';
import { Images } from 'lucide-react';
import { useProjectContext } from '@/stores/projectContext';
import { FileUploader } from '@/components/shared/fields/FileUploader';
import { supabase } from '@/lib/supabase';
interface GalleryFormModalProps {
  modalData?: {
    editingFile?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}
export function GalleryFormModal({ modalData, onClose }: GalleryFormModalProps) {
  const { editingFile, isEditing = false } = modalData || {};
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPanel } = useModalPanelStore();
  const [filesToUpload, setFilesToUpload] = useState<any[]>([]);
  const [existingFileDeleted, setExistingFileDeleted] = useState(false);
  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);
  const existingFiles = editingFile && !existingFileDeleted 
    ? [{
        id: editingFile.id,
        file_name: editingFile.file_name,
        file_type: editingFile.mime_type?.split('/')[0] || 'document',
        file_size: editingFile.file_size || 0,
        file_url: editingFile.file_url,
        mime_type: editingFile.mime_type,
      }]
    : [];
  const handleExistingFileDelete = async (fileId: string) => {
    setExistingFileDeleted(true);
  };
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!userData) {
        throw new Error('No se han cargado los datos del usuario');
      }
      if (!currentOrganizationId) {
        throw new Error('No hay organización seleccionada');
      }
      // If there are files to upload, upload them FIRST before deleting anything
      if (filesToUpload.length > 0) {
        const galleryFiles: GalleryFileInput[] = filesToUpload.map((fileInput) => ({
          file: fileInput.file,
          title: fileInput.title || fileInput.file.name.replace(/\.[^/.]+$/, ''),
          description: fileInput.description || '',
        }));
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')
          .select('id, user_id, organization_id, is_active')
          .eq('organization_id', currentOrganizationId)
          .eq('user_id', userData.user?.id)
          .eq('is_active', true)
          .single();
        
        if (memberError || !memberData?.id) {
          throw new Error(`No se encontró la membresía activa. Error: ${memberError?.message || 'Member not found'}`);
        }
        
        const createdByMemberId = memberData.id;
        // Upload new files first - if this fails, the existing file remains intact
        await uploadGalleryFiles(
          galleryFiles,
          selectedProjectId || null,
          currentOrganizationId,
          createdByMemberId,
          'organization'
        );
      }
      // Only delete the existing file AFTER new files have been uploaded successfully
      // This ensures no data loss if the upload fails
      if (existingFileDeleted && editingFile?.id) {
        await deleteMediaFile(editingFile.id);
      }
    },
    onSuccess: () => {
      let description = '';
      
      if (existingFileDeleted && filesToUpload.length > 0) {
        description = 'Archivo reemplazado correctamente';
      } else if (existingFileDeleted) {
        description = 'Archivo eliminado correctamente';
      } else if (editingFile) {
        description = 'Archivos agregados correctamente';
      } else {
        description = `${filesToUpload.length > 1 ? 'Archivos subidos': 'Archivo subido'} correctamente`;
      }
      
      toast({
        title: 'Éxito',
        description,
      });
      queryClient.invalidateQueries({ queryKey: ['galleryFiles'] });
      handleClose();
    },
    onError: (error) => {
      // Reset deletion flag so the modal shows the preserved existing file
      setExistingFileDeleted(false);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar archivos',
        variant: 'destructive',
      });
    },
  });
  const handleClose = () => {
    setFilesToUpload([]);
    onClose();
  };
  const handleSubmit = () => {
    const hasExistingFile = editingFile && !existingFileDeleted;
    
    if (filesToUpload.length === 0 && !hasExistingFile) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos un archivo',
        variant: 'destructive',
      });
      return;
    }
    uploadMutation.mutate();
  };
  if (userLoading) return null;
  const editPanel = (
    <div className="space-y-4">
      <FileUploader
        mode="multiple"
        existingFiles={existingFiles}
        filesToUpload={filesToUpload}
        onFilesChange={setFilesToUpload}
        onExistingFileDelete={handleExistingFileDelete}
        accept="media"
        compressOnDrop={true}
        maxSize={50 * 1024 * 1024}
        emptyStateDescription="Haz clic aquí para seleccionar archivos"
      />
    </div>
  );
  const headerContent = (
    <FormModalHeader
      title="Subir Archivo Multimedia"
      icon={Images}
    />
  );
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingFile ? "Actualizar" : "Subir"}
      onRightClick={handleSubmit}
      submitDisabled={uploadMutation.isPending}
      showLoadingSpinner={uploadMutation.isPending}
    />
  );
  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}
