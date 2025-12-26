import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity as ActivityIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/shared/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { getAllActivityLogs, type AdminActivityLog } from '@/features/organization/services/getAllActivityLogs';
import { getActivityDisplayInfo } from '@/features/organization/utils';
import { supabase } from '@/lib/supabase';
function getOrganizationAvatarUrl(org: AdminActivityLog['organization']): string | undefined {
  if (!org?.image_bucket || !org?.image_path || !supabase) return undefined;
  const { data } = supabase.storage.from(org.image_bucket).getPublicUrl(org.image_path);
  return data.publicUrl;
}
export default function AdminActivityLogs() {
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function fetchActivities() {
      setIsLoading(true);
      try {
        const logs = await getAllActivityLogs(null);
        setActivities(logs);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivities();
  }, []);
  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      type: 'date'as const,
      render: (activity: AdminActivityLog) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {activity.created_at ? format(new Date(activity.created_at), 'dd MMM yyyy', { locale: es }) : 'N/A'}
          </span>
          <span className="text-sm text-muted-foreground">
            {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { 
              addSuffix: true, 
              locale: es 
            }) : 'N/A'}
          </span>
        </div>
      ),
      sortable: true,
      sortType: 'date'as const
    },
    {
      key: 'organization',
      label: 'Organización',
      type: 'name'as const,
      render: (activity: AdminActivityLog) => (
        <IdentityBadge
          name={activity.organization?.name || 'Sin organización'}
          avatarUrl={getOrganizationAvatarUrl(activity.organization)}
          size="sm"
          showName={true}
        />
      ),
      sortable: true,
      sortType: 'string'as const
    },
    {
      key: 'user',
      label: 'Usuario',
      type: 'name'as const,
      render: (activity: AdminActivityLog) => (
        <IdentityBadge
          name={activity.user?.full_name || 'Usuario'}
          avatarUrl={activity.user?.avatar_url}
          size="sm"
          showName={true}
        />
      ),
      sortable: true,
      sortType: 'string'as const
    },
    {
      key: 'action',
      label: 'Acción',
      type: 'badge'as const,
      render: (activity: AdminActivityLog) => {
        const displayInfo = getActivityDisplayInfo(activity as any);
        return (
          <Badge variant="default">
            {displayInfo.label}
          </Badge>
        );
      },
      sortable: true,
      sortType: 'string'as const
    },
    {
      key: 'description',
      label: 'Detalle',
      type: 'long-text'as const,
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
        />
      )}
    </div>
  );
}
