import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Users, Building, Activity, Clock, TrendingUp, Calendar, UserCheck } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, isAfter, isBefore, subDays } from 'date-fns'
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
  organizationsByPlan: {
    free: number
    pro: number
    teams: number
  }
  avgMembersPerOrg: number
  avgProjectsPerOrg: number
}

export default function AdminCommunityOrganizations() {
  // Fetch dashboard statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-community-dashboard'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      const now = new Date()
      const thisMonthStart = startOfMonth(now)
      const lastMonthStart = startOfMonth(subMonths(now, 1))
      const lastMonthEnd = endOfMonth(subMonths(now, 1))
      const ninetySecondsAgo = new Date(now.getTime() - 90000)

      // Organizaciones
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, is_active, plan_id, created_at')

      const totalOrganizations = organizations?.length || 0
      const activeOrganizations = organizations?.filter(o => o.is_active).length || 0

      // Planes
      const { data: plans } = await supabase
        .from('plans')
        .select('id, name')

      const plansMap = new Map(plans?.map(p => [p.id, p.name]) || [])

      const organizationsByPlan = {
        free: organizations?.filter(o => plansMap.get(o.plan_id) === 'Free').length || 0,
        pro: organizations?.filter(o => plansMap.get(o.plan_id) === 'Pro').length || 0,
        teams: organizations?.filter(o => plansMap.get(o.plan_id) === 'Teams').length || 0
      }

      // Usuarios
      const { data: users } = await supabase
        .from('users')
        .select('id, created_at')

      const totalUsers = users?.length || 0

      const newUsersThisMonth = users?.filter(u => {
        const date = new Date(u.created_at)
        return isAfter(date, thisMonthStart)
      }).length || 0

      const newUsersLastMonth = users?.filter(u => {
        const date = new Date(u.created_at)
        return isAfter(date, lastMonthStart) && isBefore(date, lastMonthEnd)
      }).length || 0

      // Usuarios activos ahora (últimos 90 segundos)
      const { data: activeUsers } = await supabase
        .from('organization_online_users')
        .select('user_id')
        .gte('last_seen_at', ninetySecondsAgo.toISOString())

      const uniqueActiveUsers = new Set(activeUsers?.map(u => u.user_id) || [])
      const activeUsersNow = uniqueActiveUsers.size

      // Promedios
      const { data: members } = await supabase
        .from('organization_members')
        .select('organization_id', { count: 'exact' })

      const { data: projects } = await supabase
        .from('projects')
        .select('organization_id', { count: 'exact' })

      const avgMembersPerOrg = totalOrganizations > 0 ? (members?.length || 0) / totalOrganizations : 0
      const avgProjectsPerOrg = totalOrganizations > 0 ? (projects?.length || 0) / totalOrganizations : 0

      return {
        totalOrganizations,
        activeOrganizations,
        totalUsers,
        activeUsersNow,
        newUsersThisMonth,
        newUsersLastMonth,
        organizationsByPlan,
        avgMembersPerOrg,
        avgProjectsPerOrg
      } as DashboardStats
    },
    enabled: !!supabase
  })

  // Últimas conexiones de usuarios
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
    enabled: !!supabase
  })

  // Organizaciones más activas (por última actividad)
  const { data: activeOrganizations, isLoading: loadingOrgs } = useQuery({
    queryKey: ['most-active-organizations'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      // Obtener todas las organizaciones
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('is_active', true)

      if (!orgs) return []

      // Para cada organización, obtener su última actividad
      const orgsWithActivity = await Promise.all(
        orgs.map(async (org) => {
          const { data: activity } = await supabase
            .from('organization_online_users')
            .select('last_seen_at')
            .eq('org_id', org.id)
            .order('last_seen_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...org,
            last_seen_at: activity?.last_seen_at || null
          }
        })
      )

      // Ordenar por actividad más reciente y tomar las 5 primeras
      return orgsWithActivity
        .filter(o => o.last_seen_at)
        .sort((a, b) => new Date(b.last_seen_at!).getTime() - new Date(a.last_seen_at!).getTime())
        .slice(0, 5)
    },
    enabled: !!supabase
  })

  const userGrowth = stats?.newUsersLastMonth 
    ? ((stats.newUsersThisMonth - stats.newUsersLastMonth) / stats.newUsersLastMonth) * 100
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
              <p className="text-sm text-muted-foreground">Organizaciones</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.totalOrganizations || 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.activeOrganizations || 0} activas
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Usuarios Totales</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                en la plataforma
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Activos Ahora</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.activeUsersNow || 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                usuarios online
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Nuevos Este Mes</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.newUsersThisMonth || 0}</h3>
              {userGrowth !== 0 && (
                <p className={`text-xs mt-1 ${userGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {userGrowth > 0 ? '+' : ''}{userGrowth.toFixed(1)}% vs mes anterior
                </p>
              )}
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Plan Free</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.organizationsByPlan.free || 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                organizaciones
              </p>
            </div>
            <div className="h-10 w-10 rounded-full" style={{ backgroundColor: 'var(--plan-free-bg)', opacity: 0.1 }}>
              <div className="h-full w-full flex items-center justify-center">
                <Building className="h-5 w-5" style={{ color: 'var(--plan-free-bg)' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Plan Pro</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.organizationsByPlan.pro || 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                organizaciones
              </p>
            </div>
            <div className="h-10 w-10 rounded-full" style={{ backgroundColor: 'var(--plan-pro-bg)', opacity: 0.1 }}>
              <div className="h-full w-full flex items-center justify-center">
                <Building className="h-5 w-5" style={{ color: 'var(--plan-pro-bg)' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Plan Teams</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.organizationsByPlan.teams || 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                organizaciones
              </p>
            </div>
            <div className="h-10 w-10 rounded-full" style={{ backgroundColor: 'var(--plan-teams-bg)', opacity: 0.1 }}>
              <div className="h-full w-full flex items-center justify-center">
                <Building className="h-5 w-5" style={{ color: 'var(--plan-teams-bg)' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Promedio Proyectos</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.avgProjectsPerOrg.toFixed(1) || 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                por organización
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </Card>
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
