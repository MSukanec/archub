import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui/stat-card'
import { Clock, TrendingUp } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStats {
  totalOrganizations: number
  activeOrganizations: number
  newOrganizationsThisMonth: number
  newOrganizationsLastMonth: number
  totalUsers: number
  activeUsersNow: number
  newUsersThisMonth: number
  newUsersLastMonth: number
  totalProjects: number
  newProjectsThisMonth: number
  newProjectsLastMonth: number
}

export default function AdminCommunityDashboard() {
  // Fetch dashboard statistics - OPTIMIZADO
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-community-dashboard'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      const now = new Date()
      const thisMonthStart = startOfMonth(now)
      const lastMonthStart = startOfMonth(subMonths(now, 1))
      const lastMonthEnd = endOfMonth(subMonths(now, 1))
      const ninetySecondsAgo = new Date(now.getTime() - 90000)

      // ✅ OPTIMIZACIÓN: Ejecutar queries en paralelo con Promise.all
      const [
        totalOrgsResult,
        activeOrgsResult,
        newOrgsThisMonthResult,
        newOrgsLastMonthResult,
        totalUsersResult,
        newUsersThisMonthResult,
        newUsersLastMonthResult,
        activeUsersResult,
        totalProjectsResult,
        newProjectsThisMonthResult,
        newProjectsLastMonthResult
      ] = await Promise.all([
        // Total organizaciones
        supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true }),
        
        // Organizaciones activas
        supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        
        // Nuevas organizaciones este mes
        supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thisMonthStart.toISOString()),
        
        // Nuevas organizaciones mes anterior
        supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString()),
        
        // Total usuarios
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true }),
        
        // Nuevos usuarios este mes
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thisMonthStart.toISOString()),
        
        // Nuevos usuarios mes anterior
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString()),
        
        // Usuarios activos ahora (solo IDs únicos)
        supabase
          .from('user_presence')
          .select('user_id')
          .gte('last_seen_at', ninetySecondsAgo.toISOString()),
        
        // Total proyectos
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true }),
        
        // Nuevos proyectos este mes
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thisMonthStart.toISOString()),
        
        // Nuevos proyectos mes anterior
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString())
      ])

      const uniqueActiveUsers = new Set(activeUsersResult.data?.map(u => u.user_id) || [])
      const activeUsersNow = uniqueActiveUsers.size

      return {
        totalOrganizations: totalOrgsResult.count || 0,
        activeOrganizations: activeOrgsResult.count || 0,
        newOrganizationsThisMonth: newOrgsThisMonthResult.count || 0,
        newOrganizationsLastMonth: newOrgsLastMonthResult.count || 0,
        totalUsers: totalUsersResult.count || 0,
        activeUsersNow,
        newUsersThisMonth: newUsersThisMonthResult.count || 0,
        newUsersLastMonth: newUsersLastMonthResult.count || 0,
        totalProjects: totalProjectsResult.count || 0,
        newProjectsThisMonth: newProjectsThisMonthResult.count || 0,
        newProjectsLastMonth: newProjectsLastMonthResult.count || 0
      } as DashboardStats
    },
    enabled: !!supabase,
    staleTime: 30000, // Cache 30 segundos
    refetchInterval: 60000 // Auto-refresh cada minuto
  })

  // Últimas conexiones de usuarios - OPTIMIZADO
  const { data: recentActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ['recent-user-activity'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      const { data } = await supabase
        .from('user_presence')
        .select(`
          user_id,
          last_seen_at,
          users!inner(full_name)
        `)
        .order('last_seen_at', { ascending: false })
        .limit(10)

      return data
    },
    enabled: !!supabase,
    staleTime: 15000, // Cache 15 segundos (actividad cambia rápido)
    refetchInterval: 30000 // Auto-refresh cada 30 segundos
  })

  // Organizaciones más activas (por última actividad) - OPTIMIZADO
  const { data: activeOrganizations, isLoading: loadingOrgs } = useQuery({
    queryKey: ['most-active-organizations'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      // ✅ OPTIMIZACIÓN: Un solo query con JOIN y GROUP BY
      // Obtener organizaciones con su última actividad en una sola consulta
      const { data } = await supabase
        .from('user_presence')
        .select(`
          org_id,
          last_seen_at,
          organizations!inner(id, name, is_active)
        `)
        .eq('organizations.is_active', true)
        .order('last_seen_at', { ascending: false })

      if (!data) return []

      // Agrupar por org_id y tomar solo la más reciente de cada una
      const orgMap = new Map<string, any>()
      
      for (const item of data) {
        const orgId = item.org_id
        const org = item.organizations as any
        if (!orgMap.has(orgId)) {
          orgMap.set(orgId, {
            id: org.id,
            name: org.name,
            last_seen_at: item.last_seen_at
          })
        }
      }

      // Convertir a array, ordenar y tomar top 5
      return Array.from(orgMap.values())
        .sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())
        .slice(0, 5)
    },
    enabled: !!supabase,
    staleTime: 30000, // Cache 30 segundos
    refetchInterval: 60000 // Auto-refresh cada minuto
  })

  const userGrowth = stats?.newUsersLastMonth 
    ? ((stats.newUsersThisMonth - stats.newUsersLastMonth) / stats.newUsersLastMonth) * 100
    : 0
  
  const orgGrowth = stats?.newOrganizationsLastMonth 
    ? ((stats.newOrganizationsThisMonth - stats.newOrganizationsLastMonth) / stats.newOrganizationsLastMonth) * 100
    : 0

  const projectGrowth = stats?.newProjectsLastMonth 
    ? ((stats.newProjectsThisMonth - stats.newProjectsLastMonth) / stats.newProjectsLastMonth) * 100
    : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Grande de Usuarios */}
      <Card className="p-6" data-testid="card-users-overview">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Usuarios de la Plataforma</h3>
        </div>
        
        {/* Métricas principales en fila */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total</p>
            <p className="text-4xl font-bold">{stats?.totalUsers || 0}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Activos Ahora</p>
            <p className="text-4xl font-bold text-[var(--accent)]">{stats?.activeUsersNow || 0}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nuevos Este Mes</p>
            <p className="text-4xl font-bold">{stats?.newUsersThisMonth || 0}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Crecimiento</p>
            <p className={`text-4xl font-bold ${userGrowth > 0 ? 'text-green-600' : userGrowth < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
              {userGrowth > 0 ? '+' : ''}{userGrowth.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Barra visual de tendencia (opcional) */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, (stats?.newUsersThisMonth || 0) / (stats?.totalUsers || 1) * 100))}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {stats?.newUsersThisMonth || 0} nuevos de {stats?.totalUsers || 0} totales este mes
        </p>
      </Card>

      {/* Segunda fila: Organizaciones y Proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard href="/admin/community" data-testid="card-organizaciones">
          <StatCardTitle>Organizaciones</StatCardTitle>
          <StatCardValue>{stats?.totalOrganizations || 0}</StatCardValue>
          {orgGrowth !== 0 && (
            <StatCardMeta className={orgGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
              {orgGrowth > 0 ? '+' : ''}{orgGrowth.toFixed(1)}% vs mes anterior
            </StatCardMeta>
          )}
        </StatCard>

        <StatCard href="/admin/community" data-testid="card-proyectos">
          <StatCardTitle>Proyectos</StatCardTitle>
          <StatCardValue>{stats?.totalProjects || 0}</StatCardValue>
          {projectGrowth !== 0 && (
            <StatCardMeta className={projectGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
              {projectGrowth > 0 ? '+' : ''}{projectGrowth.toFixed(1)}% vs mes anterior
            </StatCardMeta>
          )}
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Actividad Reciente */}
        <Card className="p-4" data-testid="card-actividad-reciente">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" />
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
              Actividad Reciente de Usuarios
            </p>
          </div>
          {loadingActivity ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <>
              <div className="space-y-2">
                {recentActivity.map((activity: any) => {
                  const lastSeenTime = new Date(activity.last_seen_at).getTime()
                  const now = Date.now()
                  const diffMs = now - lastSeenTime
                  const isActive = diffMs <= 90000

                  return (
                    <div key={activity.user_id} className="flex items-center justify-between gap-3 p-2 rounded-lg border hover:bg-muted/30 transition-colors">
                      <p className="font-medium truncate text-sm flex-1 min-w-0">{activity.users?.full_name}</p>
                      {isActive ? (
                        <Badge className="bg-accent text-accent-foreground flex-shrink-0">
                          Activo
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                          {format(new Date(activity.last_seen_at), "d 'de' MMM, HH:mm", { locale: es })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <a 
                href="/admin/community" 
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = '/admin/community'
                }}
                className="block mt-4 pt-3 border-t text-center text-sm hover:underline transition-all"
                style={{ color: 'hsl(var(--accent))' }}
              >
                Ver más usuarios
              </a>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay actividad reciente
            </p>
          )}
        </Card>

        {/* Organizaciones Más Activas */}
        <Card className="p-4" data-testid="card-organizaciones-activas">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
              Organizaciones Más Activas
            </p>
          </div>
          {loadingOrgs ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : activeOrganizations && activeOrganizations.length > 0 ? (
            <div className="space-y-3">
              {activeOrganizations.map((org: any, index: number) => (
                <div key={org.id} className="flex items-start justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{org.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Última actividad: {format(new Date(org.last_seen_at), "d 'de' MMMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay datos de organizaciones activas
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
