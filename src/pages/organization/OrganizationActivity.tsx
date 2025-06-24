import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Folder, DollarSign, Users, FileText, Building } from 'lucide-react';
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useCurrentUser } from '@/hooks/use-current-user';
import { supabase } from '@/lib/supabase';

export default function OrganizationActivity() {
  const { data: userData } = useCurrentUser();
  const [, navigate] = useLocation();
  const currentOrganization = userData?.organization;

  // Fetch all organization activity
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['organization-activity', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const allActivities = [];

      // Get projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, created_at, status')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      projects?.forEach(project => {
        allActivities.push({
          type: 'project',
          title: 'Nuevo proyecto creado',
          description: `Se creó el proyecto "${project.name}"`,
          created_at: project.created_at,
          status: project.status,
          clickAction: () => navigate('/organization/projects')
        });
      });

      // Get movements
      const { data: movements } = await supabase
        .from('movements')
        .select('id, description, amount, created_at, currency_id')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      movements?.forEach(movement => {
        allActivities.push({
          type: 'movement',
          title: 'Movimiento financiero registrado',
          description: `${movement.description || 'Movimiento'}: $${movement.amount?.toLocaleString()}`,
          created_at: movement.created_at,
          amount: movement.amount,
          clickAction: () => navigate('/finance/movements')
        });
      });

      // Get contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, created_at, company_name')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      contacts?.forEach(contact => {
        allActivities.push({
          type: 'contact',
          title: 'Nuevo contacto agregado',
          description: `Se agregó a ${contact.first_name} ${contact.last_name}${contact.company_name ? ` de ${contact.company_name}` : ''}`,
          created_at: contact.created_at,
          clickAction: () => navigate('/organization/contacts')
        });
      });

      // Get site logs
      const { data: siteLogs } = await supabase
        .from('site_logs')
        .select('id, entry_type, weather, comments, created_at')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      siteLogs?.forEach(log => {
        allActivities.push({
          type: 'site_log',
          title: 'Nueva entrada de bitácora',
          description: `Entrada ${log.entry_type} - ${log.weather}`,
          created_at: log.created_at,
          clickAction: () => navigate('/construction/site-logs')
        });
      });

      // Sort all activities by date
      return allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!currentOrganization?.id
  });

  const handleActivityClick = (activity: any) => {
    if (activity.clickAction) {
      activity.clickAction();
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project': return <Folder className="h-4 w-4" />;
      case 'movement': return <DollarSign className="h-4 w-4" />;
      case 'contact': return <Users className="h-4 w-4" />;
      case 'site_log': return <FileText className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-600';
      case 'movement': return 'bg-green-100 text-green-600';
      case 'contact': return 'bg-purple-100 text-purple-600';
      case 'site_log': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getActivityBadge = (activity: any) => {
    if (activity.type === 'project') {
      return (
        <Badge variant={activity.status === 'active' ? 'default' : 'secondary'}>
          {activity.status === 'active' ? 'Activo' : 
           activity.status === 'planning' ? 'Planificación' : 
           activity.status === 'completed' ? 'Completado' : 'En pausa'}
        </Badge>
      );
    }
    if (activity.type === 'movement' && activity.amount) {
      return (
        <Badge variant={activity.amount > 0 ? 'default' : 'destructive'}>
          {activity.amount > 0 ? 'Ingreso' : 'Egreso'}
        </Badge>
      );
    }
    return null;
  };

  const headerProps = {
    title: "Actividad",
    icon: <Activity className="h-5 w-5" />,
    showSearch: true,
    searchPlaceholder: "Buscar en actividad...",
    searchValue: "",
    onSearchChange: () => {},
    onSearchClear: () => {}
  };

  if (!currentOrganization) {
    return (
      <Layout headerProps={headerProps}>
        <div className="text-center py-12 text-muted-foreground">
          <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">No hay organización seleccionada.</p>
          <p className="text-xs">Selecciona una organización para ver la actividad.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-20 animate-spin" />
            <p className="text-sm">Cargando actividad...</p>
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity, index) => (
            <Card 
              key={index}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleActivityClick(activity)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{activity.title}</h3>
                      <div className="flex items-center gap-2">
                        {getActivityBadge(activity)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Hace {format(new Date(activity.created_at), 'dd/MM/yyyy', { locale: es })}
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        Ver detalles →
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No hay actividad registrada.</p>
            <p className="text-xs">La actividad aparecerá aquí cuando empieces a trabajar en la organización.</p>
          </div>
        )}
    </Layout>
  );
}