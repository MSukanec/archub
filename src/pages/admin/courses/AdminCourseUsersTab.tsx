import { Button } from '@/components/ui/button'
import { Plus, Users, Search, Filter, Bell, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { queryClient } from '@/lib/queryClient'
import AdminCourseStudentRow from '@/components/ui/data-row/rows/AdminCourseStudentRow'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'
import { useEffect, useState, useMemo } from 'react'

export default function AdminCourseUsersTab() {
  const { toast } = useToast()
  const { openModal } = useGlobalModalStore()
  const isMobile = useMobile()
  
  const { 
    setActions, 
    setShowActionBar, 
    clearActions,
    setFilterConfig,
    searchValue: mobileSearchValue,
    setSearchValue: setMobileSearchValue
  } = useActionBarMobile()

  const [searchValue, setSearchValue] = useState("")
  const [filterByStatus, setFilterByStatus] = useState("all")
  const [filterByCourse, setFilterByCourse] = useState("all")

  // Sync search values between mobile and desktop
  useEffect(() => {
    if (isMobile && mobileSearchValue !== searchValue) {
      setSearchValue(mobileSearchValue)
    }
  }, [mobileSearchValue, isMobile])

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

  // Get available courses and statuses for filters
  const availableCourses = useMemo(() => Array.from(
    new Set(enrollments.map((e: any) => e.courses?.title).filter(Boolean))
  ), [enrollments])

  const availableStatuses = useMemo(() => Array.from(
    new Set(enrollments.map((e: any) => e.status).filter(Boolean))
  ), [enrollments])

  // Filter enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enrollment: any) => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase()
        const userName = enrollment.users?.full_name?.toLowerCase() || ''
        const userEmail = enrollment.users?.email?.toLowerCase() || ''
        const courseName = enrollment.courses?.title?.toLowerCase() || ''
        
        if (!userName.includes(search) && !userEmail.includes(search) && !courseName.includes(search)) {
          return false
        }
      }

      // Status filter
      if (filterByStatus !== "all" && enrollment.status !== filterByStatus) {
        return false
      }

      // Course filter
      if (filterByCourse !== "all" && enrollment.courses?.title !== filterByCourse) {
        return false
      }

      return true
    })
  }, [enrollments, searchValue, filterByStatus, filterByCourse])

  // Configure mobile action bar
  useEffect(() => {
    if (isMobile) {
      setActions({
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        create: {
          id: 'create',
          icon: Plus,
          label: 'Inscribir Alumno',
          onClick: () => handleCreateEnrollment(),
          variant: 'primary'
        },
        filter: {
          id: 'filter',
          icon: Filter,
          label: 'Filtros',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
      })
      setShowActionBar(true)
    }

    // Cleanup when component unmounts
    return () => {
      if (isMobile) {
        clearActions()
      }
    }
  }, [isMobile, setActions, setShowActionBar, clearActions])

  // Separate effect for filter configuration
  useEffect(() => {
    if (isMobile && availableCourses.length > 0) {
      setFilterConfig({
        filters: [
          {
            label: 'Filtrar por estado',
            value: filterByStatus,
            onChange: setFilterByStatus,
            placeholder: 'Todos los estados',
            allOptionLabel: 'Todos los estados',
            options: [
              { value: 'active', label: 'Activo' },
              { value: 'completed', label: 'Completado' },
              { value: 'expired', label: 'Expirado' },
              { value: 'cancelled', label: 'Cancelado' }
            ]
          },
          {
            label: 'Filtrar por curso',
            value: filterByCourse,
            onChange: setFilterByCourse,
            placeholder: 'Todos los cursos',
            allOptionLabel: 'Todos los cursos',
            options: availableCourses.map(course => ({ value: course!, label: course! }))
          }
        ],
        onClearFilters: () => {
          setSearchValue("")
          setMobileSearchValue("")
          setFilterByStatus("all")
          setFilterByCourse("all")
        }
      })
    }
  }, [filterByStatus, filterByCourse, availableCourses, isMobile])

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
    }
  ];

  return (
    <>
      {filteredEnrollments.length > 0 ? (
        <Table
          data={filteredEnrollments}
          columns={columns}
          isLoading={isLoading}
          rowActions={(enrollment) => [
            {
              icon: Edit,
              label: 'Editar',
              onClick: () => handleEditEnrollment(enrollment)
            },
            {
              icon: Trash2,
              label: 'Eliminar',
              onClick: () => handleDeleteEnrollment(enrollment),
              variant: 'destructive' as const
            }
          ]}
          renderCard={(enrollment) => (
            <AdminCourseStudentRow
              enrollment={enrollment}
              onClick={() => handleEditEnrollment(enrollment)}
              density="normal"
            />
          )}
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
