/**
 * ProjectFinancesMovementsView.tsx
 * 
 * Finanzas de PROYECTO - muestra solo movimientos del proyecto actual.
 * NO incluye columna "Proyecto" (ya estamos en contexto de proyecto).
 * Solo muestra tipos de movimientos relevantes a proyectos.
 */
import { useMemo, useState, useEffect } from 'react';
import { useUnifiedMovements } from '@/features/finances/hooks/use-unified-movements';
import { useProjectContext } from '@/stores/projectContext';
import { useGlobalModalStore } from '@/components/modal/state/globalModalStore';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { useDeleteClientPayment } from '@/features/clients/hooks/use-client-payments';
import { useDeleteMaterialPayment } from '@/features/materials/hooks/use-material-payments';
import { useDeletePersonnelPayment } from '@/features/personnel/hooks/use-personnel-payments';
import { useOrganizationDefaultCurrency, useOrgCurrencyContext } from '@/hooks/use-currencies';
import { useFinancesDataHealth, DataHealthAlertMulti } from '@/core/data-health';
import { Table } from '@/components/shared/table';
import type { Column } from '@/components/shared/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
  StatCard, 
  StatCardTitle, 
  StatCardValue, 
  StatCardMeta,
  StatCardSubValue,
  StatCardTrend,
  type TrendDirection
} from '@/components/ActivityCard';
import { calculateMonetaryKPI, calculateCountKPI, formatBreakdown, hasMultipleCurrencies } from '@/lib/kpis';
import { format as formatMoney } from '@/lib/money';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/date-utils';
import { DollarSign, Edit, Trash2, Paperclip, User, Package, Users, ArrowUpRight, ArrowDownRight, Scale, Hash } from 'lucide-react';
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
};
interface ProjectFinancesMovementsViewProps {
  projectId: string;
  externalFilterIssueId?: string | null;
  onClearExternalFilter?: () => void;
  getAffectedIdsForIssue?: (issueId: string) => Set<string | number>;
}
export function ProjectFinancesMovementsView({ 
  projectId,
  externalFilterIssueId,
  onClearExternalFilter,
  getAffectedIdsForIssue: externalGetAffectedIds,
}: ProjectFinancesMovementsViewProps) {
  const { currentOrganizationId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  
  const [internalFilterIssueId, setInternalFilterIssueId] = useState<string | null>(null);
  const [dismissedIssueIds, setDismissedIssueIds] = useState<Set<string>>(new Set());
  
  const activeFilterIssueId = externalFilterIssueId ?? internalFilterIssueId;
  const setActiveFilterIssueId = (id: string | null) => {
    if (externalFilterIssueId !== undefined && onClearExternalFilter) {
      if (id === null) onClearExternalFilter();
    } else {
      setInternalFilterIssueId(id);
    }
  };
  
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(currentOrganizationId || undefined);
  const { isMultiCurrency } = useOrgCurrencyContext(currentOrganizationId || undefined);
  
  const { data: rawMovements = [], isLoading } = useUnifiedMovements(
    currentOrganizationId || undefined,
    projectId
  );
  const sortedMovements = useMemo(() => {
    return [...rawMovements].sort((a, b) => {
      const dateComparison = new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
      if (dateComparison !== 0) return dateComparison;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [rawMovements]);
  const dataHealth = useFinancesDataHealth(sortedMovements, {
    organizationId: currentOrganizationId || '',
    defaultCurrencyId: defaultCurrency?.id,
    isMultiCurrency,
    enabled: !!currentOrganizationId && sortedMovements.length > 0,
  });
  useEffect(() => {
    if (activeFilterIssueId && !dataHealth.hasIssues) {
      setActiveFilterIssueId(null);
    }
  }, [activeFilterIssueId, dataHealth.hasIssues]);
  const filteredMovementIds = useMemo(() => {
    if (!activeFilterIssueId) return null;
    return dataHealth.getAffectedIdsForIssue(activeFilterIssueId);
  }, [activeFilterIssueId, dataHealth]);
  const movements = useMemo(() => {
    if (!filteredMovementIds) return sortedMovements;
    return sortedMovements.filter(m => filteredMovementIds.has(m.id));
  }, [sortedMovements, filteredMovementIds]);
  const kpis = useMemo(() => {
    const ingresosMovements = movements.filter(m => m.amount_sign > 0);
    const egresosMovements = movements.filter(m => m.amount_sign < 0);
    const ingresosCount = ingresosMovements.length;
    const egresosCount = egresosMovements.length;
    const ingresosKPI = calculateMonetaryKPI({
      items: ingresosMovements.map(m => ({
        amount: m.amount,
        currency_id: m.currency_id,
        currency: m.currency,
        exchange_rate: m.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });
    const egresosKPI = calculateMonetaryKPI({
      items: egresosMovements.map(m => ({
        amount: m.amount,
        currency_id: m.currency_id,
        currency: m.currency,
        exchange_rate: m.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });
    const balanceValue = ingresosKPI.value - egresosKPI.value;
    const totalMovimientosKPI = calculateCountKPI({
      count: movements.length,
      label: 'movimientos'
    });
    return {
      ingresos: ingresosKPI,
      egresos: egresosKPI,
      balance: balanceValue,
      totalMovimientos: totalMovimientosKPI,
      ingresosCount,
      egresosCount,
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
  const columns: Column<UnifiedMovementWithRelations>[] = [
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
          ? creatorName.split('').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
          : '?';
        
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-offset-0" style={{ '--tw-ring-color': 'var(--accent)'} as React.CSSProperties}>
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
      key: 'description',
      label: 'Detalle',
      sortable: true,
      width: 'minmax(180px, 2.5fr)',
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
            <span className={`text-sm font-bold ${isPositive ? 'text-positive': 'text-negative'}`}>
              {isPositive ? '+': '-'}{formatCurrency(movement.amount, movement.currency?.symbol)}
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
  const isCurrencyReady = !!defaultCurrency;
  const currencySymbol = defaultCurrency?.symbol || '$';
  const balanceDirection: TrendDirection = kpis.balance > 0 ? 'up': kpis.balance < 0 ? 'down': 'neutral';
  const balanceTrendLabel = kpis.balance > 0 ? 'Positivo': kpis.balance < 0 ? 'Negativo': 'Sin variación';
  const showIngresosBreakdown = isCurrencyReady && hasMultipleCurrencies(kpis.ingresos) && kpis.ingresos.breakdown && kpis.ingresos.breakdown.length > 0;
  const showEgresosBreakdown = isCurrencyReady && hasMultipleCurrencies(kpis.egresos) && kpis.egresos.breakdown && kpis.egresos.breakdown.length > 0;
  return (
    <div className="space-y-6" data-testid="project-finances-movements-tab">
      <DataHealthAlertMulti
        issues={dataHealth.issues}
        entityLabel="movimiento"
        activeFilterIssueId={activeFilterIssueId}
        onToggleFilter={(issueId: string) => {
          if (activeFilterIssueId === issueId) {
            setActiveFilterIssueId(null);
          } else {
            setActiveFilterIssueId(issueId);
          }
        }}
        dismissedIssueIds={dismissedIssueIds}
        onDismissIssue={(issueId: string) => {
          if (activeFilterIssueId === issueId) {
            setActiveFilterIssueId(null);
          }
          setDismissedIssueIds(prev => new Set([...Array.from(prev), issueId]));
        }}
        filteredItemIds={filteredMovementIds || undefined}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="kpi-ingresos">
          <StatCardTitle>
            <ArrowUpRight className="h-4 w-4 text-positive" />
            Ingresos
          </StatCardTitle>
          <StatCardValue className="text-positive">
            {isCurrencyReady ? formatMoney(kpis.ingresos.value, currencySymbol) : '-'}
          </StatCardValue>
          {showIngresosBreakdown && (
            <StatCardSubValue>{formatBreakdown(kpis.ingresos)}</StatCardSubValue>
          )}
          <StatCardMeta>
            {kpis.ingresosCount} movimientos
          </StatCardMeta>
        </StatCard>
        <StatCard data-testid="kpi-egresos">
          <StatCardTitle>
            <ArrowDownRight className="h-4 w-4 text-negative" />
            Egresos
          </StatCardTitle>
          <StatCardValue className="text-negative">
            {isCurrencyReady ? formatMoney(kpis.egresos.value, currencySymbol) : '-'}
          </StatCardValue>
          {showEgresosBreakdown && (
            <StatCardSubValue>{formatBreakdown(kpis.egresos)}</StatCardSubValue>
          )}
          <StatCardMeta>
            {kpis.egresosCount} movimientos
          </StatCardMeta>
        </StatCard>
        <StatCard data-testid="kpi-balance">
          <StatCardTitle>
            <Scale className="h-4 w-4" />
            Balance
          </StatCardTitle>
          <StatCardValue className={kpis.balance >= 0 ? 'text-positive': 'text-negative'}>
            {isCurrencyReady 
              ? `${kpis.balance >= 0 ? '+': ''}${formatMoney(kpis.balance, currencySymbol)}`
              : '-'
            }
          </StatCardValue>
          <StatCardTrend 
            direction={balanceDirection} 
            value={balanceTrendLabel} 
          />
        </StatCard>
        <StatCard data-testid="kpi-total-movimientos">
          <StatCardTitle>
            <Hash className="h-4 w-4" />
            Total Movimientos
          </StatCardTitle>
          <StatCardValue>
            {kpis.totalMovimientos.formatted}
          </StatCardValue>
          <StatCardMeta>
            {kpis.ingresosCount} ingresos · {kpis.egresosCount} egresos
          </StatCardMeta>
        </StatCard>
      </div>
      <Table
        columns={columns}
        data={movements}
        isLoading={isLoading}
        emptyStateConfig={{
          icon: <DollarSign className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay movimientos',
          description: 'No se encontraron movimientos financieros en este proyecto.',
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
            variant: 'destructive'as const,
          },
        ]}
      />
    </div>
  );
}
