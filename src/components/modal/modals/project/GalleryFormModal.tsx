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

const gallerySchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
});

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize panel to edit mode when modal opens
  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  const form = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = form;

  // Reset form when editing file changes or user data loads
  useEffect(() => {
    if (userData) {
      if (editingFile) {
        reset({
          title: editingFile.title || '',
          description: editingFile.description || '',
        });
      } else {
        reset({
          title: '',
          description: '',
        });
      }
    }
  }, [editingFile, reset, userData]);

  // Efecto para autocompletar el título con el nombre del archivo
  useEffect(() => {
    if (files.length > 0 && !editingFile) {
      const fileName = files[0].name.split('.').slice(0, -1).join('.'); // Remover extensión
      form.setValue('title', fileName);
    }
  }, [files, form, editingFile]);

  const uploadMutation = useMutation({
    mutationFn: async (data: GalleryFormData) => {
      if (!userData?.organization_preferences?.last_project_id || !userData?.organization?.id) {
        throw new Error('No hay proyecto u organización seleccionada');
      }

      const galleryFiles: GalleryFileInput[] = files.map(file => ({
        file,
        title: data.title,
        description: data.description || undefined,
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
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    reset();
    setFiles([]);
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
        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título del archivo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descripción del archivo"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                          <p className="text-sm text-foreground truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
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