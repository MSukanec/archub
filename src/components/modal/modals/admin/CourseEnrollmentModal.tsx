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
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField';

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

  // Fetch users from backend API (bypasses RLS)
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      if (!supabase) return [];
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      // Call backend API endpoint with admin authentication
      const response = await fetch('/api/admin/users?statusFilter=active&sortBy=name', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const allUsers = await response.json();
      
      // Extract only the fields we need for the combobox
      return allUsers.map((user: any) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email
      }));
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

  // Transform users and courses to ComboBox options
  const userOptions = users.map((user: any) => ({
    value: user.id,
    label: `${user.full_name} (${user.email})`
  }));

  const courseOptions = courses.map((course: any) => ({
    value: course.id,
    label: course.title
  }));

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
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      // Call backend API endpoint with admin authentication
      const response = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: data.user_id,
          course_id: data.course_id,
          status: data.status,
          expires_at: data.expires_at || null,
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create enrollment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/enrollments'] });
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
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      // Call backend API endpoint with admin authentication
      const response = await fetch(`/api/admin/enrollments/${enrollment.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: data.user_id,
          course_id: data.course_id,
          status: data.status,
          expires_at: data.expires_at || null,
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update enrollment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/enrollments'] });
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
        {/* User Selection with ComboBox */}
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario *</FormLabel>
              <FormControl>
                <ComboBox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={userOptions}
                  placeholder="Selecciona un usuario"
                  searchPlaceholder="Buscar usuario..."
                  emptyMessage="No se encontraron usuarios"
                  disabled={isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Course Selection with ComboBox */}
        <FormField
          control={form.control}
          name="course_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Curso *</FormLabel>
              <FormControl>
                <ComboBox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={courseOptions}
                  placeholder="Selecciona un curso"
                  searchPlaceholder="Buscar curso..."
                  emptyMessage="No se encontraron cursos"
                  disabled={isEditing}
                />
              </FormControl>
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
