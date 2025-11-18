import { useMemo } from 'react';
import { useFinancialMovements, PAYMENT_STATUS, MOVEMENT_TYPES } from '@/features/finances';
import { useProjectContext } from '@/stores/projectContext';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { formatDate } from '@/lib/date-utils';
import { DollarSign } from 'lucide-react';
import type { FinancialMovementWithRelations } from '@/features/finances';

export function MovementsTab() {
  const { currentOrganizationId } = useProjectContext();
  const { data: movements = [], isLoading, error } = useFinancialMovements(currentOrganizationId || undefined);

  // Format currency helper
  const formatCurrency = (amount: number, currencySymbol: string = '$') => {
    return `${currencySymbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)}`;
  };

  // Columns matching the old MovementsList.tsx structure
  const columns = useMemo(() => [
    {
      key: 'payment_date',
      label: 'Fecha',
      render: (item: FinancialMovementWithRelations) => (
        <span className="text-sm">{formatDate(item.payment_date)}</span>
      ),
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (item: FinancialMovementWithRelations) => (
        <div className="max-w-[200px]">
          <p className="text-sm font-medium truncate">{item.description}</p>
          {item.reference && (
            <p className="text-xs text-muted-foreground truncate">Ref: {item.reference}</p>
          )}
        </div>
      ),
    },
    {
      key: 'movement_type',
      label: 'Tipo',
      render: (item: FinancialMovementWithRelations) => {
        const typeConfig = MOVEMENT_TYPES[item.movement_type as keyof typeof MOVEMENT_TYPES];
        return (
          <Badge variant="outline" className="text-xs">
            {typeConfig?.label || item.movement_type}
          </Badge>
        );
      },
    },
    {
      key: 'movement_category',
      label: 'Categoría',
      render: (item: FinancialMovementWithRelations) => (
        <span className="text-sm">{item.movement_category || '-'}</span>
      ),
    },
    {
      key: 'movement_subcategory',
      label: 'Subcategoría',
      render: (item: FinancialMovementWithRelations) => (
        <span className="text-sm text-muted-foreground">{item.movement_subcategory || '-'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      render: (item: FinancialMovementWithRelations) => {
        const isPositive = item.amount >= 0;
        return (
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(item.amount), item.currency?.symbol)}
          </span>
        );
      },
    },
    {
      key: 'currency',
      label: 'Moneda',
      render: (item: FinancialMovementWithRelations) => (
        <span className="text-xs text-muted-foreground">
          {item.currency?.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'wallet',
      label: 'Billetera',
      render: (item: FinancialMovementWithRelations) => (
        <span className="text-sm">{item.wallet?.name || '-'}</span>
      ),
    },
    {
      key: 'project',
      label: 'Proyecto',
      render: (item: FinancialMovementWithRelations) => (
        <span className="text-sm">{item.project?.name || '-'}</span>
      ),
    },
    {
      key: 'creator',
      label: 'Creador',
      render: (item: FinancialMovementWithRelations) => (
        <span className="text-sm">{item.creator?.full_name || item.creator?.email || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (item: FinancialMovementWithRelations) => {
        const statusConfig = PAYMENT_STATUS[item.status as keyof typeof PAYMENT_STATUS];
        return (
          <Badge 
            variant={statusConfig?.variant || 'secondary'} 
            className={`text-xs ${statusConfig?.variant === 'default' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : ''}`}
          >
            {statusConfig?.label || item.status}
          </Badge>
        );
      },
    },
  ], []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
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
        description="No se encontraron movimientos financieros en esta organización."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Movimientos Financieros</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Auditoría unificada de todos los pagos ({movements.length} registros)
          </p>
        </div>
      </div>

      <Table
        data={movements}
        columns={columns}
        emptyState={
          <EmptyState
            icon={<DollarSign className="w-12 h-12" />}
            title="No hay movimientos"
            description="No se encontraron movimientos financieros."
          />
        }
      />
    </div>
  );
}
