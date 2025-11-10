import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui/stat-card'
import { format, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStats {
  totalCourses: number
  activeCourses: number
  totalEnrollments: number
  activeEnrollments: number
  expiringThisMonth: number
  expiringNextMonth: number
  totalRevenue: number
  revenueThisMonth: number
  revenueLastMonth: number
  avgCompletionRate: number
}

interface DashboardData {
  stats: DashboardStats
  recentEnrollments: any[]
  expiringSoon: any[]
}

export default function AdminCourseDashboardTab() {
  // Fetch dashboard data from API
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/admin/dashboard'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const res = await fetch(`/api/admin/dashboard?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      const data = await res.json()
      console.log('💰 Dashboard data received:', data)
      return data
    },
    enabled: !!supabase,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always'
  })

  const stats = dashboardData?.stats
  const recentEnrollments = dashboardData?.recentEnrollments || []
  const upcomingExpirations = dashboardData?.expiringSoon || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales - 2 columnas en mobile */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard>
          <StatCardTitle>Cursos Totales</StatCardTitle>
          <StatCardValue>{stats?.totalCourses || 0}</StatCardValue>
          <StatCardMeta>{stats?.activeCourses || 0} activos</StatCardMeta>
        </StatCard>

        <StatCard>
          <StatCardTitle>Suscripciones</StatCardTitle>
          <StatCardValue>{stats?.activeEnrollments || 0}</StatCardValue>
          <StatCardMeta>de {stats?.totalEnrollments || 0} totales</StatCardMeta>
        </StatCard>

        <StatCard>
          <StatCardTitle>Vencen Este Mes</StatCardTitle>
          <StatCardValue>{stats?.expiringThisMonth || 0}</StatCardValue>
          <StatCardMeta>{stats?.expiringNextMonth || 0} próximo mes</StatCardMeta>
        </StatCard>

        <StatCard>
          <StatCardTitle>Progreso Promedio</StatCardTitle>
          <StatCardValue>{stats?.avgCompletionRate ? stats.avgCompletionRate.toFixed(1) : '0.0'}%</StatCardValue>
          <StatCardMeta>en todas las lecciones</StatCardMeta>
        </StatCard>

        <StatCard>
          <StatCardTitle>Ingresos Totales</StatCardTitle>
          <StatCardValue>${(stats?.totalRevenue || 0).toLocaleString('es-AR')}</StatCardValue>
          <StatCardMeta>en todos los cursos</StatCardMeta>
        </StatCard>

        <StatCard>
          <StatCardTitle>Este Mes</StatCardTitle>
          <StatCardValue>${(stats?.revenueThisMonth || 0).toLocaleString('es-AR')}</StatCardValue>
          <StatCardMeta>{format(new Date(), "MMMM yyyy", { locale: es })}</StatCardMeta>
        </StatCard>

        <StatCard>
          <StatCardTitle>Mes Anterior</StatCardTitle>
          <StatCardValue>${(stats?.revenueLastMonth || 0).toLocaleString('es-AR')}</StatCardValue>
          <StatCardMeta>{format(subMonths(new Date(), 1), "MMMM yyyy", { locale: es })}</StatCardMeta>
        </StatCard>

        <StatCard>
          <StatCardTitle>Promedio Mensual</StatCardTitle>
          <StatCardValue>${((stats?.totalRevenue || 0) / 12).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</StatCardValue>
          <StatCardMeta>últimos 12 meses</StatCardMeta>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Últimas inscripciones */}
        <StatCard>
          <StatCardTitle className="mb-4">Últimas Inscripciones</StatCardTitle>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentEnrollments.length > 0 ? (
            <div className="space-y-3">
              {recentEnrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-start justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{enrollment.users?.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{enrollment.courses?.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(enrollment.started_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay inscripciones recientes
            </p>
          )}
        </StatCard>

        {/* Próximos vencimientos */}
        <StatCard>
          <StatCardTitle className="mb-4">Próximos Vencimientos (30 días)</StatCardTitle>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : upcomingExpirations.length > 0 ? (
            <div className="space-y-3">
              {upcomingExpirations.map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-start justify-between p-3 rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{enrollment.users?.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{enrollment.courses?.title}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Vence: {format(new Date(enrollment.expires_at), "d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay vencimientos próximos
            </p>
          )}
        </StatCard>
      </div>
    </div>
  )
}
