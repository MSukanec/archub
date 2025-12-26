import { ProjectOverviewCard } from '@/features/client-portal';
import type { ClientPortalData } from '@/features/client-portal';
interface PortalDashboardTabProps {
  data: ClientPortalData;
}
export function PortalDashboardTab({ data }: PortalDashboardTabProps) {
  return (
    <ProjectOverviewCard 
      project={data.project} 
      stats={data.stats}
      client={data.client}
    />
  );
}
