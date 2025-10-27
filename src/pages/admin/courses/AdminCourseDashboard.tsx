import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Users, AlertCircle } from 'lucide-react'
import { format, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
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

export default function AdminCourseDashboard() {
  // Fetch dashboard data from API
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/admin/dashboard'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const res = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      return res.json()
    },
    enabled: !!supabase,
    staleTime: 0
  })

  const stats = dashboardData?.stats
  const recentEnrollments = dashboardData?.recentEnrollments || []
  const upcomingExpirations = dashboardData?.expiringSoon || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales - Estilo minimalista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
            Cursos Totales
          </p>
          <div className="text-5xl font-bold text-foreground tracking-tight leading-none mt-2">
            {stats?.totalCourses || 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {stats?.activeCourses || 0} activos
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
            Suscripciones
          </p>
          <div className="text-5xl font-bold text-foreground tracking-tight leading-none mt-2">
            {stats?.activeEnrollments || 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            de {stats?.totalEnrollments || 0} totales
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
            Vencen Este Mes
          </p>
          <div className="text-5xl font-bold text-foreground tracking-tight leading-none mt-2">
            {stats?.expiringThisMonth || 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {stats?.expiringNextMonth || 0} próximo mes
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
            Progreso Promedio
          </p>
          <div className="text-5xl font-bold text-foreground tracking-tight leading-none mt-2">
            {stats?.avgCompletionRate ? stats.avgCompletionRate.toFixed(1) : '0.0'}%
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            en todas las lecciones
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
            Ingresos Totales
          </p>
          <div className="text-5xl font-bold text-foreground tracking-tight leading-none mt-2">
            ${(stats?.totalRevenue || 0).toLocaleString('es-AR')}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            en todos los cursos
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
            Este Mes
          </p>
          <div className="text-5xl font-bold text-foreground tracking-tight leading-none mt-2">
            ${(stats?.revenueThisMonth || 0).toLocaleString('es-AR')}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {format(new Date(), "MMMM yyyy", { locale: es })}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
            Mes Anterior
          </p>
          <div className="text-5xl font-bold text-foreground tracking-tight leading-none mt-2">
            ${(stats?.revenueLastMonth || 0).toLocaleString('es-AR')}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {format(subMonths(new Date(), 1), "MMMM yyyy", { locale: es })}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
            Promedio Mensual
          </p>
          <div className="text-5xl font-bold text-foreground tracking-tight leading-none mt-2">
            ${((stats?.totalRevenue || 0) / 12).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            últimos 12 meses
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas inscripciones */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Últimas Inscripciones
          </h3>
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
                  <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                    {enrollment.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay inscripciones recientes
            </p>
          )}
        </Card>

        {/* Próximos vencimientos */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Próximos Vencimientos (30 días)
          </h3>
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
        </Card>
      </div>
    </div>
  )
}
