import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useEffect, useState } from 'react';

const courseSchema = z.object({
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  title: z.string().min(1, 'El título es requerido'),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  cover_url: z.string().optional(),
  visibility: z.enum(['public', 'private', 'draft'], {
    required_error: 'La visibilidad es requerida'
  }),
  is_active: z.boolean().default(true),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface Course {
  id: string;
  slug: string;
  title: string;
  short_description?: string;
  long_description?: string;
  cover_url?: string;
  visibility: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

interface CourseFormModalProps {
  modalData?: {
    course?: Course;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function CourseFormModal({ modalData, onClose }: CourseFormModalProps) {
  const { course, isEditing = false } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const { data: userData } = useCurrentUser();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      slug: course?.slug || '',
      title: course?.title || '',
      short_description: course?.short_description || '',
      long_description: course?.long_description || '',
      cover_url: course?.cover_url || '',
      visibility: (course?.visibility as any) || 'draft',
      is_active: course?.is_active ?? true,
    }
  });

  useEffect(() => {
    if (course) {
      form.reset({
        slug: course.slug || '',
        title: course.title || '',
        short_description: course.short_description || '',
        long_description: course.long_description || '',
        cover_url: course.cover_url || '',
        visibility: (course.visibility as any) || 'draft',
        is_active: course.is_active ?? true,
      });
    } else {
      form.reset({
        slug: '',
        title: '',
        short_description: '',
        long_description: '',
        cover_url: '',
        visibility: 'draft',
        is_active: true,
      });
    }
    setPanel('edit');
  }, [course, form, setPanel]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      if (!supabase || !userData?.user?.id) throw new Error('Supabase not initialized or user not found');
      
      const { error } = await supabase
        .from('courses')
        .insert({
          slug: data.slug,
          title: data.title,
          short_description: data.short_description,
          long_description: data.long_description,
          cover_url: data.cover_url,
          visibility: data.visibility,
          is_active: data.is_active,
          created_by: userData.user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: 'Curso creado',
        description: 'El curso se creó correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el curso. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('courses')
        .update({
          slug: data.slug,
          title: data.title,
          short_description: data.short_description,
          long_description: data.long_description,
          cover_url: data.cover_url,
          visibility: data.visibility,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', course!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: 'Curso actualizado',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el curso. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: CourseFormData) => {
    setIsLoading(true);
    try {
      if (course) {
        await updateCourseMutation.mutateAsync(data);
      } else {
        await createCourseMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const headerContent = (
    <FormModalHeader 
      title={course ? 'Editar Curso' : 'Nuevo Curso'}
      icon={BookOpen}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={course ? 'Actualizar' : 'Crear Curso'}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={isLoading}
    />
  );

  const editContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nombre del curso" data-testid="input-course-title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="curso-ejemplo" data-testid="input-course-slug" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción Corta</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Breve descripción del curso" rows={2} data-testid="input-course-short-desc" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="long_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción Completa</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descripción detallada del curso" rows={4} data-testid="input-course-long-desc" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cover_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de Portada</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://..." data-testid="input-course-cover" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibilidad *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-course-visibility">
                      <SelectValue placeholder="Selecciona visibilidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Curso Activo</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Permitir acceso al curso
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-course-active"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );

  return (
    <FormModalLayout
      editPanel={editContent}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      columns={1}
    />
  );
}
