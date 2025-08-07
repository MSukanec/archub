import { useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Building, Users, Crown, Activity } from 'lucide-react';
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
    showSearch: false,
    showFilters: false,
    actions: []
  };

  return (
    <Layout wide headerProps={headerProps}>
        {/* Estadísticas del sistema */}
              <div>
              </div>
            </div>
          </Card>

              <div>
              </div>
            </div>
          </Card>

              <div>
              </div>
            </div>
          </Card>

              <div>
              </div>
            </div>
          </Card>
        </div>

        {/* Gráfico de crecimiento de usuarios */}
        <UserGrowthChart />

        {/* Organizaciones recientes */}
        <Card>
          <CardHeader>
              Organizaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orgsLoading ? (
                Cargando organizaciones...
              </div>
            ) : recentOrganizations && recentOrganizations.length > 0 ? (
                {recentOrganizations.map((org) => (
                      </div>
                      <div>
                          Plan: {org.plan?.name || 'Sin plan'} • Creado por: {org.creator?.full_name || 'Usuario desconocido'}
                        </div>
                      </div>
                    </div>
                      {org.is_system && (
                          Sistema
                        </Badge>
                      )}
                        {org.created_at ? format(new Date(org.created_at), 'dd MMM, yyyy', { locale: es }) : 'Fecha no disponible'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}