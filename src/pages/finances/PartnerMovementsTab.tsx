import { useMemo } from 'react';
import { useProjectContext } from '@/stores/projectContext';
import { usePartnerMovements } from '@/features/finances';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { formatDate } from '@/lib/date-utils';
import { Users } from 'lucide-react';
import type { FinancialMovementWithRelations } from '@/features/finances';

export function PartnerMovementsTab() {
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  
  // Fetch partner movements (contributions and withdrawals)
  const { data: movements = [], isLoading, error } = usePartnerMovements(
    currentOrganizationId || undefined,
    selectedProjectId || undefined
  );

  // Format currency helper
  const formatCurrency = (amount: number, currencySymbol: string = '$') => {
    return `${currencySymbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)}`;
  };

  // Get partner initials for avatar fallback
  const getPartnerInitials = (name: string | null) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const columns = useMemo(() => [
    // 1. Fecha
    {
      key: 'payment_date',
      label: 'Fecha',
      render: (item: FinancialMovementWithRelations) => (
        <span className="text-sm">{formatDate(item.payment_date)}</span>
      ),
    },
    // 2. Socio (con avatar)
    {
      key: 'partner',
      label: 'Socio',
      render: (item: FinancialMovementWithRelations) => (
        <div className="flex items-center gap-2">
          {item.partner ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getPartnerInitials(item.partner.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{item.partner.name}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Sin socio</span>
          )}
        </div>
      ),
    },
    // 3. Tipo (badge verde para ingresos, texto simple para egresos)
    {
      key: 'movement_type',
      label: 'Tipo',
      render: (item: FinancialMovementWithRelations) => {
        const isContribution = item.movement_type === 'partner_contribution';
        if (isContribution) {
          return (
            <Badge className="text-xs bg-green-600 text-white border-0">
              Ingresos
            </Badge>
          );
        }
        return <span className="text-sm">Egresos</span>;
      },
    },
    // 4. Billetera
    {
      key: 'wallet',
      label: 'Billetera',
      render: (item: FinancialMovementWithRelations) => (
        <span className="text-sm">{item.wallet?.name || '-'}</span>
      ),
    },
    // 5. Monto (con cotización abajo, alineado a la derecha)
    {
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
                Cotiz: {item.exchange_rate.toFixed(0)}
              </span>
            )}
          </div>
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
        icon={<Users className="w-12 h-12" />}
        title="Error al cargar movimientos"
        description="Hubo un problema al cargar los movimientos de socios."
      />
    );
  }

  if (movements.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-12 h-12" />}
        title="No hay movimientos de socios"
        description="No se encontraron aportes ni retiros de capital en esta organización."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Movements Table */}
      <Table
        data={movements}
        columns={columns}
        emptyState={
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title="No hay movimientos"
            description="No se encontraron movimientos de socios."
          />
        }
      />
    </div>
  );
}
