import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Building, Eye, Search, Filter, X } from 'lucide-react';
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/desktop/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table } from '@/components/ui-custom/Table';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { ActionBarDesktopRow } from '@/components/layout/desktop/ActionBarDesktopRow';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function OrganizationActivity() {
  const { data: userData } = useCurrentUser();
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState('date_recent');
  const [filterByType, setFilterByType] = useState('all');
  const organizationId = userData?.preferences?.last_organization_id;

  // Placeholder activities data - will be implemented with proper data later
  const activities: any[] = []
  const isLoading = false

  // Filter and sort activities
  const filteredActivities = activities.filter(activity => {
    // Filter by type
    if (filterByType !== 'all') {
      return activity.type === filterByType;
    }
    
    return true;
  });

  // Sort activities
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    switch (sortBy) {
      case 'date_recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date_old':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'author':
        return (a.author?.full_name || '').localeCompare(b.author?.full_name || '');
      case 'type':
        return a.type_label.localeCompare(b.type_label);
      default:
        return 0;
    }
  });

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
        navigate('/finances/movements');
        break;
      case 'site_logs':
        navigate('/construction/logs');
        break;
      case 'design_documents':
        navigate('/design/documentation');
        break;
      case 'contacts':
        navigate('/organization/contacts');
        break;
      default:
        console.log('Activity details:', activity);
    }
  };

  const clearFilters = () => {
    setSortBy('date_recent');
    setFilterByType('all');
  };

  // Configuración de filtros para ActionBarDesktopRow
  const filters = [
    {
      key: 'sortBy',
      label: 'Ordenar por',
      icon: Filter,
      value: sortBy,
      setValue: setSortBy,
      options: ['date_recent', 'date_old', 'type', 'author'],
      defaultLabel: 'Fecha (Más reciente)',
      enabled: true
    },
    {
      key: 'filterByType',
      label: 'Filtrar por tipo',
      icon: Activity,
      value: filterByType,
      setValue: setFilterByType,
      options: ['all', 'create', 'update', 'delete'],
      defaultLabel: 'Todos los tipos',
      enabled: true
    }
  ];

  // Configuración de acciones para ActionBarDesktopRow
  const actions = [
    {
      label: 'Limpiar filtros',
      icon: X,
      onClick: clearFilters,
      variant: 'outline' as const,
      enabled: sortBy !== 'date_recent' || filterByType !== 'all'
    }
  ];

  if (!organizationId) {
    return (
      <Layout>
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
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (activity: any) => (
        <Button 
          size="sm" 
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleActivityClick(activity);
          }}
          className="h-8 px-2 text-xs"
        >
          <Eye className="w-3 h-3 mr-1" />
          Ver detalles
        </Button>
      ),
      sortable: false
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* ActionBar Desktop Row */}
        <ActionBarDesktopRow
          filters={filters}
          actions={actions}
        />

        {/* Feature Introduction - Mobile only */}
        <div className="md:hidden">
          <FeatureIntroduction
            title="Actividad"
            icon={<Activity className="w-5 h-5" />}
            features={[
              {
                icon: <Building className="w-5 h-5" />,
                title: "Registro central de actividades",
                description: "En esta sección quedan asentadas todas las acciones importantes que realiza la organización, permitiendo dar seguimiento a cada cosa que sucede. Desde la creación de proyectos hasta movimientos financieros, todo queda registrado para mantener un historial completo."
              },
              {
                icon: <Activity className="w-5 h-5" />,
                title: "Filtrado por miembro",
                description: "Las acciones están organizadas y filtradas por miembro de la organización, de manera tal que se puede saber exactamente quién hizo cada cosa. Esto permite identificar responsabilidades, reconocer contribuciones y mantener la trazabilidad de las decisiones tomadas."
              }
            ]}
          />
        </div>

        {/* Activity Chart and Table */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-20 animate-pulse" />
            <p className="text-sm">Cargando actividades...</p>
          </div>
        ) : sortedActivities.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-12 h-12" />}
            title="No hay actividades registradas"
            description="Cuando se realicen acciones en la organización, aparecerán aquí."
          />
        ) : (
          <Table
            data={sortedActivities}
            columns={columns}
            emptyStateMessage="No se encontraron actividades"
            showSearch={false} // Search is handled in ActionBar
            showHeader={false} // Header is handled by ActionBar
          />
        )}
      </div>
    </Layout>
  );
}