import { SiteLogsFeed } from '@/features/client-portal';
import type { ClientPortalData } from '@/features/client-portal';

interface PortalLogsTabProps {
  data: ClientPortalData;
}

export function PortalLogsTab({ data }: PortalLogsTabProps) {
  return <SiteLogsFeed logs={data.site_logs} />;
}
