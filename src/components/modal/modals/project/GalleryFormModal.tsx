import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { uploadGalleryFiles, type GalleryFileInput } from '@/utils/uploadGalleryFiles';
import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Images } from 'lucide-react';
import { useProjectContext } from '@/stores/projectContext';
import { UploadMediaField } from '@/components/ui-custom/fields/UploadMediaField';
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

  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!userData) {
        throw new Error('No se han cargado los datos del usuario');
      }

      if (!currentOrganizationId) {
        throw new Error('No hay organización seleccionada');
      }

      if (filesToUpload.length === 0) {
        throw new Error('Debes seleccionar al menos un archivo');
      }

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

      return uploadGalleryFiles(
        galleryFiles,
        selectedProjectId || null,
        currentOrganizationId,
        createdByMemberId,
        'organization'
      );
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: editingFile 
          ? 'Archivo actualizado correctamente'
          : `${filesToUpload.length > 1 ? 'Archivos subidos' : 'Archivo subido'} correctamente`,
      });
      queryClient.invalidateQueries({ queryKey: ['galleryFiles'] });
      handleClose();
    },
    onError: (error) => {
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
    if (filesToUpload.length === 0) {
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
      <UploadMediaField
        existingFiles={[]}
        filesToUpload={filesToUpload}
        onFilesChange={setFilesToUpload}
        acceptedTypes={{
          'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
          'video/*': ['.mp4', '.mov', '.avi', '.mkv']
        }}
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
