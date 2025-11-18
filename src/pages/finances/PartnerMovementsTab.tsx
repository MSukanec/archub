import { useMemo } from 'react';
import { useProjectContext } from '@/stores/projectContext';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { formatDate } from '@/lib/date-utils';
import { Users } from 'lucide-react';

// Temporary mock type - will be replaced with actual type when table schema is defined
interface PartnerMovement {
  id: string;
  payment_date: string;
  partner_id: string | null;
  partner_name: string | null;
  partner_avatar: string | null;
  movement_type: 'income' | 'expense';
  wallet_name: string;
  amount: number;
  currency_symbol: string;
  exchange_rate: number;
}

export function PartnerMovementsTab() {
  const { selectedProjectId } = useProjectContext();
  
  // Temporary mock data - will be replaced with actual hook when service is ready
  const movements: PartnerMovement[] = [];
  const isLoading = false;
  const error = null;

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
      render: (item: PartnerMovement) => (
        <span className="text-sm">{formatDate(item.payment_date)}</span>
      ),
    },
    // 2. Socio (con avatar)
    {
      key: 'partner',
      label: 'Socio',
      render: (item: PartnerMovement) => (
        <div className="flex items-center gap-2">
          {item.partner_id ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={item.partner_avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {getPartnerInitials(item.partner_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{item.partner_name || 'Sin nombre'}</span>
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
      render: (item: PartnerMovement) => {
        if (item.movement_type === 'income') {
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
      render: (item: PartnerMovement) => (
        <span className="text-sm">{item.wallet_name || '-'}</span>
      ),
    },
    // 5. Monto (con cotización abajo, alineado a la derecha)
    {
      key: 'amount',
      label: 'Monto',
      render: (item: PartnerMovement) => {
        const isPositive = item.movement_type === 'income';
        return (
          <div className="flex flex-col items-end">
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(item.amount, item.currency_symbol)}
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
