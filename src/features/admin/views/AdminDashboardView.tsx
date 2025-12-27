import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AppCard, AppCardTitle, AppCardValue, AppCardMeta, AppCardContent } from '@/components/shared/AppCard'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Activity, Users, TrendingUp, Building, Calendar, Eye, Clock, UserPlus } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, subDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

type PeriodFilter = '30d' | '3m' | '6m' | '1y' | 'all'

function formatViewName(view: string | null): string {
  if (!view) return 'Sin ubicación'
  
  const viewMap: Record<string, string> = {
    'home': 'Inicio',
    'organization_dashboard': 'Dashboard Organización',
    'organization_projects': 'Proyectos',
    'preferences': 'Preferencias',
    'organization_activity': 'Actividad',
    'organization': 'Organización',
    'project_dashboard': 'Dashboard Proyecto',
    'project_data': 'Datos del Proyecto',
    'budgets': 'Presupuestos',
    'construction': 'Construcción',
    'contacts': 'Contactos',
    'movements': 'Movimientos',
    'capital': 'Capital',
    'general_costs': 'Gastos Generales',
    'analysis': 'Análisis',
    'learning_dashboard': 'Dashboard Capacitaciones',
    'learning_courses': 'Cursos',
    'learning': 'Capacitaciones',
    'admin_dashboard': 'Admin - Analytics',
    'admin_administration': 'Admin - Administración',
    'admin_support': 'Admin - Soporte',
  };
  
  return viewMap[view] || view.replace(/_/g, ' ');
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
}

function formatAcquisitionOrigin(origin?: string): string {
  if (!origin) return 'Directo'
  const originMap: Record<string, string> = {
    'direct': 'Directo',
    'google': 'Google',
    'email': 'Email',
    'referral': 'Referido',
    'social': 'Social Media',
  }
  return originMap[origin] || origin
}

interface DashboardStats {
  totalOrganizations: number
  activeOrganizations: number
  newOrganizationsThisMonth: number
  totalUsers: number
  activeUsersNow: number
  activeUsersToday: number
  newUsersThisMonth: number
  totalProjects: number
  newProjectsThisMonth: number
  sessionsToday: number
  avgSessionDuration: number
}

interface AdminDashboardViewProps {
  selectedPeriod?: PeriodFilter
}

export default function AdminDashboardView({ selectedPeriod = 'all' }: AdminDashboardViewProps) {
  const [accentColor, setAccentColor] = useState<string>('#8b5cf6')

  useEffect(() => {
    const computedColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent')
      .trim();
    if (computedColor) setAccentColor(computedColor);
  }, []);

  const getStartDate = (period: PeriodFilter): Date => {
    const now = new Date();
    switch (period) {
      case '30d': return subDays(now, 30);
      case '3m': return subDays(now, 90);
      case '6m': return subDays(now, 180);
      case '1y': return subDays(now, 365);
      default: return new Date(0);
    }
  };

  // KPI Data - Usuarios y Organizaciones
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      const now = new Date()
      const thisMonthStart = startOfMonth(now)
      const ninetySecondsAgo = new Date(now.getTime() - 90000)
      const todayStart = startOfDay(now)

      const [
        totalOrgsResult,
        activeOrgsResult,
        newOrgsThisMonthResult,
        totalUsersResult,
        newUsersThisMonthResult,
        activeUsersResult,
        activeUsersTodayResult,
        totalProjectsResult,
        newProjectsThisMonthResult,
        sessionsResult,
        avgDurationResult
      ] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
        supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_deleted', false).eq('is_active', true),
        supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_deleted', false).gte('created_at', thisMonthStart.toISOString()),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart.toISOString()),
        supabase.from('user_presence').select('user_id').gte('last_seen_at', ninetySecondsAgo.toISOString()),
        supabase.from('user_view_history').select('user_id').gte('entered_at', todayStart.toISOString()),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart.toISOString()),
        supabase.from('user_view_history').select('*', { count: 'exact', head: true }).gte('entered_at', todayStart.toISOString()),
        supabase.from('user_view_history').select('duration_seconds').gte('entered_at', todayStart.toISOString()).not('duration_seconds', 'is', null)
      ])

      const uniqueActiveUsers = new Set(activeUsersResult.data?.map(u => u.user_id) || [])
      const uniqueActiveUsersToday = new Set(activeUsersTodayResult.data?.map(u => u.user_id) || [])
      const avgDuration = avgDurationResult.data && avgDurationResult.data.length > 0
        ? avgDurationResult.data.reduce((sum, row) => sum + (row.duration_seconds || 0), 0) / avgDurationResult.data.length
        : 0

      return {
        totalOrganizations: totalOrgsResult.count || 0,
        activeOrganizations: activeOrgsResult.count || 0,
        newOrganizationsThisMonth: newOrgsThisMonthResult.count || 0,
        totalUsers: totalUsersResult.count || 0,
        activeUsersNow: uniqueActiveUsers.size,
        activeUsersToday: uniqueActiveUsersToday.size,
        newUsersThisMonth: newUsersThisMonthResult.count || 0,
        totalProjects: totalProjectsResult.count || 0,
        newProjectsThisMonth: newProjectsThisMonthResult.count || 0,
        sessionsToday: sessionsResult.count || 0,
        avgSessionDuration: avgDuration
      } as DashboardStats
    },
    enabled: !!supabase,
    staleTime: 30000,
    refetchInterval: 60000
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
          current_view,
          users!inner(full_name)
        `)
        .order('last_seen_at', { ascending: false })
        .limit(10)

      return data
    },
    enabled: !!supabase,
    staleTime: 15000,
    refetchInterval: 30000
  })

  // Últimos usuarios registrados con su organización y origen
  const { data: recentUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['recently-registered-users'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')
      
      const response = await fetch('/api/admin/users/recent?limit=10', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch recent users')
      }
      
      return response.json()
    },
    enabled: !!supabase,
    staleTime: 30000,
    refetchInterval: 60000
  })

  // Engagement por Vista
  const { data: engagementData, isLoading: loadingEngagement } = useQuery({
    queryKey: ['admin-dashboard-engagement', selectedPeriod],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      const startDate = getStartDate(selectedPeriod)
      
      const { data, error } = await supabase
        .from('user_view_history')
        .select('view_name, duration_seconds')
        .gte('entered_at', startDate.toISOString())
        .not('duration_seconds', 'is', null)
      
      if (error) throw error
      
      const grouped = (data as any[] || []).reduce((acc: any, row: any) => {
        if (!acc[row.view_name]) {
          acc[row.view_name] = { total: 0, count: 0 };
        }
        acc[row.view_name].total += row.duration_seconds || 0;
        acc[row.view_name].count += 1;
        return acc;
      }, {})
      
      return Object.entries(grouped)
        .map(([view, stats]: [string, any]) => ({
          view: formatViewName(view),
          avgSeconds: stats.total / stats.count,
          avgMinutes: (stats.total / stats.count) / 60,
          sessions: stats.count
        }))
        .sort((a, b) => b.avgSeconds - a.avgSeconds)
        .slice(0, 8)
    },
    enabled: !!supabase
  })

  // Actividad por Hora
  const { data: hourlyData, isLoading: loadingHourly } = useQuery({
    queryKey: ['admin-dashboard-hourly', selectedPeriod],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      const startDate = getStartDate(selectedPeriod)
      
      const { data, error } = await supabase
        .from('user_view_history')
        .select('entered_at')
        .gte('entered_at', startDate.toISOString())
      
      if (error) throw error
      
      const hourlyCounts = Array.from({ length: 24 }, () => 0)
      
      (data as any[] || []).forEach((row: any) => {
        const hour = new Date(row.entered_at).getHours()
        hourlyCounts[hour]++
      })
      
      return hourlyCounts.map((count: number, hour: number) => ({
        hour,
        hourLabel: `${hour.toString().padStart(2, '0')}:00`,
        sessions: count
      }))
    },
    enabled: !!supabase
  })

  // Top Usuarios
  const { data: topUsersData, isLoading: loadingTopUsers } = useQuery({
    queryKey: ['admin-dashboard-top-users', selectedPeriod],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      const startDate = getStartDate(selectedPeriod)
      
      const { data, error } = await supabase
        .from('user_view_history')
        .select(`user_id, duration_seconds, users!inner(full_name, avatar_url)`)
        .gte('entered_at', startDate.toISOString())
        .not('duration_seconds', 'is', null)
      
      if (error) throw error
      
      const userMap: Map<string, any> = new Map()
      
      (data as any[] || []).forEach((row: any) => {
        const userId = row.user_id
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            full_name: row.users?.full_name || 'Usuario',
            avatar_url: row.users?.avatar_url,
            total_seconds: 0
          })
        }
        const user = userMap.get(userId) as any
        if (user) user.total_seconds += row.duration_seconds || 0
      })
      
      return Array.from(userMap.values())
        .sort((a: any, b: any) => b.total_seconds - a.total_seconds)
        .slice(0, 8)
    },
    enabled: !!supabase
  })

  if (loadingStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" data-testid={`skeleton-kpi-${i}`} />
          ))}
        </div>
      </div>
    )
  }

  const periodLabel = {
    '30d': 'últimos 30 días',
    '3m': 'últimos 3 meses',
    '6m': 'últimos 6 meses',
    '1y': 'último año',
    'all': 'histórico'
  }[selectedPeriod] || 'histórico'

  return (
    <div className="space-y-6">
      {/* 4 KPIs Consolidados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AppCard data-testid="kpi-usuarios-activos">
          <AppCardTitle>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Usuarios Activos</span>
            </div>
          </AppCardTitle>
          <AppCardValue className="text-[var(--accent)]">
            {stats?.activeUsersNow || 0}
          </AppCardValue>
          <AppCardMeta>{stats?.activeUsersToday || 0} activos hoy</AppCardMeta>
        </AppCard>

        <AppCard data-testid="kpi-nuevos-usuarios">
          <AppCardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Nuevos Usuarios</span>
            </div>
          </AppCardTitle>
          <AppCardValue>
            {stats?.newUsersThisMonth || 0}
          </AppCardValue>
          <AppCardMeta>Este mes</AppCardMeta>
        </AppCard>

        <AppCard data-testid="kpi-organizaciones">
          <AppCardTitle>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Organizaciones</span>
            </div>
          </AppCardTitle>
          <AppCardValue>
            {stats?.activeOrganizations || 0}
          </AppCardValue>
          <AppCardMeta>Activas ({stats?.totalOrganizations || 0} totales)</AppCardMeta>
        </AppCard>

        <AppCard data-testid="kpi-proyectos">
          <AppCardTitle>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Proyectos</span>
            </div>
          </AppCardTitle>
          <AppCardValue>
            {stats?.totalProjects || 0}
          </AppCardValue>
          <AppCardMeta>{stats?.newProjectsThisMonth || 0} nuevos este mes</AppCardMeta>
        </AppCard>
      </div>

      {/* Charts - 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement por Vista */}
        <AppCard 
          title="Engagement por Vista" 
          icon={<Eye />}
          description={`Tiempo promedio en cada sección (${periodLabel})`}
          data-testid="card-engagement"
        >
          <AppCardContent>
            {loadingEngagement ? (
              <Skeleton className="h-[250px]" />
            ) : engagementData && engagementData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={engagementData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="view" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => formatDuration(value * 60)} />
                  <Bar dataKey="avgMinutes" radius={[0, 4, 4, 0]} fill={accentColor} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sin datos
              </div>
            )}
          </AppCardContent>
        </AppCard>

        {/* Actividad por Hora */}
        <AppCard 
          title="Actividad por Hora" 
          icon={<Calendar />}
          description="Sesiones iniciadas por hora del día"
          data-testid="card-hourly"
        >
          <AppCardContent>
            {loadingHourly ? (
              <Skeleton className="h-[250px]" />
            ) : hourlyData && hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="hourLabel" tick={{ fontSize: 11 }} interval={2} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sessions" stroke={accentColor} strokeWidth={2} dot={{ fill: accentColor }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sin datos
              </div>
            )}
          </AppCardContent>
        </AppCard>
      </div>

      {/* Actividad Reciente y Últimos Registrados - 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Actividad Reciente */}
        <AppCard 
          title="Actividad Reciente de Usuarios" 
          icon={<Clock />}
          data-testid="card-actividad-reciente"
        >
          <AppCardContent>
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
                      <div key={activity.user_id} className="flex items-start justify-between gap-3 p-2 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-sm">{activity.users?.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {formatViewName(activity.current_view)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {isActive ? (
                            <Badge variant="status-active">Activo</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(activity.last_seen_at), "d 'de' MMM, HH:mm", { locale: es })}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <a 
                  href="/admin/administration" 
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = '/admin/administration'
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
          </AppCardContent>
        </AppCard>

        {/* Últimos Registrados */}
        <AppCard 
          title="Últimos Registrados" 
          icon={<UserPlus />}
          data-testid="card-usuarios-recientes"
        >
          <AppCardContent>
            {loadingUsers ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentUsers && recentUsers.length > 0 ? (
              <>
                <div className="space-y-2">
                  {recentUsers.map((user: any) => (
                    <div key={user.id} className="flex items-start justify-between gap-3 p-2 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-sm">{user.full_name || user.email}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {user.organization_name || 'Sin organización'}
                        </p>
                        <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                          Origen: {formatAcquisitionOrigin(
                            typeof user.acquisition === 'object' 
                              ? (user.acquisition?.source || user.acquisition?.medium || 'direct')
                              : user.acquisition
                          )}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(user.created_at), "d 'de' MMM, HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <a 
                  href="/admin/administration" 
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = '/admin/administration'
                  }}
                  className="block mt-4 pt-3 border-t text-center text-sm hover:underline transition-all"
                  style={{ color: 'hsl(var(--accent))' }}
                >
                  Ver más usuarios
                </a>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay usuarios registrados
              </p>
            )}
          </AppCardContent>
        </AppCard>
      </div>

      {/* Usuarios con Mayor Uso */}
      <AppCard 
        title="Usuarios con Mayor Uso" 
        icon={<Clock />}
        description={`Top usuarios por tiempo en plataforma (${periodLabel})`}
        data-testid="card-top-users"
      >
        <AppCardContent>
          {loadingTopUsers ? (
            <Skeleton className="h-[200px]" />
          ) : topUsersData && topUsersData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right">Tiempo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsersData?.map((user: any, idx: number) => (
                  <TableRow key={user.user_id} data-testid={`row-top-user-${idx}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatDuration(user.total_seconds)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground">
              Sin datos
            </div>
          )}
        </AppCardContent>
      </AppCard>
    </div>
  )
}
