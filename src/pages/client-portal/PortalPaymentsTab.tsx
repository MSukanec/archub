import { PaymentsList } from '@/features/client-portal';
import type { ClientPortalData } from '@/features/client-portal';

interface PortalPaymentsTabProps {
  data: ClientPortalData;
}

export function PortalPaymentsTab({ data }: PortalPaymentsTabProps) {
  return (
    <div className="space-y-6">
      <PaymentsList payments={data.payments} />
    </div>
  );
}
