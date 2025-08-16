import { useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Building, Users, Crown, Activity, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigationStore } from '@/stores/navigationStore';
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext';
import { useMobile } from '@/hooks/use-mobile';
import { UserGrowthChart } from '@/components/charts/UserGrowthChart';

// Hook para obtener estadísticas del sistema
function useSystemStats() {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      // Obtener conteos de organizaciones, usuarios, proyectos
      const [orgsResult, usersResult, projectsResult, plansResult] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, is_active, is_system', { count: 'exact' }),
        supabase
          .from('users')
          .select('id', { count: 'exact' }),
        supabase
          .from('projects')
          .select('id, is_active', { count: 'exact' }),
        supabase
          .from('plans')
          .select('id, name', { count: 'exact' })
      ]);

      const organizations = orgsResult.data || [];
      const projects = projectsResult.data || [];

      return {
        totalOrganizations: orgsResult.count || 0,
        activeOrganizations: organizations.filter(org => org.is_active).length,
        systemOrganizations: organizations.filter(org => org.is_system).length,
        totalUsers: usersResult.count || 0,
        totalProjects: projectsResult.count || 0,
        activeProjects: projects.filter(project => project.is_active).length,
        totalPlans: plansResult.count || 0
      };
    }
  });
}

// Hook para obtener organizaciones recientes
function useRecentOrganizations() {
  return useQuery({
    queryKey: ['recent-organizations'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          created_at,
          is_active,
          is_system,
          created_by,
          plan:plans(name),
          creator:users!created_by(id, full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const { data: recentOrganizations, isLoading: orgsLoading } = useRecentOrganizations();
  const { setSidebarContext } = useNavigationStore();
  const { setShowActionBar } = useMobileActionBar();
  const isMobile = useMobile();

  // Set sidebar context and hide mobile action bar on dashboards
  useEffect(() => {
    setSidebarContext('admin');
    if (isMobile) {
      setShowActionBar(false);
    }
  }, [setSidebarContext, setShowActionBar, isMobile]);

  const headerProps = {
    title: "Resumen de Administración",
    icon: BarChart3,
    showSearch: false,
    showFilters: false,
    actions: []
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Estadísticas del sistema */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Organizaciones</p>
                <p className="text-lg font-semibold">{statsLoading ? '...' : stats?.totalOrganizations || 0}</p>
              </div>
              <Building className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Usuarios</p>
                <p className="text-lg font-semibold">{statsLoading ? '...' : stats?.totalUsers || 0}</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Proyectos</p>
                <p className="text-lg font-semibold">{statsLoading ? '...' : stats?.totalProjects || 0}</p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Planes</p>
                <p className="text-lg font-semibold">{statsLoading ? '...' : stats?.totalPlans || 0}</p>
              </div>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Gráfico de crecimiento de usuarios */}
        <UserGrowthChart />

        {/* Organizaciones recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organizaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orgsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando organizaciones...
              </div>
            ) : recentOrganizations && recentOrganizations.length > 0 ? (
              <div className="space-y-4">
                {recentOrganizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--accent-bg)] rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-[var(--accent)]" />
                      </div>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Plan: {org.plan?.name || 'Sin plan'} • Creado por: {org.creator?.full_name || 'Usuario desconocido'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {org.is_system && (
                        <Badge variant="secondary" className="text-xs">
                          Sistema
                        </Badge>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {org.created_at ? format(new Date(org.created_at), 'dd MMM, yyyy', { locale: es }) : 'Fecha no disponible'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No hay organizaciones recientes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}