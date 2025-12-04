import { UpcomingInstallments } from '@/features/client-portal';
import type { ClientPortalData } from '@/features/client-portal';

interface PortalInstallmentsTabProps {
  data: ClientPortalData;
}

export function PortalInstallmentsTab({ data }: PortalInstallmentsTabProps) {
  return (
    <div className="space-y-6">
      <UpcomingInstallments schedules={data.schedule} />
    </div>
  );
}
