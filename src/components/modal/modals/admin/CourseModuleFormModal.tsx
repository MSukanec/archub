import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useCourses } from '@/hooks/use-courses';

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
  const { data: courses = [] } = useCourses();

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

  const editContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="course_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Curso *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
