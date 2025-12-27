import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AppCard, AppCardTitle, AppCardValue, AppCardMeta } from '@/components/shared/AppCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Activity, Users, TrendingUp, Building, Calendar, Eye, Clock } from 'lucide-react'
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

interface DashboardStats {
  totalOrganizations: number
  activeOrganizations: number
  newOrganizationsThisMonth: number
  totalUsers: number
  activeUsersNow: number
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
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart.toISOString()),
        supabase.from('user_view_history').select('*', { count: 'exact', head: true }).gte('entered_at', todayStart.toISOString()),
        supabase.from('user_view_history').select('duration_seconds').gte('entered_at', todayStart.toISOString()).not('duration_seconds', 'is', null)
      ])

      const uniqueActiveUsers = new Set(activeUsersResult.data?.map(u => u.user_id) || [])
      const avgDuration = avgDurationResult.data && avgDurationResult.data.length > 0
        ? avgDurationResult.data.reduce((sum, row) => sum + (row.duration_seconds || 0), 0) / avgDurationResult.data.length
        : 0

      return {
        totalOrganizations: totalOrgsResult.count || 0,
        activeOrganizations: activeOrgsResult.count || 0,
        newOrganizationsThisMonth: newOrgsThisMonthResult.count || 0,
        totalUsers: totalUsersResult.count || 0,
        activeUsersNow: uniqueActiveUsers.size,
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
      
      const hourlyCounts = new Array(24).fill(0)
      
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
      
      const userMap = new Map<string, any>()
      
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
        const user = userMap.get(userId)
        if (user) user.total_seconds += row.duration_seconds || 0
      })
      
      return Array.from(userMap.values() as any[])
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
          <AppCardMeta>Ahora mismo (últimos 90s)</AppCardMeta>
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
        <Card data-testid="card-engagement">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Engagement por Vista
            </CardTitle>
            <CardDescription>
              Tiempo promedio en cada sección ({periodLabel})
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Actividad por Hora */}
        <Card data-testid="card-hourly">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Actividad por Hora
            </CardTitle>
            <CardDescription>Sesiones iniciadas por hora del día</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Usuarios con Mayor Uso */}
      <Card data-testid="card-top-users">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Usuarios con Mayor Uso
          </CardTitle>
          <CardDescription>Top usuarios por tiempo en plataforma ({periodLabel})</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
