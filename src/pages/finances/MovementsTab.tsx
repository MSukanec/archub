import { useMemo } from 'react';
import { useFinancialMovements, PAYMENT_STATUS, MOVEMENT_TYPES, FinancialStatsSection } from '@/features/finances';
import { useProjectContext } from '@/stores/projectContext';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { formatDate } from '@/lib/date-utils';
import { DollarSign } from 'lucide-react';
import type { FinancialMovementWithRelations } from '@/features/finances';

export function MovementsTab() {
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  const { data: userData } = useCurrentUser();
  const { data: movements = [], isLoading, error } = useFinancialMovements(
    currentOrganizationId || undefined,
    selectedProjectId
  );
  
  // Obtener moneda principal de la organización
  const { data: primaryCurrency } = useOrganizationDefaultCurrency(currentOrganizationId || undefined);
  
  // Verificar si el plan es TEAMS
  const isTeamsPlan = userData?.organization?.plan?.name === 'Teams';

  // Format currency helper
  const formatCurrency = (amount: number, currencySymbol: string = '$') => {
    return `${currencySymbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)}`;
  };

  // Determinar si está en vista de organización
  const isOrganizationView = !selectedProjectId;

  // Columns in the new order requested
  const columns = useMemo(() => {
    const baseColumns = [
      // 1. Fecha
      {
        key: 'payment_date',
        label: 'Fecha',
        render: (item: FinancialMovementWithRelations) => (
          <span className="text-sm">{formatDate(item.payment_date)}</span>
        ),
      },
    ];

    // 2. Contexto (Proyecto) - Solo si está en vista de organización
    if (isOrganizationView) {
      baseColumns.push({
        key: 'project',
        label: 'Contexto',
        render: (item: FinancialMovementWithRelations) => (
          <span className="text-sm">{item.project?.name || '-'}</span>
        ),
      });
    }

    // 3. Creador - Solo visible en plan TEAMS
    if (isTeamsPlan) {
      baseColumns.push({
        key: 'creator',
        label: 'Creador',
        render: (item: FinancialMovementWithRelations) => (
          <span className="text-sm">{item.creator?.full_name || item.creator?.email || '-'}</span>
        ),
      });
    }

    // 4. Tipo - Badge con contenido blanco y fondo de color
    baseColumns.push({
      key: 'movement_type',
      label: 'Tipo',
      render: (item: FinancialMovementWithRelations) => {
        const typeConfig = MOVEMENT_TYPES[item.movement_type as keyof typeof MOVEMENT_TYPES];
        const colorMap: Record<string, string> = {
          green: 'bg-green-600',
          blue: 'bg-blue-600',
          orange: 'bg-orange-600',
          purple: 'bg-purple-600',
          indigo: 'bg-indigo-600',
          red: 'bg-red-600',
          teal: 'bg-teal-600',
        };
        const bgColor = colorMap[typeConfig?.color] || 'bg-gray-600';
        
        return (
          <Badge className={`text-xs ${bgColor} text-white border-0`}>
            {typeConfig?.label || item.movement_type}
          </Badge>
        );
      },
    });

    // 5. Descripción
    baseColumns.push({
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
    });

    // 6. Moneda
    baseColumns.push({
      key: 'currency',
      label: 'Moneda',
      render: (item: FinancialMovementWithRelations) => (
        <span className="text-xs text-muted-foreground">
          {item.currency?.code || 'N/A'}
        </span>
      ),
    });

    // 7. Billetera
    baseColumns.push({
      key: 'wallet',
      label: 'Billetera',
      render: (item: FinancialMovementWithRelations) => (
        <span className="text-sm">{item.wallet?.name || '-'}</span>
      ),
    });

    // 8. Monto - con cotización abajo, alineado a la derecha
    baseColumns.push({
      key: 'amount',
      label: 'Monto',
      render: (item: FinancialMovementWithRelations) => {
        const isPositive = item.amount >= 0;
        return (
          <div className="flex flex-col items-end">
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(item.amount), item.currency?.symbol)}
            </span>
            {item.exchange_rate && item.exchange_rate !== 1 && (
              <span className="text-xs text-muted-foreground">
                Cotiz: {item.exchange_rate.toFixed(2)}
              </span>
            )}
          </div>
        );
      },
    });

    // 9. Estado
    baseColumns.push({
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
    });

    return baseColumns;
  }, [isOrganizationView, isTeamsPlan]);

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
      {/* Financial Stats Section */}
      <FinancialStatsSection 
        movements={movements}
        primaryCurrencyCode={primaryCurrency?.code}
        primaryCurrencySymbol={primaryCurrency?.symbol}
      />

      {/* Movements Table */}
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
