import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity as ActivityIcon, Eye, Building2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table } from '@/components/shared/table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllActivityLogs, getOrganizationsForFilter, type AdminActivityLog } from '@/features/organization/services/getAllActivityLogs';
import { getActivityDisplayInfo } from '@/features/organization/utils';

export default function AdminActivityLogs() {
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrganizations() {
      const orgs = await getOrganizationsForFilter();
      setOrganizations(orgs);
    }
    fetchOrganizations();
  }, []);

  useEffect(() => {
    async function fetchActivities() {
      setIsLoading(true);
      try {
        const logs = await getAllActivityLogs(selectedOrgId);
        setActivities(logs);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivities();
  }, [selectedOrgId]);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const handleActivityClick = (activity: AdminActivityLog) => {
    console.log('Activity details:', activity);
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      width: '12%',
      render: (activity: AdminActivityLog) => (
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
      key: 'user',
      label: 'Usuario',
      width: '18%',
      render: (activity: AdminActivityLog) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={activity.user?.avatar_url} />
            <AvatarFallback className="text-xs">
              {getInitials(activity.user?.full_name || 'Usuario')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">
            {activity.user?.full_name || 'Usuario'}
          </span>
        </div>
      ),
      sortable: true,
      sortType: 'string' as const
    },
    {
      key: 'organization',
      label: 'Organización',
      width: '18%',
      render: (activity: AdminActivityLog) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate">
            {activity.organization?.name || 'Sin organización'}
          </span>
        </div>
      ),
      sortable: true,
      sortType: 'string' as const
    },
    {
      key: 'action',
      label: 'Acción',
      width: '18%',
      render: (activity: AdminActivityLog) => {
        const displayInfo = getActivityDisplayInfo(activity as any);
        return (
          <div className="flex items-center gap-2">
            <span>{displayInfo.icon}</span>
            <Badge variant="outline" className="text-xs">
              {displayInfo.label}
            </Badge>
          </div>
        );
      },
      sortable: true,
      sortType: 'string' as const
    },
    {
      key: 'description',
      label: 'Detalle',
      render: (activity: AdminActivityLog) => {
        const displayInfo = getActivityDisplayInfo(activity as any);
        return (
          <span className="text-sm text-muted-foreground truncate block">
            {displayInfo.description}
          </span>
        );
      },
      sortable: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select
          value={selectedOrgId || 'all'}
          onValueChange={(value) => setSelectedOrgId(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[280px]" data-testid="select-organization-filter">
            <SelectValue placeholder="Filtrar por organización" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las organizaciones</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {activities.length} registros
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon className="w-12 h-12" />}
          title="No hay actividades registradas"
          description="Cuando se realicen acciones en las organizaciones, aparecerán aquí."
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
  );
}
