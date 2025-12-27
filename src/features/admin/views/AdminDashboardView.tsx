import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { AppCard, AppCardTitle, AppCardValue, AppCardMeta, AppCardContent } from '@/components/shared/AppCard'
import { HorizontalBarChart } from '@/components/charts/bar/HorizontalBarChart'
import { TrendLineChart } from '@/components/charts/line/TrendLineChart'
import { MonthlyTrendChart } from '@/components/charts/line/AreaTrendChart'
import { DonutChart } from '@/components/charts/pie/DonutChart'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Activity, Users, TrendingUp, Building, Calendar, Eye, Clock, UserPlus, LogOut, Zap, LineChart, PieChart } from 'lucide-react'
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
  
  if (viewMap[view]) return viewMap[view]
  
  const coursePatterns = [
    /^courses_(.+)$/,
    /^learning_course_(.+)$/,
    /^course_(.+)$/
  ]
  
  for (const pattern of coursePatterns) {
    const match = view.match(pattern)
    if (match) {
      const slug = match[1]
      const courseName = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      return `Curso - ${courseName}`
    }
  }
  
  return view.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
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

const ADMIN_ROLE_ID = 'd5606324-af8d-487e-8c8e-552511fce2a2'

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

  // Obtener IDs de usuarios admin para excluirlos de las métricas
  const { data: adminUserIds } = useQuery({
    queryKey: ['admin-user-ids'],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('role_id', ADMIN_ROLE_ID)
      if (error) {
        console.error('Error fetching admin users:', error)
        return []
      }
      return (data || []).map((u: any) => u.id)
    },
    staleTime: 1000 * 60 * 10, // Cache por 10 minutos
    enabled: !!supabase
  })
  
  const adminIdsSet = new Set(adminUserIds || [])

  // KPI Data - Usuarios y Organizaciones
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-dashboard-stats', adminUserIds],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')

      const now = new Date()
      const thisMonthStart = startOfMonth(now)
      const ninetySecondsAgo = new Date(now.getTime() - 90000)
      const todayStart = startOfDay(now)
      const adminIds = adminUserIds || []

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
        supabase.from('users').select('*', { count: 'exact', head: true }).neq('role_id', ADMIN_ROLE_ID),
        supabase.from('users').select('*', { count: 'exact', head: true }).neq('role_id', ADMIN_ROLE_ID).gte('created_at', thisMonthStart.toISOString()),
        supabase.from('user_presence').select('user_id').gte('last_seen_at', ninetySecondsAgo.toISOString()),
        supabase.from('user_view_history').select('user_id').gte('entered_at', todayStart.toISOString()),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart.toISOString()),
        supabase.from('user_view_history').select('user_id').gte('entered_at', todayStart.toISOString()),
        supabase.from('user_view_history').select('user_id, duration_seconds').gte('entered_at', todayStart.toISOString()).not('duration_seconds', 'is', null)
      ])

      const adminIdsSetLocal = new Set(adminIds)
      const uniqueActiveUsers = new Set(
        (activeUsersResult.data || [])
          .map(u => u.user_id)
          .filter(id => !adminIdsSetLocal.has(id))
      )
      const uniqueActiveUsersToday = new Set(
        (activeUsersTodayResult.data || [])
          .map(u => u.user_id)
          .filter(id => !adminIdsSetLocal.has(id))
      )
      
      // Filtrar sesiones de hoy excluyendo admins
      const nonAdminSessions = (sessionsResult.data || []).filter((row: any) => !adminIdsSetLocal.has(row.user_id))
      
      // Filtrar duración promedio excluyendo admins
      const nonAdminDurations = (avgDurationResult.data || []).filter((row: any) => !adminIdsSetLocal.has(row.user_id))
      const avgDuration = nonAdminDurations.length > 0
        ? nonAdminDurations.reduce((sum: number, row: any) => sum + (row.duration_seconds || 0), 0) / nonAdminDurations.length
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
        sessionsToday: nonAdminSessions.length,
        avgSessionDuration: avgDuration
      } as DashboardStats
    },
    enabled: !!supabase && adminUserIds !== undefined,
    staleTime: 30000,
    refetchInterval: 60000
  })

  // Últimas conexiones de usuarios - OPTIMIZADO
  const { data: recentActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ['recent-user-activity', adminUserIds],
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
        .limit(20)

      const adminIdsSetLocal = new Set(adminUserIds || [])
      return (data || []).filter((row: any) => !adminIdsSetLocal.has(row.user_id)).slice(0, 10)
    },
    enabled: !!supabase && adminUserIds !== undefined,
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
    queryKey: ['admin-dashboard-engagement', selectedPeriod, adminUserIds],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      const startDate = getStartDate(selectedPeriod)
      
      const { data, error } = await supabase
        .from('user_view_history')
        .select('user_id, view_name, duration_seconds')
        .gte('entered_at', startDate.toISOString())
        .not('duration_seconds', 'is', null)
      
      if (error) throw error
      
      const adminIdsSetLocal = new Set(adminUserIds || [])
      const filteredData = (data as any[] || []).filter((row: any) => !adminIdsSetLocal.has(row.user_id))
      
      const grouped = filteredData.reduce((acc: any, row: any) => {
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
    enabled: !!supabase && adminUserIds !== undefined
  })

  // Actividad por Hora
  const { data: hourlyData, isLoading: loadingHourly } = useQuery({
    queryKey: ['admin-dashboard-hourly', selectedPeriod, adminUserIds],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      const startDate = getStartDate(selectedPeriod)
      
      const { data, error } = await supabase
        .from('user_view_history')
        .select('user_id, entered_at')
        .gte('entered_at', startDate.toISOString())
      
      if (error) throw error
      
      const adminIdsSetLocal = new Set(adminUserIds || [])
      const filteredData = (data as any[] || []).filter((row: any) => !adminIdsSetLocal.has(row.user_id))
      
      const hourlyCounts = Array.from({ length: 24 }, () => 0)
      
      filteredData.forEach((row: any) => {
        const hour = new Date(row.entered_at).getHours()
        hourlyCounts[hour]++
      })
      
      const result = hourlyCounts.map((count: number, hour: number) => ({
        hour,
        hourLabel: `${hour.toString().padStart(2, '0')}:00`,
        sessions: count
      }))
      
      const totalSessions = hourlyCounts.reduce((a, b) => a + b, 0)
      return totalSessions > 0 ? result : []
    },
    enabled: !!supabase && adminUserIds !== undefined
  })

  // Top Usuarios (por cantidad de sesiones, no solo duración)
  const { data: topUsersData, isLoading: loadingTopUsers } = useQuery({
    queryKey: ['admin-dashboard-top-users', selectedPeriod, adminUserIds],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      const startDate = getStartDate(selectedPeriod)
      
      const { data, error } = await supabase
        .from('user_view_history')
        .select(`user_id, duration_seconds`)
        .gte('entered_at', startDate.toISOString())
      
      if (error) throw error
      
      const adminIdsSetLocal = new Set(adminUserIds || [])
      const userMap: Map<string, any> = new Map()
      
      (data as any[] || []).forEach((row: any) => {
        const userId = row.user_id
        if (adminIdsSetLocal.has(userId)) return
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            total_seconds: 0,
            session_count: 0
          })
        }
        const user = userMap.get(userId) as any
        if (user) {
          user.total_seconds += row.duration_seconds || 0
          user.session_count += 1
        }
      })
      
      const userIds = Array.from(userMap.keys())
      if (userIds.length === 0) return []
      
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', userIds)
      
      const usersById = new Map((usersData || []).map((u: any) => [u.id, u]))
      
      return Array.from(userMap.values())
        .map((u: any) => ({
          ...u,
          full_name: usersById.get(u.user_id)?.full_name || 'Usuario',
          avatar_url: usersById.get(u.user_id)?.avatar_url
        }))
        .sort((a: any, b: any) => b.session_count - a.session_count)
        .slice(0, 8)
    },
    enabled: !!supabase && adminUserIds !== undefined
  })

  // Drop Off - Usuarios con bajo engagement (1-2 sesiones solamente)
  const { data: dropOffData, isLoading: loadingDropOff } = useQuery({
    queryKey: ['admin-dashboard-dropoff', selectedPeriod, adminUserIds],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      const startDate = getStartDate(selectedPeriod)
      
      const { data, error } = await supabase
        .from('user_view_history')
        .select(`user_id, duration_seconds`)
        .gte('entered_at', startDate.toISOString())
      
      if (error) throw error
      
      const adminIdsSetLocal = new Set(adminUserIds || [])
      const userMap: Map<string, any> = new Map()
      
      (data as any[] || []).forEach((row: any) => {
        const userId = row.user_id
        if (adminIdsSetLocal.has(userId)) return
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            total_seconds: 0,
            session_count: 0
          })
        }
        const user = userMap.get(userId) as any
        if (user) {
          user.total_seconds += row.duration_seconds || 0
          user.session_count += 1
        }
      })
      
      const userIds = Array.from(userMap.keys())
      if (userIds.length === 0) return []
      
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', userIds)
      
      const usersById = new Map((usersData || []).map((u: any) => [u.id, u]))
      
      return Array.from(userMap.values())
        .map((u: any) => ({
          ...u,
          full_name: usersById.get(u.user_id)?.full_name || 'Usuario',
          avatar_url: usersById.get(u.user_id)?.avatar_url
        }))
        .filter((u: any) => u.session_count <= 2)
        .sort((a: any, b: any) => a.session_count - b.session_count)
        .slice(0, 8)
    },
    enabled: !!supabase && adminUserIds !== undefined
  })

  // Crecimiento de Usuarios por Mes
  const { data: userGrowthData, isLoading: loadingUserGrowth } = useQuery({
    queryKey: ['admin-dashboard-user-growth'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      const { data, error } = await supabase
        .from('users')
        .select('created_at')
        .neq('role_id', ADMIN_ROLE_ID)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      const monthlyData: Map<string, number> = new Map()
      
      (data as any[] || []).forEach((user: any) => {
        const date = new Date(user.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1)
      })
      
      return Array.from(monthlyData.entries())
        .map(([month, value]) => ({ month, value }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12)
    },
    enabled: !!supabase
  })

  // Distribución de Adquisición (UTM Sources)
  const { data: acquisitionData, isLoading: loadingAcquisition } = useQuery({
    queryKey: ['admin-dashboard-acquisition', adminUserIds],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      const { data, error } = await supabase
        .from('user_acquisition')
        .select('user_id, source, medium')
      
      if (error) throw error
      
      const adminIdsSetLocal = new Set(adminUserIds || [])
      const filteredData = (data as any[] || []).filter((row: any) => !adminIdsSetLocal.has(row.user_id))
      
      const sourceMap: Map<string, number> = new Map()
      
      filteredData.forEach((row: any) => {
        let source = row.source || row.medium || 'direct'
        if (source === 'unknown' || source === '') source = 'direct'
        const label = source === 'direct' ? 'Directo' : 
                      source === 'google' ? 'Google' :
                      source === 'facebook' ? 'Facebook' :
                      source === 'instagram' ? 'Instagram' :
                      source === 'linkedin' ? 'LinkedIn' :
                      source === 'twitter' ? 'Twitter/X' :
                      source === 'referral' ? 'Referido' :
                      source === 'organic' ? 'Orgánico' :
                      String(source).charAt(0).toUpperCase() + String(source).slice(1)
        sourceMap.set(label, (sourceMap.get(label) || 0) + 1)
      })
      
      return Array.from(sourceMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    },
    enabled: !!supabase && adminUserIds !== undefined
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

      {/* Charts - 4 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Engagement por Vista */}
        <AppCard 
          title="Engagement por Vista" 
          icon={<Eye />}
          description={`Tiempo promedio (${periodLabel})`}
          data-testid="card-engagement"
        >
          <AppCardContent>
            <HorizontalBarChart
              data={(engagementData || []).map((d: any) => ({
                label: d.view,
                value: d.avgMinutes
              }))}
              height={220}
              isLoading={loadingEngagement}
              valueFormatter={(v) => `${v.toFixed(1)}m`}
              yAxisWidth={100}
              emptyText="Sin datos"
            />
          </AppCardContent>
        </AppCard>

        {/* Actividad por Hora */}
        <AppCard 
          title="Actividad por Hora" 
          icon={<Calendar />}
          description="Sesiones por hora del día"
          data-testid="card-hourly"
        >
          <AppCardContent>
            <TrendLineChart
              data={(hourlyData || []).map((d: any) => ({
                label: d.hourLabel,
                value: d.sessions
              }))}
              height={220}
              isLoading={loadingHourly}
              valueFormatter={(v) => `${v} sesiones`}
              color={accentColor}
              emptyText="Sin datos"
            />
          </AppCardContent>
        </AppCard>

        {/* Crecimiento de Usuarios */}
        <AppCard 
          title="Crecimiento de Usuarios" 
          icon={<LineChart />}
          description="Registros por mes"
          data-testid="card-user-growth"
        >
          <AppCardContent>
            <MonthlyTrendChart
              data={userGrowthData || []}
              height={220}
              isLoading={loadingUserGrowth}
              color={accentColor}
              emptyText="Sin datos"
            />
          </AppCardContent>
        </AppCard>

        {/* Distribución de Adquisición */}
        <AppCard 
          title="Fuentes de Adquisición" 
          icon={<PieChart />}
          description="De dónde vienen los usuarios"
          data-testid="card-acquisition"
        >
          <AppCardContent>
            <DonutChart
              data={acquisitionData || []}
              height={220}
              isLoading={loadingAcquisition}
              emptyText="Sin datos"
              showLegend={true}
              innerRadius={40}
              outerRadius={70}
            />
          </AppCardContent>
        </AppCard>
      </div>

      {/* Actividad Reciente, Últimos Registrados, Top Usuarios, Drop Off - 4 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {recentActivity.slice(0, 10).map((activity: any) => {
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
                            <Badge variant="status-online">Online</Badge>
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
                  {recentUsers.slice(0, 10).map((user: any) => (
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

        {/* Top Usuarios Activos - Top 3 */}
        <AppCard 
          title="Top Usuarios Activos" 
          icon={<Zap />}
          data-testid="card-top-users-active"
        >
          <AppCardContent>
            {loadingTopUsers ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : topUsersData && topUsersData.length > 0 ? (
              <div className="space-y-2">
                {topUsersData.slice(0, 3).map((user: any, idx: number) => (
                  <div key={user.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.session_count} sesiones</p>
                    </div>
                    <Badge variant="status-completed" className="text-xs">#{idx + 1}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin datos
              </p>
            )}
          </AppCardContent>
        </AppCard>

        {/* Drop Off - Usuarios con bajo engagement */}
        <AppCard 
          title="Drop Off" 
          icon={<LogOut />}
          data-testid="card-dropoff"
        >
          <AppCardContent>
            {loadingDropOff ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : dropOffData && dropOffData.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Usuarios con bajo engagement</p>
                {dropOffData.slice(0, 3).map((user: any) => (
                  <div key={user.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 hover:bg-destructive/10 transition-colors border border-destructive/20">
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.session_count} sesión{user.session_count > 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center mt-3">Total: {dropOffData.length} usuarios</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin datos
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
