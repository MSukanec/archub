import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { uploadGalleryFiles, type GalleryFileInput } from '@/utils/uploadGalleryFiles';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, File } from 'lucide-react';
import UserSelector from '@/components/ui-custom/UserSelector';
import { useOrganizationMembers } from '@/hooks/use-organization-members';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const gallerySchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  created_by: z.string().min(1, 'El creador es obligatorio'),
});

type GalleryFormData = z.infer<typeof gallerySchema>;

interface GalleryFormModalProps {
  open: boolean;
  onClose: () => void;
  editingFile?: any;
}

export function GalleryFormModal({ open, onClose, editingFile }: GalleryFormModalProps) {
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const { data: organizationMembers } = useOrganizationMembers(userData?.preferences?.last_organization_id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: '',
      description: '',
      created_by: '',
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = form;

  // Reset form when editing file changes or user data loads
  useEffect(() => {
    if (userData?.user?.id) {
      if (editingFile) {
        reset({
          title: editingFile.title || '',
          description: editingFile.description || '',
          created_by: editingFile.created_by || userData.user.id,
        });
      } else {
        reset({
          title: '',
          description: '',
          created_by: userData.user.id,
        });
      }
    }
  }, [editingFile, reset, userData]);

  const uploadMutation = useMutation({
    mutationFn: async (data: GalleryFormData) => {
      if (!userData?.preferences?.last_project_id || !userData?.preferences?.last_organization_id) {
        throw new Error('No hay proyecto u organización seleccionada');
      }

      const galleryFiles: GalleryFileInput[] = files.map(file => ({
        file,
        title: data.title,
        description: data.description || null,
        entry_type: 'registro_general',
      }));

      return uploadGalleryFiles(
        galleryFiles,
        userData.preferences.last_project_id,
        userData.preferences.last_organization_id,
        data.created_by
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

  if (!open || userLoading) return null;

  const modalContent = (
    <div className="space-y-6 p-4">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Creator Field */}
            <FormField
              control={form.control}
              name="created_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creador</FormLabel>
                  <FormControl>
                    <UserSelector
                      users={organizationMembers?.map(member => ({
                        id: member.user_id,
                        full_name: member.full_name,
                        email: member.email,
                        avatar_url: member.avatar_url,
                        first_name: member.full_name.split(' ')[0] || '',
                        last_name: member.full_name.split(' ').slice(1).join(' ') || ''
                      })) || []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar creador"
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Archivos
                  </label>
                  <div 
                    onClick={triggerFileInput}
                    className="relative border-2 border-dashed border-[var(--card-border)] rounded-lg p-6 text-center hover:border-[var(--accent)] transition-colors cursor-pointer"
                  >
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Haz clic para subir archivos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Imágenes y videos son compatibles
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
                    <label className="block text-sm font-medium text-foreground">
                      Archivos seleccionados ({files.length})
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border border-[var(--card-border)] rounded-md bg-[var(--card-bg)]"
                        >
                          <div className="flex items-center space-x-2">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground truncate">
                              {file.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
          </form>
        </Form>
      </div>
  );

  return (
    <FormModalLayout
      onClose={handleClose}
      viewPanel={modalContent}
      headerContent={
        <FormModalHeader
          title={editingFile ? "Editar Archivo" : "Subir Archivo"}
        />
      }
      footerContent={
        <FormModalFooter
          leftLabel="Cancelar"
          onLeftClick={handleClose}
          rightLabel={isSubmitting ? "Guardando..." : "Guardar"}
          onRightClick={handleSubmit(onSubmit)}
        />
      }
    />
  );
}