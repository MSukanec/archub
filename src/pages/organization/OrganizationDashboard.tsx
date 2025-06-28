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
  Plus,
  FileText,
  Construction,
  Zap,
  ExternalLink
} from 'lucide-react';
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';

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
}

export default function OrganizationDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  
  const currentOrganization = userData?.organization;

  // Fetch recent projects
  const { data: recentProjects = [] } = useQuery({
    queryKey: ['recent-projects', currentOrganization?.id],
    queryFn: async () => {
      if (!supabase || !currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id
  });

  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['recent-activity', currentOrganization?.id],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!supabase || !currentOrganization?.id) return [];
      
      const activities: ActivityItem[] = [];

      // Get recent projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(3);

      projects?.forEach(project => {
        activities.push({
          type: 'project',
          icon: Folder,
          title: 'Nuevo proyecto creado',
          description: project.name,
          author: 'Sistema',
          created_at: project.created_at
        });
      });

      // Get recent contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, created_at')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(3);

      contacts?.forEach(contact => {
        activities.push({
          type: 'contact',
          icon: Users,
          title: 'Nuevo contacto agregado',
          description: `${contact.first_name} ${contact.last_name}`,
          author: 'Sistema',
          created_at: contact.created_at
        });
      });

      return activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);
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
    title: "Resumen de la Organización",
    showSearch: false,
    showFilters: false
  };

  if (!currentOrganization) {
    return (
      <>
        <Layout headerProps={headerProps} wide>
          <div className="h-0" />
        </Layout>
        <CustomEmptyState
          fullScreen={true}
          icon={<Building />}
          title="No hay organización seleccionada"
          description="Selecciona una organización desde el menú superior para ver el resumen completo de la organización"
        />
      </>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Organization Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <Building className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">
                      {currentOrganization.name}
                    </CardTitle>
                    {currentOrganization.is_active && (
                      <Badge variant="default">Activa</Badge>
                    )}
                    {currentOrganization.plan && (
                      <Badge variant="outline">
                        <Crown className="h-3 w-3 mr-1" />
                        {currentOrganization.plan.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Fundada el {currentOrganization.created_at ? 
                        format(new Date(currentOrganization.created_at), 'dd/MM/yyyy', { locale: es }) 
                        : '---'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Proyectos Recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Proyectos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center border-2 border-[var(--accent)]/20">
                      <Folder className="h-8 w-8 text-[var(--accent)]" />
                    </div>
                    <div className="absolute inset-0 w-16 h-16 mx-auto bg-[var(--accent)]/10 rounded-full blur-lg animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
                  <p className="text-sm text-muted-foreground mb-6">Crea tu primer proyecto para comenzar a gestionar tu trabajo</p>
                  <Button onClick={() => navigate('/proyectos')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Proyecto
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentProjects.map((project) => (
                    <div 
                      key={project.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleProjectSelect(project.id)}
                    >
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(project.created_at), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/proyectos')}
                  >
                    Ver todos los proyectos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actividad Reciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center border-2 border-[var(--accent)]/20">
                      <Activity className="h-8 w-8 text-[var(--accent)]" />
                    </div>
                    <div className="absolute inset-0 w-16 h-16 mx-auto bg-[var(--accent)]/10 rounded-full blur-lg animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay actividad</h3>
                  <p className="text-sm text-muted-foreground">La actividad aparecerá aquí cuando comiences a trabajar en proyectos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="p-2 rounded-lg bg-muted">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(activity.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/proyectos')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nuevo Proyecto
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/organization/contactos')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Gestionar Contactos
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/finanzas/movimientos')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Ver Movimientos
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/obra/bitacora')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Bitácora de Obra
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/construction/budgets')}
                >
                  <Construction className="h-4 w-4 mr-2" />
                  Gestionar Presupuestos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}