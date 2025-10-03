import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

const enrollmentSchema = z.object({
  user_id: z.string().min(1, 'El usuario es requerido'),
  course_id: z.string().min(1, 'El curso es requerido'),
  status: z.enum(['active', 'completed', 'expired', 'cancelled'], {
    required_error: 'El estado es requerido'
  }),
  expires_at: z.string().optional(),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  started_at: string;
  expires_at?: string;
  users?: { full_name: string; email: string };
  courses?: { title: string; slug: string };
}

interface CourseEnrollmentModalProps {
  modalData?: {
    enrollment?: Enrollment;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function CourseEnrollmentModal({ modalData, onClose }: CourseEnrollmentModalProps) {
  const { enrollment, isEditing = false } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!supabase
  });

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_active', true)
        .order('title', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!supabase
  });

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      user_id: enrollment?.user_id || '',
      course_id: enrollment?.course_id || '',
      status: (enrollment?.status as any) || 'active',
      expires_at: enrollment?.expires_at ? new Date(enrollment.expires_at).toISOString().split('T')[0] : '',
    }
  });

  useEffect(() => {
    if (enrollment) {
      form.reset({
        user_id: enrollment.user_id || '',
        course_id: enrollment.course_id || '',
        status: (enrollment.status as any) || 'active',
        expires_at: enrollment.expires_at ? new Date(enrollment.expires_at).toISOString().split('T')[0] : '',
      });
    } else {
      form.reset({
        user_id: '',
        course_id: '',
        status: 'active',
        expires_at: '',
      });
    }
    setPanel('edit');
  }, [enrollment, form, setPanel]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: data.user_id,
          course_id: data.course_id,
          status: data.status,
          expires_at: data.expires_at || null,
          started_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments'] });
      toast({
        title: "Inscripción creada",
        description: "El alumno ha sido inscrito exitosamente"
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear la inscripción",
        variant: "destructive"
      });
    }
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      if (!supabase || !enrollment?.id) throw new Error('Enrollment ID is required');
      
      const { error } = await supabase
        .from('course_enrollments')
        .update({
          user_id: data.user_id,
          course_id: data.course_id,
          status: data.status,
          expires_at: data.expires_at || null,
        })
        .eq('id', enrollment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments'] });
      toast({
        title: "Inscripción actualizada",
        description: "La inscripción ha sido actualizada exitosamente"
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la inscripción",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: EnrollmentFormData) => {
    setIsLoading(true);
    try {
      if (isEditing) {
        await updateEnrollmentMutation.mutateAsync(data);
      } else {
        await createEnrollmentMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? 'Editar Inscripción' : 'Nueva Inscripción'}
      icon={Users}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Guardar Cambios' : 'Inscribir Alumno'}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={isLoading}
    />
  );

  const editContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* User Selection */}
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isEditing}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-user">
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Course Selection */}
        <FormField
          control={form.control}
          name="course_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Curso</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isEditing}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-course">
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

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expiration Date */}
        <FormField
          control={form.control}
          name="expires_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Expiración (Opcional)</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  data-testid="input-expires-at"
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
      onClose={handleClose}
      header={headerContent}
      footer={footerContent}
    >
      {editContent}
    </FormModalLayout>
  );
}
