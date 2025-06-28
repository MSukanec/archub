import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Building, 
  Users, 
  DollarSign, 
  Folder, 
  Activity, 
  Calendar, 
  Crown, 
  CheckCircle, 
  StickyNote, 
  ExternalLink, 
  ArrowRight, 
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  Settings,
  BarChart3,
  Briefcase,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  AlertCircle,
  FileText,
  Construction,
  Zap
} from 'lucide-react';
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { NewOrganizationModal } from '@/modals/NewOrganizationModal';

import { useCurrentUser } from '@/hooks/use-current-user';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useNavigationStore } from '@/stores/navigationStore';

interface ActivityItem {
  type: string;
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  author: string;
  created_at: string;
  color: 'blue' | 'green' | 'red' | 'purple';
}

export default function OrganizationDashboard() {
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { setSidebarContext } = useNavigationStore();
  const currentOrganization = userData?.organization;
  const [showNewOrganizationModal, setShowNewOrganizationModal] = useState(false);

  // Fetch comprehensive organization statistics
  const { data: orgStats } = useQuery({
    queryKey: ['organization-stats', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id || !supabase) return null;

      // Get projects count and status breakdown
      const { data: projects, count: projectsCount } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          created_at,
          project_data (
            project_types (name),
            project_modalities (name)
          )
        `, { count: 'exact' })
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      // Get movements summary
      const { data: movements } = await supabase
        .from('movements')
        .select('amount, created_at')
        .eq('organization_id', currentOrganization.id);

      // Get contacts count
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id);

      // Get budgets count
      const { count: budgetsCount } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id);

      // Get site logs count
      const { count: siteLogsCount } = await supabase
        .from('site_logs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id);

      // Calculate financial metrics
      const totalIncome = movements?.filter(m => m.amount > 0).reduce((sum, m) => sum + m.amount, 0) || 0;
      const totalExpenses = movements?.filter(m => m.amount < 0).reduce((sum, m) => sum + Math.abs(m.amount), 0) || 0;
      const netBalance = totalIncome - totalExpenses;

      // Project status breakdown
      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const planningProjects = projects?.filter(p => p.status === 'planning').length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;

      return {
        projectsCount: projectsCount || 0,
        activeProjects,
        planningProjects,
        completedProjects,
        contactsCount: contactsCount || 0,
        budgetsCount: budgetsCount || 0,
        siteLogsCount: siteLogsCount || 0,
        totalIncome,
        totalExpenses,
        netBalance,
        recentProjects: projects?.slice(0, 5) || [],
        movementsCount: movements?.length || 0
      };
    },
    enabled: !!currentOrganization?.id
  });

  // Fetch recent activity with proper typing
  const { data: recentActivity = [] } = useQuery<ActivityItem[]>({
    queryKey: ['recent-activity', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id || !supabase) return [];

      const activities: ActivityItem[] = [];

      // Get recent projects
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id, 
          name, 
          created_at
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(3);

      projects?.forEach(project => {
        activities.push({
          type: 'project',
          icon: Folder,
          title: 'Nuevo proyecto creado',
          description: `Se creó el proyecto "${project.name}"`,
          author: 'Usuario',
          created_at: project.created_at,
          color: 'blue'
        });
      });

      // Get recent movements
      const { data: movements } = await supabase
        .from('movements')
        .select(`
          id, 
          description, 
          amount, 
          created_at
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(3);

      movements?.forEach(movement => {
        activities.push({
          type: 'movement',
          icon: DollarSign,
          title: movement.amount > 0 ? 'Ingreso registrado' : 'Gasto registrado',
          description: `${movement.description || 'Movimiento'}: $${Math.abs(movement.amount)?.toLocaleString()}`,
          author: 'Usuario',
          created_at: movement.created_at,
          color: movement.amount > 0 ? 'green' : 'red'
        });
      });

      // Get recent contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select(`
          id, 
          first_name, 
          last_name, 
          created_at
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(2);

      contacts?.forEach(contact => {
        activities.push({
          type: 'contact',
          icon: Users,
          title: 'Nuevo contacto agregado',
          description: `Se agregó a ${contact.first_name} ${contact.last_name}`,
          author: 'Usuario',
          created_at: contact.created_at,
          color: 'purple'
        });
      });

      // Sort all activities by date
      return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);
    },
    enabled: !!currentOrganization?.id
  });

  // Project selection mutation
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userData?.preferences?.id || !supabase) throw new Error('No user preferences found');

      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('id', userData.preferences.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast({
        title: "Proyecto seleccionado",
        description: "El proyecto ha sido seleccionado correctamente"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo seleccionar el proyecto",
        variant: "destructive"
      });
    }
  });

  const handleProjectSelect = (projectId: string) => {
    selectProjectMutation.mutate(projectId, {
      onSuccess: () => {
        setSidebarContext('project');
        navigate('/project/dashboard');
      }
    });
  };

  const headerProps = {
    title: "Dashboard de la Organización",
    showSearch: false,
    showFilters: false
  };

  if (!currentOrganization) {
    return (
      <Layout headerProps={headerProps}>
        <div className="text-center py-12 text-muted-foreground">
          <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">No hay organización seleccionada.</p>
          <p className="text-xs">Selecciona una organización para ver el dashboard.</p>
        </div>
      </Layout>
    );
  }

  // Calculate organization health score
  const healthScore = Math.min(
    ((orgStats?.activeProjects || 0) * 20) + 
    ((orgStats?.contactsCount || 0) * 2) + 
    ((orgStats?.siteLogsCount || 0) * 1) +
    ((orgStats?.netBalance || 0) > 0 ? 30 : 0),
    100
  );

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'
  };

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Organization Header */}
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-950/20 dark:via-blue-950/20 dark:to-cyan-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
                <Building className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {currentOrganization?.name || 'Organización'}
                  </h1>
                  {currentOrganization?.is_active && (
                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Activa
                    </Badge>
                  )}
                  {currentOrganization?.plan && (
                    <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300">
                      <Crown className="h-3 w-3 mr-1" />
                      {currentOrganization.plan.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fundada el {currentOrganization?.created_at ? 
                      format(new Date(currentOrganization.created_at), 'dd/MM/yyyy', { locale: es }) 
                      : '---'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    {orgStats?.projectsCount || 0} proyectos
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {orgStats?.contactsCount || 0} contactos
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {healthScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Salud Organizacional</div>
              <Progress value={healthScore} className="w-32" />
            </div>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                Ingresos Totales
              </CardTitle>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                ${orgStats?.totalIncome?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                Flujo positivo
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 border-rose-200 dark:border-rose-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-200">
                Gastos Totales
              </CardTitle>
              <div className="p-2 bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 rounded-lg">
                <TrendingDown className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                ${orgStats?.totalExpenses?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                <TrendingDown className="h-3 w-3" />
                {orgStats?.movementsCount || 0} movimientos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Balance Neto
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg">
                <Target className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(orgStats?.netBalance || 0) >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                ${orgStats?.netBalance?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                <Target className="h-3 w-3" />
                {(orgStats?.netBalance || 0) >= 0 ? 'Positivo' : 'Negativo'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-violet-800 dark:text-violet-200">
                Proyectos Activos
              </CardTitle>
              <div className="p-2 bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 rounded-lg">
                <Zap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-900 dark:text-violet-100">
                {orgStats?.activeProjects || 0}
              </div>
              <p className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1 mt-1">
                <Folder className="h-3 w-3" />
                de {orgStats?.projectsCount || 0} totales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>
                Accede rápidamente a las funciones principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  onClick={() => navigate('/organization/projects')}
                >
                  <Folder className="h-6 w-6 text-blue-500" />
                  <span className="text-sm">Proyectos</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:bg-green-50 dark:hover:bg-green-950/20"
                  onClick={() => {
                    setSidebarContext('organization')
                    navigate('/finance/movements')
                  }}
                >
                  <DollarSign className="h-6 w-6 text-green-500" />
                  <span className="text-sm">Finanzas</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                  onClick={() => navigate('/organization/contacts')}
                >
                  <Users className="h-6 w-6 text-purple-500" />
                  <span className="text-sm">Contactos</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                  onClick={() => {
                    setSidebarContext('organization')
                    navigate('/construction/logs')
                  }}
                >
                  <Construction className="h-6 w-6 text-orange-500" />
                  <span className="text-sm">Obra</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Actividad Reciente
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/organization/projects')}
                >
                  Ver todo
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => {
                    const IconComponent = activity.icon;

                    return (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className={`p-2 rounded-lg ${colorClasses[activity.color]}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">
                              {activity.title}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(activity.created_at), 'dd/MM', { locale: es })}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Por {activity.author}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">No hay actividad reciente</p>
                    <p className="text-xs">Las acciones aparecerán aquí</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Proyectos Recientes
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/organization/projects')}
              >
                Ver todos
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orgStats?.recentProjects && orgStats.recentProjects.length > 0 ? (
                orgStats.recentProjects.map((project: any) => (
                  <div 
                    key={project.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-all ${
                      project.id === userData?.preferences?.last_project_id ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] bg-accent/20' : ''
                    }`}
                    onClick={() => handleProjectSelect(project.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 text-blue-600 dark:text-blue-300 rounded-lg">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{project.name}</p>
                          {project.id === userData?.preferences?.last_project_id && (
                            <Badge variant="default" className="text-xs">Activo</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(project.created_at), 'dd MMM yyyy', { locale: es })}
                          </span>
                          {project.project_data?.project_types?.name && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {project.project_data.project_types.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status === 'active' ? 'Activo' : 
                         project.status === 'planning' ? 'Planificación' : 
                         project.status === 'completed' ? 'Completado' : 'En pausa'}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Folder className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-2">No hay proyectos aún</p>
                  <p className="text-sm mb-4">Crea tu primer proyecto para comenzar a gestionar tu organización</p>
                  <Button 
                    onClick={() => navigate('/organization/projects')}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Primer Proyecto
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <NewOrganizationModal 
        open={showNewOrganizationModal}
        onClose={() => setShowNewOrganizationModal(false)}
      />
    </Layout>
  );
}