import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TableActionButtons } from '@/components/ui-custom/tables-and-trees/TableActionButtons'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { queryClient } from '@/lib/queryClient'

export default function AdminCourseUsersTab() {
  const { toast } = useToast()
  const { openModal } = useGlobalModalStore()

  // Fetch enrollments with user and course data
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['/api/admin/enrollments'],
    queryFn: async () => {
      console.log('🔍 Fetching enrollments...');
      if (!supabase) {
        console.log('❌ No supabase client');
        return [];
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('❌ No session');
        return [];
      }

      console.log('✅ Session found, making request...');
      const res = await fetch('/api/admin/enrollments', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });

      if (!res.ok) {
        console.log('❌ Response not OK:', res.status);
        throw new Error('Failed to fetch enrollments');
      }
      
      const data = await res.json();
      console.log('📊 Enrollments received:', data.length, data);
      return data;
    },
    enabled: !!supabase
  });
  
  console.log('🎯 Current enrollments in component:', enrollments, 'isLoading:', isLoading);

  // Delete enrollment mutation
  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      if (!supabase) throw new Error('Supabase no disponible');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to delete enrollment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/enrollments'] });
      toast({
        title: 'Suscripción eliminada',
        description: 'La suscripción se eliminó correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la suscripción',
        variant: 'destructive'
      });
    }
  });

  const handleCreateEnrollment = () => {
    openModal('course-enrollment', {});
  };

  const handleEditEnrollment = (enrollment: any) => {
    openModal('course-enrollment', { enrollment, isEditing: true });
  };

  const handleDeleteEnrollment = (enrollment: any) => {
    openModal('delete-confirmation', {
      mode: 'simple',
      title: 'Eliminar Suscripción',
      description: '¿Estás seguro de que querés eliminar esta suscripción? El alumno perderá acceso al curso.',
      itemName: `${enrollment.users?.full_name || 'Usuario'} - ${enrollment.courses?.title || 'Curso'}`,
      destructiveActionText: 'Eliminar Suscripción',
      onConfirm: () => deleteEnrollmentMutation.mutate(enrollment.id),
      isLoading: deleteEnrollmentMutation.isPending
    });
  };

  const columns = [
    {
      key: 'user',
      label: 'Usuario',
      render: (enrollment: any) => (
        <div>
          <div className="font-medium text-sm">{enrollment.users?.full_name || 'Sin nombre'}</div>
          <div className="text-xs text-muted-foreground">{enrollment.users?.email || 'Sin email'}</div>
        </div>
      )
    },
    {
      key: 'course',
      label: 'Curso',
      render: (enrollment: any) => (
        <div className="font-medium text-sm">{enrollment.courses?.title || 'Sin título'}</div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (enrollment: any) => {
        const colors = {
          active: '#22c55e',
          completed: '#3b82f6',
          expired: '#ef4444',
          cancelled: '#6b7280'
        }
        const labels = {
          active: 'Activo',
          completed: 'Completado',
          expired: 'Expirado',
          cancelled: 'Cancelado'
        }
        return (
          <Badge style={{ backgroundColor: colors[enrollment.status as keyof typeof colors] || '#6b7280', color: 'white' }}>
            {labels[enrollment.status as keyof typeof labels] || enrollment.status}
          </Badge>
        )
      }
    },
    {
      key: 'started_at',
      label: 'Inicio',
      render: (enrollment: any) => {
        const startDate = new Date(enrollment.started_at);
        const endDate = enrollment.expires_at ? new Date(enrollment.expires_at) : null;
        
        return (
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{format(startDate, 'MMM d', { locale: es })}</span>
              {endDate && <span>{format(endDate, 'MMM d, yy', { locale: es })}</span>}
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--accent)',
                  width: endDate 
                    ? `${Math.min(100, Math.max(0, ((new Date().getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100))}%`
                    : '100%'
                }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (enrollment: any) => (
        <TableActionButtons
          onEdit={() => handleEditEnrollment(enrollment)}
          onDelete={() => handleDeleteEnrollment(enrollment)}
        />
      )
    }
  ];

  console.log('🎨 Rendering with enrollments.length:', enrollments.length);
  
  if (enrollments.length > 0) {
    console.log('✅ Rendering TABLE with', enrollments.length, 'items');
  } else {
    console.log('❌ Rendering EMPTY STATE (enrollments.length === 0)');
  }
  
  return (
    <>
      {enrollments.length > 0 ? (
        <Table
          data={enrollments}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title="No hay alumnos inscritos"
              description="Comienza inscribiendo alumnos a los cursos"
            />
          }
        />
      ) : (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No hay alumnos inscritos"
          description="Comienza inscribiendo alumnos a los cursos disponibles"
          action={
            <Button
              onClick={handleCreateEnrollment}
              className="mt-4"
              data-testid="button-create-enrollment-empty"
            >
              <Plus className="w-4 h-4 mr-2" />
              Inscribir Alumno
            </Button>
          }
        />
      )}
    </>
  )
}
