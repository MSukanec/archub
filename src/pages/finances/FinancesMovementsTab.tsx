import React, { useMemo } from 'react';
import { useUnifiedMovements } from '@/features/finances/hooks/use-unified-movements';
import { useProjectContext } from '@/stores/projectContext';
import { useGlobalModalStore } from '@/components/modal/state/globalModalStore';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { useDeleteClientPayment } from '@/features/clients/hooks/use-client-payments';
import { useDeleteMaterialPayment } from '@/features/materials/hooks/use-material-payments';
import { useDeletePersonnelPayment } from '@/features/personnel/hooks/use-personnel-payments';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  StatCard, 
  StatCardTitle, 
  StatCardValue, 
  StatCardMeta,
  StatCardTrend,
  type TrendDirection
} from '@/components/dashboard';
import { calculateMonetaryKPI, calculateCountKPI, formatBreakdown, hasMultipleCurrencies } from '@/lib/kpis';
import { format as formatMoney, formatKPI } from '@/lib/money';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/date-utils';
import { DollarSign, Edit, Trash2, Paperclip, User, Package, Users, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Scale, Hash } from 'lucide-react';
import chroma from 'chroma-js';
import type { UnifiedMovementWithRelations } from '@/features/finances/services/getUnifiedMovements';

const MOVEMENT_TYPE_CONFIG: Record<string, { 
  label: string; 
  modalType: string;
  icon: typeof User;
}> = {
  client_payment: { 
    label: 'Pago Cliente', 
    modalType: 'client-payment',
    icon: User,
  },
  material_payment: { 
    label: 'Pago Material', 
    modalType: 'material-payment',
    icon: Package,
  },
  personnel_payment: { 
    label: 'Pago Personal', 
    modalType: 'personnel-payment',
    icon: Users,
  },
  partner_contribution: { 
    label: 'Aporte Socio', 
    modalType: 'partner-contribution',
    icon: TrendingUp,
  },
  partner_withdrawal: { 
    label: 'Retiro Socio', 
    modalType: 'partner-withdrawal',
    icon: TrendingDown,
  },
  general_cost_payment: { 
    label: 'Gastos Generales', 
    modalType: 'general-cost-payment',
    icon: DollarSign,
  },
};

export function FinancesMovementsTab() {
  const { currentOrganizationId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  
  // Obtener moneda por defecto de la organización
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(currentOrganizationId);
  
  // No filtrar por proyecto - mostrar todos los movimientos de la organización
  const { data: rawMovements = [], isLoading } = useUnifiedMovements(
    currentOrganizationId || undefined,
    undefined
  );

  // Sort by payment_date DESC, then by created_at DESC
  const movements = useMemo(() => {
    return [...rawMovements].sort((a, b) => {
      const dateComparison = new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
      if (dateComparison !== 0) return dateComparison;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [rawMovements]);

  // Calcular KPIs
  const kpis = useMemo(() => {
    // Separar ingresos (amount_sign > 0) y egresos (amount_sign < 0)
    const ingresos = movements.filter(m => m.amount_sign > 0);
    const egresos = movements.filter(m => m.amount_sign < 0);

    // KPI 1: Total Ingresos
    const ingresosKPI = calculateMonetaryKPI({
      items: ingresos.map(m => ({
        amount: m.amount,
        currency_id: m.currency_id,
        currency: m.currency,
        exchange_rate: m.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    // KPI 2: Total Egresos
    const egresosKPI = calculateMonetaryKPI({
      items: egresos.map(m => ({
        amount: m.amount,
        currency_id: m.currency_id,
        currency: m.currency,
        exchange_rate: m.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    // KPI 3: Balance (Ingresos - Egresos)
    const balanceValue = ingresosKPI.value - egresosKPI.value;

    // KPI 4: Total movimientos (conteo)
    const totalMovimientosKPI = calculateCountKPI({
      count: movements.length,
      label: 'movimientos'
    });

    return {
      ingresos: ingresosKPI,
      egresos: egresosKPI,
      balance: balanceValue,
      totalMovimientos: totalMovimientosKPI,
    };
  }, [movements, defaultCurrency]);

  const deleteClientPaymentMutation = useDeleteClientPayment();
  const deleteMaterialPaymentMutation = useDeleteMaterialPayment();
  const deletePersonnelPaymentMutation = useDeletePersonnelPayment();

  const formatCurrency = (amount: number, currencySymbol: string = '$') => {
    return `${currencySymbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount))}`;
  };

  const handleEdit = (movement: UnifiedMovementWithRelations) => {
    const config = MOVEMENT_TYPE_CONFIG[movement.movement_type];
    if (!config) return;

    openModal(config.modalType, {
      projectId: movement.project_id,
      organizationId: movement.organization_id,
      paymentId: movement.id,
      mode: 'edit',
    });
  };

  const handleDelete = (movement: UnifiedMovementWithRelations) => {
    if (!currentOrganizationId) return;

    const config = MOVEMENT_TYPE_CONFIG[movement.movement_type];
    const symbol = movement.currency?.symbol || '$';
    const formattedAmount = formatCurrency(movement.amount, symbol);
    const paymentLabel = `${movement.description} - ${formattedAmount}`;

    const deleteHandler = () => {
      switch (movement.movement_type) {
        case 'client_payment':
          return deleteClientPaymentMutation.mutate({
            paymentId: movement.id,
            organizationId: currentOrganizationId,
            projectId: movement.project_id || '',
          });
        case 'material_payment':
          return deleteMaterialPaymentMutation.mutate({
            paymentId: movement.id,
            organizationId: currentOrganizationId,
            projectId: movement.project_id || '',
          });
        case 'personnel_payment':
          return deletePersonnelPaymentMutation.mutate({
            paymentId: movement.id,
            organizationId: currentOrganizationId,
            projectId: movement.project_id || '',
          });
      }
    };

    showDeleteConfirmation({
      mode: 'simple',
      title: `Eliminar ${config?.label || 'movimiento'}`,
      description: '¿Estás seguro de que querés eliminar este movimiento? Esta acción no se puede deshacer.',
      itemName: paymentLabel,
      destructiveActionText: 'Eliminar',
      onDelete: deleteHandler,
      isLoading: deleteClientPaymentMutation.isPending || 
                 deleteMaterialPaymentMutation.isPending || 
                 deletePersonnelPaymentMutation.isPending,
    });
  };

  const columns: Array<{
    key: string;
    label: string;
    render?: (item: UnifiedMovementWithRelations) => React.ReactNode;
    sortable?: boolean;
    sortType?: 'string' | 'number' | 'date';
    width?: string;
    align?: 'left' | 'center' | 'right';
  }> = [
    {
      key: 'payment_date',
      label: 'Fecha',
      sortable: true,
      sortType: 'date',
      width: 'minmax(90px, 1fr)',
      render: (movement) => {
        const date = parseLocalDate(movement.payment_date);
        return date ? format(date, 'dd/MM/yyyy') : '-';
      },
    },
    {
      key: 'movement_type',
      label: 'Tipo',
      sortable: true,
      width: 'minmax(160px, 2fr)',
      render: (movement) => {
        const config = MOVEMENT_TYPE_CONFIG[movement.movement_type];
        const creatorName = movement.creator_full_name || '';
        const creatorInitials = creatorName
          ? creatorName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
          : '?';
        
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-offset-0" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}>
              {movement.creator_avatar_url && <AvatarImage src={movement.creator_avatar_url} alt={creatorName} />}
              <AvatarFallback className="text-xs font-semibold">{creatorInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">
                {config?.label || movement.movement_type}
              </div>
              <div className="text-muted-foreground text-xs truncate">
                {movement.entity_name || '-'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'project',
      label: 'Proyecto',
      sortable: true,
      width: 'minmax(120px, 1.5fr)',
      render: (movement) => {
        if (!movement.project) return <span className="text-muted-foreground text-sm">-</span>;
        const projectColor = movement.project.color;
        const rgb = chroma(projectColor).rgb();
        
        return (
          <Badge 
            className="font-medium whitespace-nowrap border"
            style={{ 
              color: projectColor,
              backgroundColor: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.1)`,
              borderColor: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`,
            }}
          >
            {movement.project.name}
          </Badge>
        );
      },
    },
    {
      key: 'description',
      label: 'Detalle',
      sortable: true,
      width: 'minmax(150px, 2fr)',
      render: (movement) => (
        <div className="flex items-center gap-1.5 min-w-0">
          {movement.has_attachments && (
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span 
            className="text-sm block truncate" 
            title={movement.description || '-'}
          >
            {movement.description || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'wallet',
      label: 'Billetera',
      sortable: true,
      width: 'minmax(100px, 1.2fr)',
      render: (movement) => (
        <span className="text-sm truncate" title={movement.wallet?.name}>{movement.wallet?.name || '-'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      sortType: 'number',
      width: 'minmax(110px, 1.5fr)',
      align: 'right',
      render: (movement) => {
        const isPositive = movement.signed_amount >= 0;
        return (
          <div className="flex flex-col items-end">
            <span className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : '-'}{formatCurrency(movement.amount, movement.currency?.symbol)}
            </span>
            {movement.exchange_rate && (
              <span className="text-[10px] text-muted-foreground">
                Cot. {movement.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6" data-testid="finances-movements-tab">
      <Table
        columns={columns}
        data={movements}
        isLoading={isLoading}
        emptyStateConfig={{
          icon: <DollarSign className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay movimientos',
          description: 'No se encontraron movimientos financieros unificados.',
        }}
        defaultSort={{
          key: 'payment_date',
          direction: 'desc',
        }}
        rowActions={(movement: UnifiedMovementWithRelations) => [
          {
            label: 'Editar',
            icon: Edit,
            onClick: () => handleEdit(movement),
          },
          {
            label: 'Eliminar',
            icon: Trash2,
            onClick: () => handleDelete(movement),
            variant: 'destructive' as const,
          },
        ]}
      />
    </div>
  );
}
