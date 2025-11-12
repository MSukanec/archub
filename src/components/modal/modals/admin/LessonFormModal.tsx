import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Video } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useCourses } from '@/hooks/use-courses';

const lessonSchema = z.object({
  module_id: z.string().min(1, 'El módulo es requerido'),
  title: z.string().min(1, 'El título es requerido'),
  vimeo_video_id: z.string().optional(),
  duration_minutes: z.number().min(0, 'Los minutos deben ser mayor o igual a 0').optional(),
  duration_seconds: z.number().min(0, 'Los segundos deben ser mayor o igual a 0').max(59, 'Los segundos deben ser menor a 60').optional(),
  free_preview: z.boolean().default(false),
  sort_index: z.number().min(0, 'El orden debe ser mayor o igual a 0').default(0),
  is_active: z.boolean().default(true),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  vimeo_video_id?: string;
  duration_sec?: number;
  free_preview: boolean;
  sort_index: number;
  is_active: boolean;
  created_at: string;
}

interface LessonFormModalProps {
  modalData?: {
    lesson?: Lesson;
    courseId?: string;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function LessonFormModal({ modalData, onClose }: LessonFormModalProps) {
  const { lesson, courseId, isEditing = false } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const { data: courses = [] } = useCourses();

  const { data: modules = [] } = useQuery({
    queryKey: ['/api/course-modules', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', selectedCourseId)
        .order('sort_index', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCourseId,
  });

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      module_id: lesson?.module_id || '',
      title: lesson?.title || '',
      vimeo_video_id: lesson?.vimeo_video_id || '',
      duration_minutes: lesson?.duration_sec ? Math.floor(lesson.duration_sec / 60) : undefined,
      duration_seconds: lesson?.duration_sec ? lesson.duration_sec % 60 : undefined,
      free_preview: lesson?.free_preview || false,
      sort_index: lesson?.sort_index ?? undefined,
      is_active: lesson?.is_active ?? true,
    }
  });

  useEffect(() => {
    if (lesson && lesson.module_id) {
      supabase
        .from('course_modules')
        .select('course_id')
        .eq('id', lesson.module_id)
        .single()
        .then(({ data }) => {
          if (data?.course_id) {
            setSelectedCourseId(data.course_id);
          }
        });

      form.reset({
        module_id: lesson.module_id || '',
        title: lesson.title || '',
        vimeo_video_id: lesson.vimeo_video_id || '',
        duration_minutes: lesson.duration_sec ? Math.floor(lesson.duration_sec / 60) : undefined,
        duration_seconds: lesson.duration_sec ? lesson.duration_sec % 60 : undefined,
        free_preview: lesson.free_preview || false,
        sort_index: lesson.sort_index ?? undefined,
        is_active: lesson.is_active ?? true,
      });
    } else {
      form.reset({
        module_id: '',
        title: '',
        vimeo_video_id: '',
        duration_minutes: undefined,
        duration_seconds: undefined,
        free_preview: false,
        sort_index: undefined,
        is_active: true,
      });
    }
    setPanel('edit');
  }, [lesson, form, setPanel]);

  useEffect(() => {
    if (courseId && !lesson) {
      setSelectedCourseId(courseId);
    }
  }, [courseId, lesson]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createLessonMutation = useMutation({
    mutationFn: async (data: LessonFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const totalSeconds = (data.duration_minutes || 0) * 60 + (data.duration_seconds || 0);
      
      const { error } = await supabase
        .from('course_lessons')
        .insert({
          module_id: data.module_id,
          title: data.title,
          vimeo_video_id: data.vimeo_video_id,
          duration_sec: totalSeconds,
          free_preview: data.free_preview,
          sort_index: data.sort_index,
          is_active: data.is_active,
        });
      
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      const { data: moduleData } = await supabase
        .from('course_modules')
        .select('course_id')
        .eq('id', variables.module_id)
        .single();
      
      queryClient.invalidateQueries({ queryKey: ['all-lessons'] });
      if (moduleData?.course_id) {
        queryClient.invalidateQueries({ queryKey: ['course-lessons', moduleData.course_id] });
      }
      toast({
        title: 'Lección creada',
        description: 'La lección se creó correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la lección. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const updateLessonMutation = useMutation({
    mutationFn: async (data: LessonFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const totalSeconds = (data.duration_minutes || 0) * 60 + (data.duration_seconds || 0);
      
      const { error } = await supabase
        .from('course_lessons')
        .update({
          module_id: data.module_id,
          title: data.title,
          vimeo_video_id: data.vimeo_video_id,
          duration_sec: totalSeconds,
          free_preview: data.free_preview,
          sort_index: data.sort_index,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', lesson!.id);
      
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      const { data: moduleData } = await supabase
        .from('course_modules')
        .select('course_id')
        .eq('id', variables.module_id)
        .single();
      
      queryClient.invalidateQueries({ queryKey: ['all-lessons'] });
      if (moduleData?.course_id) {
        queryClient.invalidateQueries({ queryKey: ['course-lessons', moduleData.course_id] });
      }
      toast({
        title: 'Lección actualizada',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error updating lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la lección. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: LessonFormData) => {
    setIsLoading(true);
    try {
      if (lesson) {
        await updateLessonMutation.mutateAsync(data);
      } else {
        await createLessonMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const headerContent = (
    <FormModalHeader 
      title={lesson ? 'Editar Lección' : 'Nueva Lección'}
      icon={Video}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={lesson ? 'Actualizar' : 'Crear Lección'}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={isLoading}
    />
  );

  const editContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Curso *</label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger data-testid="select-lesson-course">
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course: any) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FormField
            control={form.control}
            name="module_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Módulo *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCourseId}>
                  <FormControl>
                    <SelectTrigger data-testid="select-lesson-module">
                      <SelectValue placeholder="Selecciona un módulo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {modules.map((module: any) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título de la Lección *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nombre de la lección" data-testid="input-lesson-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vimeo_video_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID de Video Vimeo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123456789" data-testid="input-lesson-vimeo" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minutos</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
                    placeholder="Ej: 5" 
                    data-testid="input-lesson-minutes" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_seconds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Segundos</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
                    placeholder="Ej: 30" 
                    data-testid="input-lesson-seconds" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  data-testid="input-lesson-sort" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="free_preview"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Vista Previa Gratuita</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Disponible sin suscripción
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-lesson-free-preview"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Lección Activa</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Visible para usuarios
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-lesson-active"
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
