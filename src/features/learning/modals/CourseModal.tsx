import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen } from 'lucide-react';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useEffect } from 'react';
const courseSchema = z.object({
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  title: z.string().min(1, 'El título es requerido'),
  short_description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Debe ser un número válido mayor o igual a 0'
  }),
  visibility: z.enum(['public', 'private', 'draft'], {
    required_error: 'La visibilidad es requerida'
  }),
  status: z.enum(['available', 'coming_soon', 'maintenance'], {
    required_error: 'El estado es requerido'
  }),
  is_active: z.boolean().default(true),
});
type CourseFormData = z.infer<typeof courseSchema>;
interface Course {
  id: string;
  slug: string;
  title: string;
  short_description?: string;
  price?: number;
  visibility: string;
  status?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}
interface CourseModalProps {
  modalData?: {
    course?: Course;
    isEditing?: boolean;
  };
  onClose: () => void;
}
export function CourseModal({ modalData, onClose }: CourseModalProps) {
  const { course, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      slug: '',
      title: '',
      short_description: '',
      price: '0',
      visibility: 'draft',
      status: 'available',
      is_active: true,
    }
  });
  useEffect(() => {
    if (course) {
      form.reset({
        slug: course.slug || '',
        title: course.title || '',
        short_description: course.short_description || '',
        price: course.price?.toString() || '0',
        visibility: (course.visibility as any) || 'draft',
        status: (course.status as any) || 'available',
        is_active: course.is_active ?? true,
      });
    } else {
      form.reset({
        slug: '',
        title: '',
        short_description: '',
        price: '0',
        visibility: 'draft',
        status: 'available',
        is_active: true,
      });
    }
  }, [course, form]);
  const mutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      if (!userData) throw new Error('No user data');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const courseData: any = {
        slug: data.slug,
        title: data.title,
        short_description: data.short_description || null,
        price: parseFloat(data.price),
        visibility: data.visibility,
        status: data.status,
        is_active: data.is_active,
      };
      if (isEditing && course) {
        const res = await fetch(`/api/admin/courses/${course.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(courseData)
        });
        
        if (!res.ok) throw new Error('Failed to update course');
        return res.json();
      } else {
        courseData.created_by = userData.user?.id;
        const res = await fetch('/api/admin/courses', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(courseData)
        });
        
        if (!res.ok) throw new Error('Failed to create course');
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      
      toast({
        title: isEditing ? 'Curso actualizado': 'Curso creado',
        description: isEditing ? 'El curso se actualizó correctamente.': 'El curso se creó correctamente.',
      });
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
    await mutation.mutateAsync(data);
  };
  const headerContent = (
    <FormModalHeader
      icon={BookOpen}
      title={isEditing ? 'Editar Curso': 'Nuevo Curso'}
      description={isEditing ? 'Modifica los datos del curso': 'Crea un nuevo curso en la plataforma'}
    />
  );
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Título y Slug - Dos columnas en desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nombre del curso" data-testid="input-title" />
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
                <FormLabel>Slug (URL)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="curso-ejemplo" data-testid="input-slug" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Precio, Visibilidad y Estado - Tres columnas en desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (USD)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" min="0" placeholder="99.99" data-testid="input-price" />
                </FormControl>
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
                    <SelectTrigger data-testid="select-visibility">
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="coming_soon">Próximamente</SelectItem>
                    <SelectItem value="maintenance">En mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Descripción Corta - Una columna */}
        <FormField
          control={form.control}
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción Corta</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descripción breve" rows={2} data-testid="input-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Curso Activo - Una columna */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Curso Activo</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active" />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
  const footerContent = (
    <FormModalFooter
      cancelText="Cancelar"
      submitText={isEditing ? 'Actualizar Curso': 'Crear Curso'}
      onSubmit={form.handleSubmit(onSubmit)}
      submitDisabled={mutation.isPending}
      showLoadingSpinner={mutation.isPending}
      onLeftClick={onClose}
    />
  );
  return (
    <FormModalLayout 
      onClose={onClose}
      isEditing={true}
      columns={1}
      headerContent={headerContent}
      editPanel={editPanel}
      footerContent={footerContent}
    />
  );
}
