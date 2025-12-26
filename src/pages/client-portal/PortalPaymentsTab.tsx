import { PaymentsList } from '@/features/client-portal';
import type { ClientPortalData } from '@/features/client-portal';

interface PortalPaymentsTabProps {
  data: ClientPortalData;
  organizationName?: string;
  organizationLogo?: string | null;
}

export function PortalPaymentsTab({ data, organizationName, organizationLogo }: PortalPaymentsTabProps) {
  return (
    <div className="space-y-6">
      <PaymentsList 
        payments={data.payments} 
        project={data.project}
        client={data.client}
        commitment={data.commitment}
        organizationName={organizationName}
        organizationLogo={organizationLogo}
      />
    </div>
  );
}
