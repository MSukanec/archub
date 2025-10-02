import { Package } from "lucide-react";
import { EmptyState } from '@/components/ui-custom/security/EmptyState';

interface MaterialCostsTabProps {
  material: any;
}

export function MaterialCostsTab({ material }: MaterialCostsTabProps) {
  return (
    <div className="space-y-6">
      <EmptyState
        icon={<Package />}
        title="Costos no disponibles"
        description="Los costos para materiales individuales aún no están disponibles en esta vista."
      />
    </div>
  );
}
