import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui/stat-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, Users, Clock, TrendingUp, Activity, Eye } from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Tabs } from '@/components/ui-custom/Tabs'
import { startOfDay, subDays } from 'date-fns'

type DateRange = 'today' | '7days' | '30days'

/**
 * Mapea nombres técnicos de vistas a nombres legibles en español
 */
function formatViewName(view: string | null): string {
  if (!view) return 'Sin ubicación';
  
  const viewMap: Record<string, string> = {
    'home': 'Inicio',
    'organization_dashboard': 'Dashboard Organización',
    'organization_projects': 'Proyectos',
    'organization_preferences': 'Preferencias',
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
    'admin_administration': 'Admin - Administración',
    'admin_support': 'Admin - Soporte',
    'admin_payments': 'Admin - Pagos',
    'admin_courses': 'Admin - Cursos',
    'admin_costs': 'Admin - Costos',
    'admin_tasks': 'Admin - Tareas',
    'admin_general': 'Admin - General',
    'admin_layout': 'Admin - Layout',
    'admin': 'Administración',
    'provider_products': 'Productos',
    'notifications': 'Notificaciones',
    'calendar': 'Calendario',
    'media': 'Archivos',
    'clients': 'Clientes',
    'profile': 'Perfil',
    'pricing': 'Planes',
  };
  
  return viewMap[view] || view.replace(/_/g, ' ');
}

/**
 * Formatea duración en segundos a formato legible "2h 34m" o "5m 23s"
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
}

/**
 * Formatea duración para tabla (formato hh:mm)
 */
function formatDurationHHMM(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  
  // Calcular fechas según el rango seleccionado
  const getStartDate = (range: DateRange): Date => {
    const now = new Date();
    switch (range) {
      case 'today':
        return startOfDay(now);
      case '7days':
        return subDays(now, 7);
      case '30days':
        return subDays(now, 30);
      default:
        return subDays(now, 7);
    }
  };

  // 1. KPI Cards - Métricas principales
  const { data: kpiData, isLoading: loadingKPI } = useQuery({
    queryKey: ['admin-analytics-kpi', dateRange],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');
      
      const startDate = getStartDate(dateRange);
      const ninetySecondsAgo = new Date(Date.now() - 90000);
      const todayStart = startOfDay(new Date());
      
      const [
        activeUsersResult,
        totalUsersResult,
        sessionsResult,
        avgDurationResult
      ] = await Promise.all([
        // Usuarios activos ahora
        supabase
          .from('user_presence')
          .select('user_id')
          .gte('last_seen_at', ninetySecondsAgo.toISOString()),
        
        // Total usuarios registrados
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true }),
        
        // Total de sesiones hoy
        supabase
          .from('user_view_history')
          .select('*', { count: 'exact', head: true })
          .gte('entered_at', todayStart.toISOString()),
        
        // Duración promedio de sesiones hoy
        supabase
          .from('user_view_history')
          .select('duration_seconds')
          .gte('entered_at', todayStart.toISOString())
          .not('duration_seconds', 'is', null)
      ]);
      
      const uniqueActiveUsers = new Set(activeUsersResult.data?.map(u => u.user_id) || []);
      const avgDuration = avgDurationResult.data && avgDurationResult.data.length > 0
        ? avgDurationResult.data.reduce((sum, row) => sum + (row.duration_seconds || 0), 0) / avgDurationResult.data.length
        : 0;
      
      return {
        activeUsersNow: uniqueActiveUsers.size,
        totalUsers: totalUsersResult.count || 0,
        sessionsToday: sessionsResult.count || 0,
        avgSessionDuration: avgDuration
      };
    },
    enabled: !!supabase,
    refetchInterval: 30000 // Auto-refresh cada 30 segundos
  });

  // 2. Engagement por Vista
  const { data: engagementData, isLoading: loadingEngagement } = useQuery({
    queryKey: ['admin-analytics-engagement', dateRange],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');
      
      const startDate = getStartDate(dateRange);
      
      const { data, error } = await supabase
        .from('user_view_history')
        .select('view_name, duration_seconds')
        .gte('entered_at', startDate.toISOString())
        .not('duration_seconds', 'is', null);
      
      if (error) throw error;
      
      // Agrupar y calcular promedio
      const grouped = (data || []).reduce((acc: any, row) => {
        if (!acc[row.view_name]) {
          acc[row.view_name] = { total: 0, count: 0 };
        }
        acc[row.view_name].total += row.duration_seconds || 0;
        acc[row.view_name].count += 1;
        return acc;
      }, {});
      
      return Object.entries(grouped)
        .map(([view, stats]: [string, any]) => ({
          view: formatViewName(view),
          avgSeconds: stats.total / stats.count,
          avgMinutes: (stats.total / stats.count) / 60,
          sessions: stats.count
        }))
        .sort((a, b) => b.avgSeconds - a.avgSeconds)
        .slice(0, 10); // Top 10
    },
    enabled: !!supabase
  });

  // 3. Top Usuarios Activos
  const { data: topUsersData, isLoading: loadingTopUsers } = useQuery({
    queryKey: ['admin-analytics-top-users', dateRange],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');
      
      const startDate = getStartDate(dateRange);
      
      const { data, error } = await supabase
        .from('user_view_history')
        .select(`
          user_id,
          view_name,
          duration_seconds,
          users!inner(full_name, avatar_url)
        `)
        .gte('entered_at', startDate.toISOString())
        .not('duration_seconds', 'is', null);
      
      if (error) throw error;
      
      // Agrupar por usuario
      const userMap = new Map<string, any>();
      
      (data || []).forEach((row: any) => {
        const userId = row.user_id;
        
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            full_name: row.users?.full_name || 'Usuario',
            avatar_url: row.users?.avatar_url,
            total_seconds: 0,
            views_visited: new Set()
          });
        }
        
        const user = userMap.get(userId)!;
        user.total_seconds += row.duration_seconds || 0;
        user.views_visited.add(row.view_name);
      });
      
      // Convertir a array y ordenar
      return Array.from(userMap.values())
        .map(user => ({
          ...user,
          views_count: user.views_visited.size,
          views_visited: undefined // Remover el Set
        }))
        .sort((a, b) => b.total_seconds - a.total_seconds)
        .slice(0, 10);
    },
    enabled: !!supabase
  });

  // 4. Drop-off Analysis - Última vista de cada sesión
  const { data: dropoffData, isLoading: loadingDropoff } = useQuery({
    queryKey: ['admin-analytics-dropoff', dateRange],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');
      
      const startDate = getStartDate(dateRange);
      
      const { data, error } = await supabase
        .from('user_view_history')
        .select('user_id, view_name, entered_at, exited_at')
        .gte('entered_at', startDate.toISOString())
        .order('user_id')
        .order('entered_at', { ascending: false });
      
      if (error) throw error;
      
      // Agrupar por usuario y tomar la última vista de cada uno
      const lastViewPerUser = new Map<string, string>();
      
      (data || []).forEach((row: any) => {
        const userId = row.user_id;
        if (!lastViewPerUser.has(userId)) {
          lastViewPerUser.set(userId, row.view_name);
        }
      });
      
      // Contar por view_name
      const dropoffCounts = new Map<string, number>();
      
      lastViewPerUser.forEach(viewName => {
        dropoffCounts.set(viewName, (dropoffCounts.get(viewName) || 0) + 1);
      });
      
      // Convertir a array y ordenar
      return Array.from(dropoffCounts.entries())
        .map(([view, count]) => ({
          view: formatViewName(view),
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
    enabled: !!supabase
  });

  // 5. Actividad por Hora del Día
  const { data: hourlyData, isLoading: loadingHourly } = useQuery({
    queryKey: ['admin-analytics-hourly', dateRange],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');
      
      const startDate = getStartDate(dateRange);
      
      const { data, error } = await supabase
        .from('user_view_history')
        .select('entered_at')
        .gte('entered_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Agrupar por hora
      const hourlyCounts = new Array(24).fill(0);
      
      (data || []).forEach((row: any) => {
        const hour = new Date(row.entered_at).getHours();
        hourlyCounts[hour]++;
      });
      
      return hourlyCounts.map((count, hour) => ({
        hour,
        hourLabel: `${hour.toString().padStart(2, '0')}:00`,
        sessions: count
      }));
    },
    enabled: !!supabase
  });

  const headerProps = {
    title: "Analytics Dashboard",
    icon: BarChart3,
    description: "Métricas de uso y comportamiento de usuarios",
    showSearch: false,
    showFilters: false,
  };

  const dateRangeTabs = [
    { value: 'today', label: 'Hoy' },
    { value: '7days', label: '7 días' },
    { value: '30days', label: '30 días' },
  ];

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Filtros de fecha usando Tabs */}
        <div data-testid="date-range-filters">
          <Tabs 
            tabs={dateRangeTabs}
            value={dateRange}
            onValueChange={(value) => setDateRange(value as DateRange)}
          />
        </div>

        {/* KPI Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingKPI ? (
            <>
              <Skeleton className="h-32" data-testid="skeleton-kpi-1" />
              <Skeleton className="h-32" data-testid="skeleton-kpi-2" />
              <Skeleton className="h-32" data-testid="skeleton-kpi-3" />
              <Skeleton className="h-32" data-testid="skeleton-kpi-4" />
            </>
          ) : (
            <>
              <StatCard data-testid="card-active-users">
                <StatCardTitle showArrow={false}>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>Usuarios Activos Ahora</span>
                  </div>
                </StatCardTitle>
                <StatCardValue className="text-[var(--accent)]">
                  {kpiData?.activeUsersNow || 0}
                </StatCardValue>
                <StatCardMeta>En los últimos 90 segundos</StatCardMeta>
              </StatCard>

              <StatCard data-testid="card-sessions-today">
                <StatCardTitle showArrow={false}>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Sesiones Hoy</span>
                  </div>
                </StatCardTitle>
                <StatCardValue>
                  {kpiData?.sessionsToday || 0}
                </StatCardValue>
                <StatCardMeta>Total de vistas iniciadas</StatCardMeta>
              </StatCard>

              <StatCard data-testid="card-avg-session">
                <StatCardTitle showArrow={false}>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Tiempo Promedio</span>
                  </div>
                </StatCardTitle>
                <StatCardValue>
                  {formatDuration(kpiData?.avgSessionDuration || 0)}
                </StatCardValue>
                <StatCardMeta>Por sesión hoy</StatCardMeta>
              </StatCard>

              <StatCard data-testid="card-total-users">
                <StatCardTitle showArrow={false}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Usuarios Registrados</span>
                  </div>
                </StatCardTitle>
                <StatCardValue>
                  {kpiData?.totalUsers || 0}
                </StatCardValue>
                <StatCardMeta>Total en la plataforma</StatCardMeta>
              </StatCard>
            </>
          )}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement por Vista */}
          <Card data-testid="card-engagement">
            <CardHeader>
              <CardTitle>Engagement por Vista</CardTitle>
              <CardDescription>
                Tiempo promedio en cada sección (últimos {dateRange === 'today' ? 'hoy' : dateRange === '7days' ? '7 días' : '30 días'})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEngagement ? (
                <Skeleton className="h-[300px]" data-testid="skeleton-engagement" />
              ) : engagementData && engagementData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="view" 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: any) => formatDuration(value * 60)}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="avgMinutes" radius={[0, 4, 4, 0]}>
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="hsl(var(--accent))" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No hay datos de engagement para este período
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actividad por Hora */}
          <Card data-testid="card-hourly-activity">
            <CardHeader>
              <CardTitle>Actividad por Hora del Día</CardTitle>
              <CardDescription>
                Sesiones iniciadas por hora
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHourly ? (
                <Skeleton className="h-[300px]" data-testid="skeleton-hourly" />
              ) : hourlyData && hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="hourLabel" 
                      tick={{ fontSize: 12 }}
                      interval={2}
                    />
                    <YAxis />
                    <Tooltip 
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sessions" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--accent))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No hay datos de actividad horaria
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second row of cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Usuarios Activos */}
          <Card data-testid="card-top-users">
            <CardHeader>
              <CardTitle>Top Usuarios Activos</CardTitle>
              <CardDescription>
                Usuarios con mayor tiempo de uso
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTopUsers ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" data-testid={`skeleton-top-user-${i}`} />
                  ))}
                </div>
              ) : topUsersData && topUsersData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead className="text-right">Tiempo Total</TableHead>
                      <TableHead className="text-right">Vistas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUsersData.map((user, index) => (
                      <TableRow key={user.user_id} data-testid={`row-top-user-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {user.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatDurationHHMM(user.total_seconds)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {user.views_count}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No hay datos de usuarios activos
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drop-off Analysis */}
          <Card data-testid="card-dropoff">
            <CardHeader>
              <CardTitle>Drop-off Analysis</CardTitle>
              <CardDescription>
                Vistas donde los usuarios terminan sus sesiones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDropoff ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" data-testid={`skeleton-dropoff-${i}`} />
                  ))}
                </div>
              ) : dropoffData && dropoffData.length > 0 ? (
                <div className="space-y-2">
                  {dropoffData.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                      data-testid={`dropoff-item-${index}`}
                    >
                      <span className="font-medium">{item.view}</span>
                      <Badge variant="outline" className="ml-2">
                        {item.count} sesiones
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No hay datos de drop-off
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
