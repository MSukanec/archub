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
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function OrganizationActivity() {
  const { data: userData } = useCurrentUser();
  const [, navigate] = useLocation();
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState('date_recent');
  const [filterByType, setFilterByType] = useState('all');
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'year'>('week');
  const organizationId = userData?.preferences?.last_organization_id;

  // Placeholder activities data - will be implemented with proper data later
  const activities: any[] = []
  const isLoading = false

  // Filter and sort activities
  const filteredActivities = activities.filter(activity => {
    // Filter by search
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      return (
        activity.description.toLowerCase().includes(searchLower) ||
        activity.author?.full_name?.toLowerCase().includes(searchLower) ||
        activity.type_label.toLowerCase().includes(searchLower)
      );
    }
    
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
    setSearchValue("");
    setSortBy('date_recent');
    setFilterByType('all');
  };

  // Custom filters para ActionBar
  const customFilters = (
        <Select value={sortBy} onValueChange={setSortBy}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_recent">Fecha (Más reciente)</SelectItem>
            <SelectItem value="date_old">Fecha (Más antigua)</SelectItem>
            <SelectItem value="type">Tipo (A-Z)</SelectItem>
            <SelectItem value="author">Autor (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

        <Select value={filterByType} onValueChange={setFilterByType}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los miembros</SelectItem>
            <SelectItem value="create">Creaciones</SelectItem>
            <SelectItem value="update">Ediciones</SelectItem>
            <SelectItem value="delete">Eliminaciones</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (!organizationId) {
    return (
      <Layout>
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
            {activity.created_at ? format(new Date(activity.created_at), 'dd MMM yyyy', { locale: es }) : 'N/A'}
          </span>
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
            <AvatarImage src={activity.author?.avatar_url} />
              {getInitials(activity.author?.full_name || 'Usuario')}
            </AvatarFallback>
          </Avatar>
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
        >
          Ver detalles
        </Button>
      ),
      sortable: false
    }
  ];

  return (
    <Layout>
        {/* ActionBar Desktop */}
        <ActionBarDesktop
          showProjectSelector={false}
          features={[
            {
              title: "Registro central de actividades",
              description: "En esta sección quedan asentadas todas las acciones importantes que realiza la organización, permitiendo dar seguimiento a cada cosa que sucede. Desde la creación de proyectos hasta movimientos financieros, todo queda registrado para mantener un historial completo."
            },
            {
              title: "Filtrado por miembro",
              description: "Las acciones están organizadas y filtradas por miembro de la organización, de manera tal que se puede saber exactamente quién hizo cada cosa. Esto permite identificar responsabilidades, reconocer contribuciones y mantener la trazabilidad de las decisiones tomadas."
            },
            {
              title: "Búsqueda avanzada de actividades",
              description: "Sistema de búsqueda que permite localizar actividades específicas por descripción, autor, tipo de acción o fecha. Incluye filtros para acotar resultados por período de tiempo, tipo de actividad y responsable de la acción."
            },
            {
              title: "Organización temporal y filtrado",
              description: "Las actividades se organizan cronológicamente con opciones de filtrado por miembro del equipo, tipo de acción (creación, edición, eliminación) y período temporal para facilitar el seguimiento y auditoría."
            }
          ]}
          showSearch={true}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          customFilters={customFilters}
          onClearFilters={clearFilters}
        />

        {/* Feature Introduction removida */}

        {/* Activity Chart and Table */}
        {isLoading ? (
          </div>
        ) : sortedActivities.length === 0 ? (
          <EmptyState
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