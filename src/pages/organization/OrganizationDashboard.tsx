import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building, Users, DollarSign, Folder, Activity, Calendar, Crown, CheckCircle, StickyNote, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useCurrentUser } from '@/hooks/use-current-user';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function OrganizationDashboard() {
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const currentOrganization = userData?.organization;

  // Fetch recent projects
  const { data: recentProjects = [] } = useQuery({
    queryKey: ['recent-projects', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          created_at,
          project_data (
            project_types (
              name
            ),
            project_modalities (
              name
            )
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent projects:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!currentOrganization?.id
  });

  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['recent-activity', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const activities = [];

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
          title: 'Nuevo proyecto creado',
          description: `Se creó el proyecto "${project.name}"`,
          created_at: project.created_at
        });
      });

      // Get recent movements
      const { data: movements } = await supabase
        .from('movements')
        .select('id, description, amount, created_at')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(3);

      movements?.forEach(movement => {
        activities.push({
          type: 'movement',
          title: 'Movimiento financiero registrado',
          description: `${movement.description || 'Movimiento'}: $${movement.amount?.toLocaleString()}`,
          created_at: movement.created_at
        });
      });

      // Get recent contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, created_at')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(2);

      contacts?.forEach(contact => {
        activities.push({
          type: 'contact',
          title: 'Nuevo contacto agregado',
          description: `Se agregó a ${contact.first_name} ${contact.last_name}`,
          created_at: contact.created_at
        });
      });

      // Sort all activities by date
      return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
    },
    enabled: !!currentOrganization?.id
  });

  // Project selection mutation
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userData?.preferences?.id) throw new Error('No user preferences found');

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
    selectProjectMutation.mutate(projectId);
  };

  // Sort projects to put active project first
  const sortedProjects = [...recentProjects].sort((a, b) => {
    if (a.id === userData?.preferences?.last_project_id) return -1;
    if (b.id === userData?.preferences?.last_project_id) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleActivityClick = (activity: any) => {
    if (activity.type === 'project') {
      navigate('/organization/projects');
    } else if (activity.type === 'movement') {
      navigate('/finance/movements');
    } else if (activity.type === 'contact') {
      navigate('/organization/contacts');
    }
  };

  const headerProps = {
    title: "Resumen de la Organización",
    icon: <Building className="h-5 w-5" />,
    showSearch: false
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

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Organization Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {currentOrganization?.name || 'Organización'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Creada</p>
                  <p className="text-xs text-muted-foreground">
                    {currentOrganization?.created_at ? 
                      format(new Date(currentOrganization.created_at), 'dd MMM yyyy', { locale: es }) 
                      : '---'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Estado</p>
                  <p className="text-xs text-muted-foreground">
                    {currentOrganization?.is_active ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
              </div>

              {currentOrganization?.plan && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Crown className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Plan</p>
                    <p className="text-xs text-muted-foreground">
                      {currentOrganization.plan.name}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Proyectos</p>
                  <p className="text-xs text-muted-foreground">
                    {recentProjects.length} total
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Proyectos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedProjects.length > 0 ? (
                  sortedProjects.map((project) => (
                    <div 
                      key={project.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        project.id === userData?.preferences?.last_project_id ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : ''
                      }`}
                      onClick={() => handleProjectSelect(project.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <Folder className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{project.name}</p>
                            {project.id === userData?.preferences?.last_project_id && (
                              <Badge variant="default" className="text-xs">Activo</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(project.created_at), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status === 'active' ? 'Activo' : 
                         project.status === 'planning' ? 'Planificación' : 
                         project.status === 'completed' ? 'Completado' : 'En pausa'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Folder className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">No hay proyectos recientes.</p>
                    <p className="text-xs">Crea tu primer proyecto para comenzar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                      <StickyNote className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Reunión con cliente</p>
                      <p className="text-xs text-muted-foreground">Revisar especificaciones del proyecto Villa Marina</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <StickyNote className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Recordatorio</p>
                      <p className="text-xs text-muted-foreground">Actualizar presupuesto para el segundo trimestre</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(Date.now() - 86400000), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      <StickyNote className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Tarea completada</p>
                      <p className="text-xs text-muted-foreground">Entrega de documentación técnica finalizada</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(Date.now() - 172800000), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className={`p-2 rounded-lg ${activity.type === 'project' ? 'bg-blue-100 text-blue-600' : 
                                                          activity.type === 'movement' ? 'bg-green-100 text-green-600' :
                                                          activity.type === 'contact' ? 'bg-purple-100 text-purple-600' :
                                                          'bg-gray-100 text-gray-600'}`}>
                        {activity.type === 'project' ? <Folder className="h-4 w-4" /> :
                         activity.type === 'movement' ? <DollarSign className="h-4 w-4" /> :
                         activity.type === 'contact' ? <Users className="h-4 w-4" /> :
                         <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">No hay actividad reciente.</p>
                    <p className="text-xs">La actividad aparecerá aquí cuando empieces a trabajar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}