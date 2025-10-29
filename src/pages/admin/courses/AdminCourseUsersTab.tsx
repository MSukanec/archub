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
      if (!supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const res = await fetch('/api/admin/enrollments', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch enrollments');
      return res.json();
    },
    enabled: !!supabase,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });

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
      key: 'currency',
      label: 'Moneda',
      render: (enrollment: any) => {
        const currency = enrollment.payment?.currency || 'N/A';
        const colors: Record<string, string> = {
          'ARS': '#6366f1', // indigo
          'USD': '#10b981', // green
          'EUR': '#f59e0b'  // amber
        };
        return (
          <Badge 
            style={{ 
              backgroundColor: colors[currency] || '#6b7280',
              color: 'white' 
            }}
          >
            {currency}
          </Badge>
        );
      }
    },
    {
      key: 'amount',
      label: 'Monto',
      render: (enrollment: any) => {
        const amount = enrollment.payment?.amount;
        const currency = enrollment.payment?.currency || '';
        if (!amount) return <span className="text-muted-foreground text-sm">-</span>;
        
        return (
          <div className="font-medium text-sm">
            {currency === 'ARS' ? '$' : currency === 'USD' ? 'US$' : '€'}
            {Number(amount).toLocaleString('es-AR')}
          </div>
        );
      }
    },
    {
      key: 'provider',
      label: 'Método de Pago',
      render: (enrollment: any) => {
        const provider = enrollment.payment?.provider;
        if (!provider) return <span className="text-muted-foreground text-sm">-</span>;
        
        const providerNames: Record<string, string> = {
          'mercadopago': 'Mercado Pago',
          'paypal': 'PayPal',
          'stripe': 'Stripe'
        };
        
        const providerColors: Record<string, string> = {
          'mercadopago': '#00b3ff',
          'paypal': '#0070ba',
          'stripe': '#635bff'
        };
        
        return (
          <Badge 
            variant="outline"
            style={{ 
              borderColor: providerColors[provider.toLowerCase()] || '#6b7280',
              color: providerColors[provider.toLowerCase()] || '#6b7280'
            }}
          >
            {providerNames[provider.toLowerCase()] || provider}
          </Badge>
        );
      }
    },
    {
      key: 'status',
      label: 'Estado',
      render: (enrollment: any) => {
        const isActive = enrollment.status === 'active';
        const colors = {
          active: 'var(--accent)',
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
      label: 'Tiempo',
      render: (enrollment: any) => {
        const startDate = new Date(enrollment.started_at);
        const endDate = enrollment.expires_at ? new Date(enrollment.expires_at) : null;
        
        // Calcular porcentaje de tiempo transcurrido
        let progressPercentage = 100;
        if (endDate) {
          const totalTime = endDate.getTime() - startDate.getTime();
          const elapsedTime = new Date().getTime() - startDate.getTime();
          progressPercentage = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
        }
        
        return (
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{format(startDate, 'MMM d', { locale: es })}</span>
              {endDate ? (
                <span>{format(endDate, 'MMM d, yy', { locale: es })}</span>
              ) : (
                <span className="text-purple-500">Sin límite</span>
              )}
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden border border-border">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: endDate ? 'var(--accent)' : '#a855f7',
                  width: `${progressPercentage}%`
                }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'progress',
      label: 'Progreso',
      render: (enrollment: any) => {
        const progress = enrollment.progress || { completed_lessons: 0, total_lessons: 0, progress_percentage: 0 };
        const percentage = progress.progress_percentage || 0;
        
        return (
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{progress.completed_lessons || 0} / {progress.total_lessons || 0} lecciones</span>
              <span className="font-medium">{percentage.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden border border-border">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--accent)',
                  width: `${percentage}%`
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
