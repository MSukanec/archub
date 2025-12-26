import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity as ActivityIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/shared/table';
import type { Column } from '@/components/shared/table';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { getOrganizationActivityLogs } from '@/features/organization/services/getOrganizationActivityLogs';
import { getActivityDisplayInfo } from '@/features/organization/utils';
import { organizationKeys } from '@/core/query-keys';
import type { ActivityLog } from '@/features/organization/types';
interface OrganizationActivityLogsViewProps {
  organizationId: string;
}
export function OrganizationActivityLogsView({ organizationId }: OrganizationActivityLogsViewProps) {
  const [, navigate] = useLocation();
  const { data: activities = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: organizationKeys.activityLogs(organizationId),
    queryFn: () => getOrganizationActivityLogs(organizationId),
    enabled: !!organizationId,
  });
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
  // Table columns configuration
  const columns: Column<ActivityLog>[] = useMemo(() => [
    {
      key: 'created_at'as const,
      label: 'Fecha',
      type: 'date'as const,
      sortable: true,
      sortType: 'date'as const,
      render: (activity: ActivityLog) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium">
            {activity.created_at ? format(new Date(activity.created_at), 'dd MMM', { locale: es }) : 'N/A'}
          </span>
          <span className="text-xs text-muted-foreground">
            {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { 
              addSuffix: true, 
              locale: es 
            }) : 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'user'as const,
      label: 'Usuario',
      type: 'name'as const,
      sortable: false,
      render: (activity: ActivityLog) => (
        <IdentityBadge
          name={activity.user?.full_name || 'Usuario'}
          avatarUrl={activity.user?.avatar_url}
          size="sm"
          layout="row"
          showName={true}
        />
      )
    },
    {
      key: 'action'as const,
      label: 'Acción',
      type: 'name'as const,
      sortable: false,
      render: (activity: ActivityLog) => {
        const displayInfo = getActivityDisplayInfo(activity);
        return (
          <Badge 
            variant={displayInfo.variant}
          >
            {displayInfo.label}
          </Badge>
        );
      }
    },
    {
      key: 'description'as const,
      label: 'Detalle',
      type: 'long-text'as const,
      sortable: false,
      render: (activity: ActivityLog) => {
        const displayInfo = getActivityDisplayInfo(activity);
        return (
          <span className="text-sm text-muted-foreground">
            {displayInfo.description}
          </span>
        );
      }
    }
  ], []);
  return (
    <div className="space-y-6">
      {/* Activity Chart and Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
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
          onRowClick={handleActivityClick}
        />
      )}
    </div>
  );
}
