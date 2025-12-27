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
    'landing': 'Página de Inicio',
    'profile': 'Mi Perfil',
    'auth': 'Autenticación',
    'onboarding': 'Onboarding',
    'pricing': 'Planes de Precios',
    
    // Organization
    'organization_dashboard': 'Dashboard de Organización',
    'organization_projects': 'Proyectos',
    'organization_preferences': 'Preferencias de Organización',
    'organization_activity': 'Actividad de Organización',
    'organization_members': 'Miembros de Organización',
    'organization': 'Organización',
    
    // Project
    'project_dashboard': 'Dashboard del Proyecto',
    'project_details': 'Detalles del Proyecto',
    'project_gallery': 'Galería del Proyecto',
    'project_documents': 'Documentos del Proyecto',
    'project_tasks': 'Tareas del Proyecto',
    'project_team': 'Equipo del Proyecto',
    'project_data': 'Datos del Proyecto',
    'moodboard': 'Moodboard',
    'sitelog': 'Registro del Sitio',
    
    // Financial & Budget
    'budgets': 'Presupuestos',
    'construction': 'Construcción',
    'contacts': 'Contactos',
    'capital': 'Capital',
    'general_costs': 'Gastos Generales',
    'analysis': 'Análisis',
    
    // Learning
    'learning_dashboard': 'Dashboard de Capacitaciones',
    'learning_courses': 'Cursos',
    'learning': 'Capacitaciones',
    
    // Admin
    'admin_dashboard': 'Admin - Analytics',
    'admin_administration': 'Admin - Administración',
    'admin_support': 'Admin - Soporte',
    'admin_payments': 'Admin - Pagos',
    'admin_courses': 'Admin - Cursos',
    'admin_costs': 'Admin - Costos',
    'admin_tasks': 'Admin - Tareas',
    'admin_general': 'Admin - General',
    'admin_layout': 'Admin - Layout',
    'admin_ops': 'Admin - Operations Center',
    'admin': 'Admin',
    
    // Other
    'providers': 'Proveedores',
    'provider_products': 'Productos de Proveedor',
    'notifications': 'Notificaciones',
    'calendar': 'Calendario',
    'media': 'Multimedia',
    'clients': 'Clientes',
    'tasks': 'Tareas',
    'personnel': 'Personal',
    'subcontracts': 'Subcontratos',
    'founders': 'Programa Fundadores',
  };
  
  if (viewMap[view]) return viewMap[view]
  
  const coursePatterns = [
    /^courses_(.+)$/,
    /^cursos_(.+)$/,
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

  // KPI Data desde Vista Optimizada
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['user-stats-summary'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      const { data, error } = await supabase.from('user_stats_summary_view').select('*').single()
      if (error) throw error
      // Transform snake_case from DB to camelCase for frontend
      return {
        totalOrganizations: data.total_organizations,
        activeOrganizations: data.active_organizations,
        newOrganizationsThisMonth: data.new_organizations_this_month,
        totalUsers: data.total_users,
        activeUsersNow: data.active_users_now,
        activeUsersToday: data.active_users_today,
        newUsersThisMonth: data.new_users_this_month,
        totalProjects: data.total_projects,
        newProjectsThisMonth: data.new_projects_this_month,
        sessionsToday: data.sessions_today,
        avgSessionDuration: data.avg_session_duration
      } as DashboardStats
    },
    enabled: !!supabase,
    staleTime: 30000,
    refetchInterval: 60000
  })

  // Actividad Reciente desde Vista
  const { data: recentActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ['user-presence-activity'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      const { data, error } = await supabase
        .from('user_presence_activity_view')
        .select('user_id, full_name, avatar_url, last_seen_at, current_view, status')
      if (error) throw error
      return (data || []).slice(0, 10)
    },
    enabled: !!supabase,
    staleTime: 15000,
    refetchInterval: 30000
  })

  // Últimos usuarios registrados
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

  // Engagement por Vista desde Vista
  const { data: engagementData, isLoading: loadingEngagement } = useQuery({
    queryKey: ['user-engagement-by-view'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      const { data, error } = await supabase
        .from('user_engagement_by_view_view')
        .select('*')
      if (error) throw error
      return (data || []).map((row: any) => ({
        view: formatViewName(row.view_name),
        avgSeconds: row.avg_duration_seconds,
        avgMinutes: row.avg_duration_minutes,
        sessions: row.session_count
      })).slice(0, 8)
    },
    enabled: !!supabase
  })

  // Actividad por Hora desde Vista
  const { data: hourlyData, isLoading: loadingHourly } = useQuery({
    queryKey: ['user-hourly-activity'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      const { data, error } = await supabase
        .from('user_hourly_activity_view')
        .select('*')
      if (error) throw error
      return (data || []).map((row: any) => ({
        hour: row.hour,
        hourLabel: row.hour_label,
        sessions: row.session_count
      }))
    },
    enabled: !!supabase
  })

  // Top Usuarios desde Vista
  const { data: topUsersData, isLoading: loadingTopUsers } = useQuery({
    queryKey: ['user-top-performers'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      const { data, error } = await supabase
        .from('user_top_performers_view')
        .select('*')
      if (error) throw error
      return data || []
    },
    enabled: !!supabase
  })

  // Drop Off desde Vista
  const { data: dropOffData, isLoading: loadingDropOff } = useQuery({
    queryKey: ['user-drop-off'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      const { data, error } = await supabase
        .from('user_drop_off_view')
        .select('*')
      if (error) throw error
      return data || []
    },
    enabled: !!supabase
  })

  // Crecimiento de Usuarios desde Vista
  const { data: userGrowthData, isLoading: loadingUserGrowth } = useQuery({
    queryKey: ['user-monthly-growth'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      const { data, error } = await supabase
        .from('user_monthly_growth_view')
        .select('*')
      if (error) throw error
      return (data || []).map((row: any) => ({
        month: row.month,
        value: row.new_users
      })).slice(-12)
    },
    enabled: !!supabase
  })

  // Distribución de Adquisición desde Vista
  const { data: acquisitionData, isLoading: loadingAcquisition } = useQuery({
    queryKey: ['user-acquisition-distribution'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      const { data, error } = await supabase
        .from('user_acquisition_distribution_view')
        .select('*')
      if (error) throw error
      return (data || []).map((row: any) => ({
        label: row.acquisition_source === 'directo' ? 'Directo' : 
               row.acquisition_source === 'google' ? 'Google' :
               row.acquisition_source === 'facebook' ? 'Facebook' :
               row.acquisition_source === 'instagram' ? 'Instagram' :
               row.acquisition_source === 'linkedin' ? 'LinkedIn' :
               row.acquisition_source === 'twitter' ? 'Twitter/X' :
               String(row.acquisition_source).charAt(0).toUpperCase() + String(row.acquisition_source).slice(1),
        value: row.user_count
      }))
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

      {/* Charts - 4 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Engagement por Vista */}
        <AppCard 
          title="Engagement por Vista" 
          icon={<Eye />}
          description={`Tiempo promedio`}
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
              data={(userGrowthData || []).map((d: any) => ({
                month: d.month,
                value: d.value
              }))}
              height={220}
              isLoading={loadingUserGrowth}
              valueFormatter={(v) => `${v} usuarios`}
              color={accentColor}
              emptyText="Sin datos"
            />
          </AppCardContent>
        </AppCard>

        {/* Fuentes de Adquisición */}
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
            />
          </AppCardContent>
        </AppCard>
      </div>

      {/* 4 Columnas Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Actividad Reciente */}
        <AppCard 
          title="Actividad Reciente"
          icon={<LogOut />}
          description="Últimas conexiones"
          data-testid="card-recent-activity"
        >
          <AppCardContent>
            {loadingActivity ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.slice(0, 10).map((activity: any) => {
                  const isOnline = new Date(activity.last_seen_at).getTime() > Date.now() - 90000
                  return (
                    <div key={activity.user_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={activity.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{activity.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs truncate">{activity.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{formatViewName(activity.current_view)}</p>
                      </div>
                      {isOnline && <Badge variant="status-online" className="text-xs h-fit">Online</Badge>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
          </AppCardContent>
        </AppCard>

        {/* Usuarios Registrados */}
        <AppCard 
          title="Usuarios Registrados"
          icon={<UserPlus />}
          description="Nuevos registros"
          data-testid="card-recent-users"
        >
          <AppCardContent>
            {loadingUsers ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : recentUsers && recentUsers.length > 0 ? (
              <div className="space-y-2">
                {recentUsers.slice(0, 10).map((user: any, idx: number) => (
                  <div key={user.id || idx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate">{user.full_name || user.email}</p>
                      {user.organization_name && <p className="text-xs text-muted-foreground truncate">{user.organization_name}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(user.created_at), 'dd MMM', { locale: es })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
          </AppCardContent>
        </AppCard>

        {/* Top Usuarios Activos */}
        <AppCard 
          title="Top Usuarios Activos"
          icon={<Zap />}
          description="Mayor engagement"
          data-testid="card-top-users"
        >
          <AppCardContent>
            {loadingTopUsers ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : topUsersData && topUsersData.length > 0 ? (
              <div className="space-y-2">
                {topUsersData.slice(0, 10).map((user: any, idx: number) => (
                  <div key={user.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-success/5 hover:bg-success/10 transition-colors border border-success/20">
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
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
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
          </AppCardContent>
        </AppCard>

        {/* Drop Off Users */}
        <AppCard 
          title="Drop Off"
          icon={<Clock />}
          description="Baja actividad (1-2 sesiones)"
          data-testid="card-drop-off"
        >
          <AppCardContent>
            {loadingDropOff ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : dropOffData && dropOffData.length > 0 ? (
              <div className="space-y-2">
                {dropOffData.slice(0, 10).map((user: any) => (
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
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
          </AppCardContent>
        </AppCard>
      </div>
    </div>
  )
}
