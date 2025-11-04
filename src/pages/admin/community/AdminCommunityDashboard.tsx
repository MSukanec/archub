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
  totalUsers: number
  activeUsersNow: number
  newUsersThisMonth: number
  newUsersLastMonth: number
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
        { count: totalOrganizations },
        { count: activeOrganizations },
        { count: totalUsers },
        { count: newUsersThisMonth },
        { count: newUsersLastMonth },
        { data: activeUsers }
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
          .from('organization_online_users')
          .select('user_id')
          .gte('last_seen_at', ninetySecondsAgo.toISOString())
      ])

      const uniqueActiveUsers = new Set(activeUsers?.map(u => u.user_id) || [])
      const activeUsersNow = uniqueActiveUsers.size

      return {
        totalOrganizations: totalOrganizations || 0,
        activeOrganizations: activeOrganizations || 0,
        totalUsers: totalUsers || 0,
        activeUsersNow,
        newUsersThisMonth: newUsersThisMonth || 0,
        newUsersLastMonth: newUsersLastMonth || 0
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
        .from('organization_online_users')
        .select(`
          user_id,
          last_seen_at,
          users!inner(full_name, email)
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
        .from('organization_online_users')
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
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="card-organizaciones">
          <StatCardTitle showArrow={false}>Organizaciones</StatCardTitle>
          <StatCardValue>{stats?.totalOrganizations || 0}</StatCardValue>
          <StatCardMeta>{stats?.activeOrganizations || 0} activas</StatCardMeta>
        </StatCard>

        <StatCard data-testid="card-usuarios-totales">
          <StatCardTitle showArrow={false}>Usuarios Totales</StatCardTitle>
          <StatCardValue>{stats?.totalUsers || 0}</StatCardValue>
          <StatCardMeta>en la plataforma</StatCardMeta>
        </StatCard>

        <StatCard data-testid="card-activos-ahora">
          <StatCardTitle showArrow={false}>Activos Ahora</StatCardTitle>
          <StatCardValue>{stats?.activeUsersNow || 0}</StatCardValue>
          <StatCardMeta>usuarios online</StatCardMeta>
        </StatCard>

        <StatCard data-testid="card-nuevos-este-mes">
          <StatCardTitle showArrow={false}>Nuevos Este Mes</StatCardTitle>
          <StatCardValue>{stats?.newUsersThisMonth || 0}</StatCardValue>
          {userGrowth !== 0 && (
            <StatCardMeta className={userGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
              {userGrowth > 0 ? '+' : ''}{userGrowth.toFixed(1)}% vs mes anterior
            </StatCardMeta>
          )}
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad Reciente */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Actividad Reciente de Usuarios
          </h3>
          {loadingActivity ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity: any) => {
                const lastSeenTime = new Date(activity.last_seen_at).getTime()
                const now = Date.now()
                const diffMs = now - lastSeenTime
                const isActive = diffMs <= 90000

                return (
                  <div key={activity.user_id} className="flex items-start justify-between p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{activity.users?.full_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.users?.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.last_seen_at), "d 'de' MMMM, HH:mm:ss", { locale: es })}
                      </p>
                    </div>
                    {isActive && (
                      <Badge variant="default" className="bg-green-600 text-white">
                        Activo
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay actividad reciente
            </p>
          )}
        </Card>

        {/* Organizaciones Más Activas */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Organizaciones Más Activas
          </h3>
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
