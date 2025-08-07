import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { uploadGalleryFiles, type GalleryFileInput } from '@/utils/uploadGalleryFiles';
import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, File, Images, Image as ImageIcon, FileVideo } from 'lucide-react';

import { supabase } from '@/lib/supabase';

const gallerySchema = z.object({});

type GalleryFormData = z.infer<typeof gallerySchema>;

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPanel } = useModalPanelStore();
  const [files, setFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<{[key: number]: string}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize panel to edit mode when modal opens
  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  const form = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {},
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = form;

  // Reset form when editing file changes or user data loads
  useEffect(() => {
    if (userData) {
      reset({});
    }
  }, [editingFile, reset, userData]);

  const uploadMutation = useMutation({
    mutationFn: async (data: GalleryFormData) => {
      if (!userData?.organization_preferences?.last_project_id || !userData?.organization?.id) {
        throw new Error('No hay proyecto u organización seleccionada');
      }

      const galleryFiles: GalleryFileInput[] = files.map((file, index) => ({
        file,
        title: fileNames[index] || file.name.replace(/\.[^/.]+$/, ''),
        description: undefined,
        entry_type: 'registro_general',
      }));

      // Usar el ID del usuario actual como creador
      const userIdToUse = userData.user.id;

      return uploadGalleryFiles(
        galleryFiles,
        userData.organization_preferences.last_project_id,
        userData.organization?.id,
        userIdToUse
      );
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: editingFile 
          ? 'Archivo actualizado correctamente'
          : `${files.length > 1 ? 'Archivos subidos' : 'Archivo subido'} correctamente`,
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });

    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: 'Archivos no válidos',
        description: 'Solo se permiten archivos de imagen y video',
        variant: 'destructive',
      });
    }

    setFiles(validFiles);
    
    // Initialize file names with original names (without extension)
    const newFileNames: {[key: number]: string} = {};
    validFiles.forEach((file, index) => {
      newFileNames[index] = file.name.replace(/\.[^/.]+$/, '');
    });
    setFileNames(newFileNames);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    
    // Update file names mapping
    const newFileNames: {[key: number]: string} = {};
    Object.entries(fileNames).forEach(([key, value]) => {
      const keyNum = parseInt(key);
      if (keyNum < index) {
        newFileNames[keyNum] = value;
      } else if (keyNum > index) {
        newFileNames[keyNum - 1] = value;
      }
    });
    setFileNames(newFileNames);
  };

  const updateFileName = (index: number, name: string) => {
    setFileNames(prev => ({
      ...prev,
      [index]: name
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    reset();
    setFiles([]);
    setFileNames({});
    onClose();
  };

  const onSubmit = (data: GalleryFormData) => {
    if (!editingFile && files.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos un archivo',
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate(data);
  };

  if (userLoading) return null;



  const editPanel = (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* File Upload Section */}
        {!editingFile && (
          <div className="space-y-4">
            <div>
              <FormLabel>Archivos <span className="text-[var(--accent)]">*</span></FormLabel>
              <div 
                onClick={triggerFileInput}
                className="relative border-2 border-dashed border-[var(--accent)] rounded-lg p-6 text-center hover:border-[var(--accent)] transition-colors cursor-pointer mt-2"
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Haz clic aquí para seleccionar archivos
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: JPG, PNG, GIF, MP4, MOV, AVI
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Selected Files Display */}
            {files.length > 0 && (
              <div className="space-y-2">
                <FormLabel>
                  Archivos seleccionados ({files.length})
                </FormLabel>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-[var(--card-border)] rounded-md bg-[var(--card-bg)]"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <FileVideo className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <Input
                            value={fileNames[index] || ''}
                            onChange={(e) => updateFileName(index, e.target.value)}
                            placeholder="Nombre del archivo"
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Archivo original: {file.name}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader
      title={editingFile ? "Editar Archivo Multimedia" : "Subir Archivo Multimedia"}
      icon={Images}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingFile ? "Actualizar" : "Subir"}
      onRightClick={form.handleSubmit(onSubmit)}
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