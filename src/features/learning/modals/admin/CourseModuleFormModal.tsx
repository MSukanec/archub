import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Upload, X } from 'lucide-react';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { useModalPanelStore } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useAdminCourses } from '../../hooks/use-admin-courses';
import { uploadFile, deleteFile } from '@/lib/storage';

const courseModuleSchema = z.object({
  course_id: z.string().min(1, 'El curso es requerido'),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  sort_index: z.number().min(0, 'El orden debe ser mayor o igual a 0').default(0),
});

type CourseModuleFormData = z.infer<typeof courseModuleSchema>;

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  sort_index: number;
  created_at: string;
}

interface CourseModuleFormModalProps {
  modalData?: {
    module?: CourseModule;
    courseId?: string;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function CourseModuleFormModal({ modalData, onClose }: CourseModuleFormModalProps) {
  const { module, courseId, isEditing = false } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [moduleImageUrl, setModuleImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { data: courses = [] } = useAdminCourses();

  // Load module image on mount
  useEffect(() => {
    if (module?.id) {
      loadModuleImage(module.id);
    }
  }, [module?.id]);

  const loadModuleImage = async (moduleId: string) => {
    try {
      const { data, error } = await supabase
        .from('media_links')
        .select(`
          media_files!inner (
            file_url,
            is_deleted
          )
        `)
        .eq('course_module_id', moduleId)
        .eq('category', 'module_image')
        .maybeSingle();

      if (error) {
        console.error('Error loading module image:', error);
        return;
      }

      if (data && data.media_files) {
        const mediaFile: any = data.media_files;
        // Only show if not deleted
        if (!mediaFile.is_deleted) {
          const urlWithCacheBust = `${mediaFile.file_url}?t=${Date.now()}`;
          setModuleImageUrl(urlWithCacheBust);
        }
      }
    } catch (error) {
      console.error('Error loading module image:', error);
    }
  };

  const form = useForm<CourseModuleFormData>({
    resolver: zodResolver(courseModuleSchema),
    defaultValues: {
      course_id: module?.course_id || courseId || '',
      title: module?.title || '',
      description: module?.description || '',
      sort_index: module?.sort_index ?? undefined,
    }
  });

  useEffect(() => {
    if (module) {
      form.reset({
        course_id: module.course_id || '',
        title: module.title || '',
        description: module.description || '',
        sort_index: module.sort_index ?? undefined,
      });
    } else {
      form.reset({
        course_id: courseId || '',
        title: '',
        description: '',
        sort_index: undefined,
      });
    }
    setPanel('edit');
  }, [module, form, setPanel]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createModuleMutation = useMutation({
    mutationFn: async (data: CourseModuleFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('course_modules')
        .insert({
          course_id: data.course_id,
          title: data.title,
          description: data.description,
          sort_index: data.sort_index,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-course-modules'] });
      queryClient.invalidateQueries({ queryKey: ['course-modules', variables.course_id] });
      toast({
        title: 'Módulo creado',
        description: 'El módulo se creó correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating module:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el módulo. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const updateModuleMutation = useMutation({
    mutationFn: async (data: CourseModuleFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('course_modules')
        .update({
          course_id: data.course_id,
          title: data.title,
          description: data.description,
          sort_index: data.sort_index,
          updated_at: new Date().toISOString()
        })
        .eq('id', module!.id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-course-modules'] });
      queryClient.invalidateQueries({ queryKey: ['course-modules', variables.course_id] });
      toast({
        title: 'Módulo actualizado',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error updating module:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el módulo. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const handleImageUpload = async (file: File, moduleId: string, courseId: string) => {
    setIsUploadingImage(true);
    
    try {
      // Use unified upload function
      const result = await uploadFile(file, {
        entity: 'course_module_image',
        course_id: courseId,
        link_to: { 
          course_id: courseId,
          course_module_id: moduleId 
        },
        category: 'module_image',
        description: 'Module image or GIF'
      });

      // Refresh the image URL with cache bust
      const urlWithCacheBust = `${result.file_url}?t=${Date.now()}`;
      setModuleImageUrl(urlWithCacheBust);

      // Invalidate queries to refetch module data
      queryClient.invalidateQueries({ queryKey: ['all-course-modules'] });
      queryClient.invalidateQueries({ queryKey: ['course-modules'] });

      toast({
        title: 'Éxito',
        description: 'Imagen del módulo subida correctamente'
      });
    } catch (error: any) {
      console.error('Error uploading module image:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo subir la imagen',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageRemove = async (moduleId: string) => {
    setIsUploadingImage(true);
    
    try {
      // Get the media_file_id from media_link
      const { data: link } = await supabase
        .from('media_links')
        .select('media_file_id')
        .eq('course_module_id', moduleId)
        .eq('category', 'module_image')
        .maybeSingle();

      if (link?.media_file_id) {
        // Use unified delete function (soft delete)
        await deleteFile(link.media_file_id, false);
      }

      setModuleImageUrl(null);

      toast({
        title: 'Éxito',
        description: 'Imagen del módulo eliminada correctamente'
      });
    } catch (error: any) {
      console.error('Error removing module image:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la imagen',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (data: CourseModuleFormData) => {
    setIsLoading(true);
    try {
      if (module) {
        await updateModuleMutation.mutateAsync(data);
      } else {
        await createModuleMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const headerContent = (
    <FormModalHeader 
      title={module ? 'Editar Módulo' : 'Nuevo Módulo'}
      description="Configura los datos del módulo del curso. Puedes incluir una imagen o GIF que se mostrará en la landing page."
      icon={Layers}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={module ? 'Actualizar' : 'Crear Módulo'}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={isLoading}
    />
  );

  const renderImageUploadField = () => {
    return (
      <div className="space-y-2">
        <div
          className="relative w-full h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-accent/50 transition-colors cursor-pointer overflow-hidden bg-muted/30"
          onClick={() => !isUploadingImage && document.getElementById('module-image-input')?.click()}
        >
          {moduleImageUrl ? (
            <div className="w-full h-full relative group">
              <img
                src={moduleImageUrl}
                alt="Imagen del módulo"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('module-image-input')?.click();
                  }}
                  disabled={isUploadingImage}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Cambiar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageRemove(module.id);
                  }}
                  disabled={isUploadingImage}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Haz clic para seleccionar imagen o GIF
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tamaño máximo: 10MB
              </p>
            </div>
          )}

          {isUploadingImage && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="text-sm font-medium">Subiendo...</span>
              </div>
            </div>
          )}
        </div>

        <input
          id="module-image-input"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && module?.id && module?.course_id) {
              handleImageUpload(file, module.id, module.course_id);
            }
          }}
          className="hidden"
        />
      </div>
    );
  };

  const editContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Primera fila: Curso / Título / Orden */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="course_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Curso *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!!courseId || !!module}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-module-course">
                      <SelectValue placeholder="Selecciona un curso" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título del Módulo *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nombre del módulo" data-testid="input-module-title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sort_index"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orden *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
                    placeholder="Ej: 0, 1, 2..." 
                    data-testid="input-module-sort" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Segunda fila: Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descripción del módulo" rows={3} data-testid="input-module-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tercera fila: Imagen */}
        {module?.id ? (
          <div>
            <FormLabel>Imagen del Módulo</FormLabel>
            {renderImageUploadField()}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/50 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Imagen del módulo no disponible</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Primero debes guardar el módulo para poder agregar una imagen. Podrás editarlo después para subir la imagen.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Form>
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div></div>}
      editPanel={editContent}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
    />
  );
}
