import { useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity as ActivityIcon, Building, Eye } from 'lucide-react';
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/desktop/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';

export default function Activity() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const [, navigate] = useLocation();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  const organizationId = userData?.preferences?.last_organization_id;

  // Placeholder activities data - will be implemented with proper data later
  const activities: any[] = []
  const isLoading = false

  // Helper function for initials
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  // Handle activity click
  const handleActivityClick = (activity: any) => {
    console.log('Activity clicked:', activity);
    // Navigate to related sections based on activity type
    switch (activity.target_table) {
      case 'movements':
        navigate('/finances/dashboard');
        break;
      case 'site_logs':
        navigate('/construction/logs');
        break;
      case 'design_documents':
        navigate('/design/documentation');
        break;
      case 'contacts':
        navigate('/contacts');
        break;
      default:
        console.log('Activity details:', activity);
    }
  };

  const headerProps = {
    icon: ActivityIcon,
    title: 'Actividad de la Organización',
    subtitle: 'Registro de actividades y cambios en la organización',
    organizationId,
    showMembers: true
  };

  if (!organizationId) {
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

  // Table columns configuration
  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      width: '15%',
      render: (activity: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {activity.created_at ? format(new Date(activity.created_at), 'dd MMM yyyy', { locale: es }) : 'N/A'}
          </span>
          <span className="text-xs text-muted-foreground">
            {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { 
              addSuffix: true, 
              locale: es 
            }) : 'N/A'}
          </span>
        </div>
      ),
      sortable: true,
      sortType: 'date' as const
    },
    {
      key: 'author',
      label: 'Autor',
      width: '15%',
      render: (activity: any) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={activity.author?.avatar_url} />
            <AvatarFallback className="text-xs">
              {getInitials(activity.author?.full_name || 'Usuario')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {activity.author?.full_name || 'Usuario'}
          </span>
        </div>
      ),
      sortable: true,
      sortType: 'string' as const
    },
    {
      key: 'type_label',
      label: 'Tipo',
      width: '15%',
      render: (activity: any) => (
        <Badge variant="outline" className="text-xs">
          {activity.type_label}
        </Badge>
      ),
      sortable: true,
      sortType: 'string' as const
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (activity: any) => (
        <span className="text-sm text-muted-foreground">
          {activity.description}
        </span>
      ),
      sortable: true,
      sortType: 'string' as const
    }
  ];

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Activity Chart and Table */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <ActivityIcon className="h-12 w-12 mx-auto mb-4 opacity-20 animate-pulse" />
            <p className="text-sm">Cargando actividades...</p>
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={<ActivityIcon className="w-12 h-12" />}
            title="No hay actividades registradas"
            description="Cuando se realicen acciones en la organización, aparecerán aquí."
          />
        ) : (
          <Table
            data={activities}
            columns={columns}
            rowActions={(activity) => [
              {
                icon: Eye,
                label: 'Ver detalles',
                onClick: () => handleActivityClick(activity)
              }
            ]}
          />
        )}
      </div>
    </Layout>
  );
}