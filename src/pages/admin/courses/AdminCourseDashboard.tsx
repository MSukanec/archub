import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Users, BookOpen, CreditCard, AlertCircle, TrendingUp, Calendar } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, isAfter, isBefore, addDays } from 'date-fns'
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

export default function AdminCourseDashboard() {
  // Fetch dashboard statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-course-dashboard'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      const now = new Date()
      const thisMonthStart = startOfMonth(now)
      const thisMonthEnd = endOfMonth(now)
      const nextMonthEnd = endOfMonth(addDays(thisMonthEnd, 1))
      const lastMonthStart = startOfMonth(subMonths(now, 1))
      const lastMonthEnd = endOfMonth(subMonths(now, 1))

      // Cursos
      const { data: courses } = await supabase
        .from('courses')
        .select('id, is_active')

      const totalCourses = courses?.length || 0
      const activeCourses = courses?.filter(c => c.is_active).length || 0

      // Inscripciones
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id, status, expires_at, started_at')

      const totalEnrollments = enrollments?.length || 0
      const activeEnrollments = enrollments?.filter(e => 
        e.status === 'active' && 
        (!e.expires_at || isAfter(new Date(e.expires_at), now))
      ).length || 0

      const expiringThisMonth = enrollments?.filter(e => {
        if (!e.expires_at) return false
        const expDate = new Date(e.expires_at)
        return isAfter(expDate, now) && isBefore(expDate, thisMonthEnd)
      }).length || 0

      const expiringNextMonth = enrollments?.filter(e => {
        if (!e.expires_at) return false
        const expDate = new Date(e.expires_at)
        return isAfter(expDate, thisMonthEnd) && isBefore(expDate, nextMonthEnd)
      }).length || 0

      // Pagos
      const { data: payments } = await supabase
        .from('payments_log')
        .select('amount, currency, created_at, status')
        .eq('status', 'approved')

      const totalRevenue = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0

      const revenueThisMonth = payments?.filter(p => {
        const date = new Date(p.created_at)
        return isAfter(date, thisMonthStart) && isBefore(date, thisMonthEnd)
      }).reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0

      const revenueLastMonth = payments?.filter(p => {
        const date = new Date(p.created_at)
        return isAfter(date, lastMonthStart) && isBefore(date, lastMonthEnd)
      }).reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0

      // Progreso promedio
      const { data: progress } = await supabase
        .from('course_lesson_progress')
        .select('progress_pct')

      const avgCompletionRate = progress?.length 
        ? progress.reduce((sum, p) => sum + (Number(p.progress_pct) || 0), 0) / progress.length
        : 0

      return {
        totalCourses,
        activeCourses,
        totalEnrollments,
        activeEnrollments,
        expiringThisMonth,
        expiringNextMonth,
        totalRevenue,
        revenueThisMonth,
        revenueLastMonth,
        avgCompletionRate
      } as DashboardStats
    },
    enabled: !!supabase
  })

  // Últimas inscripciones
  const { data: recentEnrollments, isLoading: loadingRecent } = useQuery({
    queryKey: ['recent-enrollments'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      const { data } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          started_at,
          expires_at,
          status,
          users!inner(full_name, email),
          courses!inner(title)
        `)
        .order('started_at', { ascending: false })
        .limit(5)

      return data
    },
    enabled: !!supabase
  })

  // Próximos vencimientos
  const { data: upcomingExpirations, isLoading: loadingExpirations } = useQuery({
    queryKey: ['upcoming-expirations'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      const now = new Date()
      const thirtyDaysFromNow = addDays(now, 30)

      const { data } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          expires_at,
          status,
          users!inner(full_name, email),
          courses!inner(title)
        `)
        .eq('status', 'active')
        .not('expires_at', 'is', null)
        .gte('expires_at', now.toISOString())
        .lte('expires_at', thirtyDaysFromNow.toISOString())
        .order('expires_at', { ascending: true })
        .limit(5)

      return data
    },
    enabled: !!supabase
  })

  const revenueGrowth = stats?.revenueLastMonth 
    ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100
    : 0

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
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cursos Totales</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.totalCourses || 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.activeCourses || 0} activos
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Suscripciones</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.activeEnrollments || 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                de {stats?.totalEnrollments || 0} totales
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vencen Este Mes</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.expiringThisMonth || 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.expiringNextMonth || 0} próximo mes
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Progreso Promedio</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.avgCompletionRate.toFixed(1)}%</h3>
              <p className="text-xs text-muted-foreground mt-1">
                en todas las lecciones
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              <h3 className="text-2xl font-bold mt-1">
                ${(stats?.totalRevenue || 0).toLocaleString('es-AR')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                en todos los cursos
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Este Mes</p>
              <h3 className="text-2xl font-bold mt-1">
                ${(stats?.revenueThisMonth || 0).toLocaleString('es-AR')}
              </h3>
              {revenueGrowth !== 0 && (
                <p className={`text-xs mt-1 ${revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% vs mes anterior
                </p>
              )}
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Mes Anterior</p>
              <h3 className="text-2xl font-bold mt-1">
                ${(stats?.revenueLastMonth || 0).toLocaleString('es-AR')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {format(subMonths(new Date(), 1), 'MMMM yyyy', { locale: es })}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Promedio Mensual</p>
              <h3 className="text-2xl font-bold mt-1">
                ${((stats?.totalRevenue || 0) / 12).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                últimos 12 meses
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas inscripciones */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Últimas Inscripciones
          </h3>
          {loadingRecent ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentEnrollments && recentEnrollments.length > 0 ? (
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
          {loadingExpirations ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : upcomingExpirations && upcomingExpirations.length > 0 ? (
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
