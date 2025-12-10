import { useUnifiedMovements } from '@/features/finances/hooks/use-unified-movements';
import { useProjectContext } from '@/stores/projectContext';
import { useGlobalModalStore } from '@/components/modal/state/globalModalStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { formatDate } from '@/lib/date-utils';
import { DollarSign, Plus } from 'lucide-react';
import type { UnifiedMovementWithRelations } from '@/features/finances/services/getUnifiedMovements';

const MOVEMENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  client_payment: { label: 'Pago Cliente', color: 'bg-green-600' },
  material_payment: { label: 'Pago Material', color: 'bg-orange-600' },
  personnel_payment: { label: 'Pago Personal', color: 'bg-blue-600' },
};

export function FinancesMovementsTab() {
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { data: movements = [], isLoading, error } = useUnifiedMovements(
    currentOrganizationId || undefined,
    selectedProjectId
  );

  const handleAddMovement = () => {
    openModal('unified-payment', {
      projectId: selectedProjectId,
      organizationId: currentOrganizationId,
    });
  };

  const formatCurrency = (amount: number, currencySymbol: string = '$') => {
    return `${currencySymbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Math.abs(amount))}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="finances-loading">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<DollarSign className="w-12 h-12" />}
        title="Error al cargar movimientos"
        description="Hubo un problema al cargar los movimientos financieros."
      />
    );
  }

  if (movements.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign className="w-12 h-12" />}
        title="No hay movimientos"
        description="No se encontraron movimientos financieros unificados."
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="finances-movements-tab">
      <div className="flex justify-end">
        <Button onClick={handleAddMovement} data-testid="button-add-movement">
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Moneda</TableHead>
            <TableHead>Proyecto</TableHead>
            <TableHead>Billetera</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const typeConfig = MOVEMENT_TYPE_LABELS[movement.movement_type] || {
              label: movement.movement_type,
              color: 'bg-gray-600'
            };
            const isPositive = movement.signed_amount >= 0;

            return (
              <TableRow key={movement.id} data-testid={`movement-row-${movement.id}`}>
                <TableCell className="text-sm">
                  {formatDate(movement.payment_date)}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {movement.description}
                </TableCell>
                <TableCell>
                  <Badge className={`text-xs ${typeConfig.color} text-white border-0`}>
                    {typeConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : '-'}{formatCurrency(movement.signed_amount, movement.currency?.symbol)}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {movement.currency?.code || '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {movement.project?.name || '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {movement.wallet?.name || '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
