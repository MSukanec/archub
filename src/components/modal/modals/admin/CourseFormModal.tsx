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
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Debe ser un número válido mayor o igual a 0'
  }),
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
  price?: number;
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
      price: course?.price?.toString() || '0',
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
        price: course.price?.toString() || '0',
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
        price: '0',
        visibility: 'draft',
        is_active: true,
      });
    }
  }, [course, form]);

  const mutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      if (!userData) throw new Error('No user data');

      const courseData: any = {
        slug: data.slug,
        title: data.title,
        short_description: data.short_description || null,
        long_description: data.long_description || null,
        cover_url: data.cover_url || null,
        price: parseFloat(data.price),
        visibility: data.visibility,
        is_active: data.is_active,
      };

      if (isEditing && course) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', course.id);

        if (error) throw error;
      } else {
        courseData.created_by = userData.user?.id;
        const { error } = await supabase
          .from('courses')
          .insert(courseData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      
      toast({
        title: isEditing ? 'Curso actualizado' : 'Curso creado',
        description: isEditing ? 'El curso se actualizó correctamente.' : 'El curso se creó correctamente.',
      });

      setPanel(null);
      onClose();
    },
    onError: (error: any) => {
      console.error('Error en mutation:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el curso.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = async (data: CourseFormData) => {
    setIsLoading(true);
    try {
      await mutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormModalLayout>
      <FormModalHeader
        icon={BookOpen}
        title={isEditing ? 'Editar Curso' : 'Nuevo Curso'}
        description={isEditing ? 'Modifica los datos del curso' : 'Crea un nuevo curso en la plataforma'}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="curso-ejemplo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre del curso" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción Corta</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Descripción breve" rows={3} />
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
                  <FormLabel>Descripción Larga</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Descripción detallada" rows={5} />
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
                  <FormLabel>URL de la Portada</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio (USD)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" min="0" placeholder="99.99" />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Este precio será convertido automáticamente a ARS usando el tipo de cambio configurado.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibilidad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar visibilidad" />
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Curso Activo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Desactiva el curso para ocultarlo temporalmente
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormModalFooter
            onCancel={onClose}
            isLoading={isLoading}
            submitText={isEditing ? 'Actualizar' : 'Crear'}
          />
        </form>
      </Form>
    </FormModalLayout>
  );
}
