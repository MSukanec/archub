import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users } from 'lucide-react';

import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
  const [isLoading, setIsLoading] = useState(false);
  
  const { enrollment, isEditing = false } = modalData || {};

  // Hooks
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Force edit mode when modal opens
  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  // Form setup
  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      user_id: '',
      course_id: '',
      status: 'active',
      expires_at: '',
    }
  });

  // Load editing data
  useEffect(() => {
    if (isEditing && enrollment) {
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
  }, [isEditing, enrollment, form]);

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
      onClose();
      form.reset();
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
      onClose();
      form.reset();
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
      if (isEditing && enrollment) {
        await updateEnrollmentMutation.mutateAsync(data);
      } else {
        await createEnrollmentMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Error saving enrollment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // View panel (not needed for this modal as it's always in edit mode)
  const viewPanel = null;

  // Edit panel with form
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* User Selection */}
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario *</FormLabel>
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
              <FormLabel>Curso *</FormLabel>
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
              <FormLabel>Estado *</FormLabel>
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

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Inscripción" : "Nueva Inscripción"}
      icon={Users}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Actualizar" : "Inscribir"}
      onRightClick={form.handleSubmit(onSubmit)}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}
