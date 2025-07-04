import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const gallerySchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  entry_type: z.string().min(1, 'El tipo de entrada es obligatorio'),
});

type GalleryFormData = z.infer<typeof gallerySchema>;

interface NewGalleryModalProps {
  open: boolean;
  onClose: () => void;
  editingFile?: any;
}

export function NewGalleryModal({ open, onClose, editingFile }: NewGalleryModalProps) {
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);

  const form = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: '',
      description: '',
      entry_type: '',
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = form;

  // Reset form when editing file changes
  useEffect(() => {
    if (editingFile) {
      reset({
        title: editingFile.title || '',
        description: editingFile.description || '',
        entry_type: editingFile.entry_type || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        entry_type: '',
      });
      setFiles([]);
    }
  }, [editingFile, reset]);

  const createGalleryMutation = useMutation({
    mutationFn: async (data: GalleryFormData) => {
      if (!userData?.user?.id || !userData?.preferences?.last_project_id || !userData?.preferences?.last_organization_id) {
        throw new Error('Datos de usuario incompletos');
      }

      const projectId = userData.preferences.last_project_id;
      const organizationId = userData.preferences.last_organization_id;

      if (!editingFile && files.length === 0) {
        throw new Error('Debes seleccionar al menos un archivo');
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      if (editingFile) {
        // Update existing gallery entry
        const { error: updateError } = await supabase
          .from('site_log_files')
          .update({
            title: data.title,
            description: data.description,
            entry_type: data.entry_type,
          })
          .eq('id', editingFile.id);

        if (updateError) {
          throw updateError;
        }

        return { message: 'Archivo actualizado correctamente' };
      } else {
        // Create new gallery entries
        const uploadPromises = files.map(async (file) => {
          // Upload file to storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `gallery/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('site-log-files')
            .upload(filePath, file);

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('site-log-files')
            .getPublicUrl(filePath);

          // Create database record
          const { error: insertError } = await supabase
            .from('site_log_files')
            .insert({
              file_path: filePath,
              file_url: publicUrl,
              file_name: file.name,
              file_type: file.type.startsWith('image/') ? 'image' : 'video',
              file_size: file.size,
              title: data.title,
              description: data.description,
              entry_type: data.entry_type,
              created_by: userData.user.id,
              organization_id: organizationId,
              project_id: projectId,
              // No site_log_id for independent gallery uploads
            });

          if (insertError) {
            throw insertError;
          }
        });

        await Promise.all(uploadPromises);
        return { message: 'Archivos subidos correctamente' };
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Éxito',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['galleryFiles'] });
      handleClose();
    },
    onError: (error) => {
      console.error('Error saving gallery file:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar archivo',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    reset();
    setFiles([]);
    onClose();
  };

  const onSubmit = (data: GalleryFormData) => {
    createGalleryMutation.mutate(data);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const entryTypes = [
    { value: 'avance_de_obra', label: 'Avance de Obra' },
    { value: 'visita_tecnica', label: 'Visita Técnica' },
    { value: 'problema_detectado', label: 'Problema Detectado' },
    { value: 'pedido_material', label: 'Pedido Material' },
    { value: 'nota_climatica', label: 'Nota Climática' },
    { value: 'decision', label: 'Decisión' },
    { value: 'inspeccion', label: 'Inspección' },
    { value: 'foto_diaria', label: 'Foto Diaria' },
    { value: 'registro_general', label: 'Registro General' },
  ];

  if (!open) return null;

  return (
    <CustomModalLayout
      open={open}
      onClose={handleClose}
      children={{
        header: (
          <CustomModalHeader
            title={editingFile ? "Editar Archivo" : "Subir Archivo"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} id="gallery-form">
                <div className="space-y-4">
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

                  <FormField
                    control={form.control}
                    name="entry_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Entrada</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {entryTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descripción del archivo"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!editingFile && (
                    <div className="space-y-3">
                      <FormLabel>Archivos</FormLabel>
                      
                      {/* File Input */}
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <input
                          type="file"
                          id="file-upload"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <label 
                          htmlFor="file-upload"
                          className="flex flex-col items-center gap-2 cursor-pointer"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-sm font-medium">Haz clic para subir archivos</p>
                            <p className="text-xs text-muted-foreground">
                              Imágenes y videos son compatibles
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Selected Files */}
                      {files.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Archivos seleccionados:</p>
                          {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm truncate">{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            form="gallery-form"
            isLoading={isSubmitting}
          />
        ),
      }}
    />
  );
}