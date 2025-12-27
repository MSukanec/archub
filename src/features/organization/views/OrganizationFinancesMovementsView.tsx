/**
 * OrganizationFinancesMovementsView.tsx
 * 
 * Finanzas de ORGANIZACIÓN - muestra TODOS los movimientos de la organización
 * incluyendo los de proyectos. Incluye columna "Proyecto" para identificar origen.
 */
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useUnifiedMovements } from '@/features/finances/hooks/use-unified-movements';
import { useProjectContext } from '@/stores/projectContext';
import { useGlobalModalStore } from '@/components/modal/state/globalModalStore';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { useDeleteClientPayment } from '@/features/clients/hooks/use-client-payments';
import { useDeleteMaterialPayment } from '@/features/materials/hooks/use-material-payments';
import { useDeletePersonnelPayment } from '@/features/personnel/hooks/use-personnel-payments';
import { useDeleteGeneralCostPayment } from '@/hooks/use-general-costs-payments';
import { useDeletePartnerContribution, useDeletePartnerWithdrawal } from '@/features/capital';
import { useOrganizationDefaultCurrency, useOrgCurrencyContext } from '@/hooks/use-currencies';
import { useCurrentUser } from '@/features/users/hooks';
import { useFinancesDataHealth } from '@/core/data-health';
import { Table } from '@/components/shared/table';
import type { Column } from '@/components/shared/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { 
  AppCard, 
  AppCardTitle, 
  AppCardValue, 
  AppCardMeta,
  AppCardSubValue,
  AppCardTrend,
  type TrendDirection
} from '@/components';
import { calculateMonetaryKPI, calculateCountKPI, formatBreakdown, hasMultipleCurrencies } from '@/lib/kpis';
import { format as formatMoney } from '@/lib/money';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/date-utils';
import { DollarSign, Edit, Trash2, Paperclip, User, Package, Users, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Scale, Hash, Plus } from 'lucide-react';
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
    modalType: 'general-costs-payment',
    icon: DollarSign,
  },
};

interface OrganizationFinancesMovementsViewProps {
  externalFilterIssueId?: string | null;
  onClearExternalFilter?: () => void;
  getAffectedIdsForIssue?: (issueId: string) => Set<string | number>;
}

export function OrganizationFinancesMovementsView({
  externalFilterIssueId,
  onClearExternalFilter,
  getAffectedIdsForIssue: externalGetAffectedIds,
}: OrganizationFinancesMovementsViewProps = {}) {
  const { currentOrganizationId } = useProjectContext();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  
  const [internalFilterIssueId, setInternalFilterIssueId] = useState<string | null>(null);
  const [selectedMovements, setSelectedMovements] = useState<UnifiedMovementWithRelations[]>([]);
  
  const activeFilterIssueId = externalFilterIssueId ?? internalFilterIssueId;
  
  const setActiveFilterIssueId = useCallback((issueId: string | null) => {
    if (externalFilterIssueId && onClearExternalFilter) {
      onClearExternalFilter();
    }
    setInternalFilterIssueId(issueId);
  }, [externalFilterIssueId, onClearExternalFilter]);

  const handleAddMovement = useCallback(() => {
    openModal('unified-payment', {
      organizationId: currentOrganizationId,
      projectId: undefined,
      isProjectContext: false,
    });
  }, [currentOrganizationId, openModal]);
  
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(currentOrganizationId || undefined);
  const { isMultiCurrency } = useOrgCurrencyContext(currentOrganizationId || undefined);
  
  const { data: rawMovements = [], isLoading } = useUnifiedMovements(
    currentOrganizationId || undefined,
    null
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
    const getAffectedIds = externalGetAffectedIds || dataHealth.getAffectedIdsForIssue;
    return getAffectedIds(activeFilterIssueId);
  }, [activeFilterIssueId, dataHealth, externalGetAffectedIds]);

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
      baseCurrencyId: defaultCurrency?.code
    });

    const egresosKPI = calculateMonetaryKPI({
      items: egresosMovements.map(m => ({
        amount: m.amount,
        currency_id: m.currency_id,
        currency: m.currency,
        exchange_rate: m.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code
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
  const { mutate: deleteGeneralCostPayment, isPending: isDeleteGeneralCostPending } = useDeleteGeneralCostPayment();
  const deletePartnerContributionMutation = useDeletePartnerContribution();
  const deletePartnerWithdrawalMutation = useDeletePartnerWithdrawal();

  const formatCurrency = (amount: number, currencySymbol: string = '$') => {
    return `${currencySymbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount))}`;
  };

  const handleEdit = (movement: UnifiedMovementWithRelations) => {
    const config = MOVEMENT_TYPE_CONFIG[movement.movement_type];
    if (!config) return;

    const modalData: any = {
      projectId: movement.project_id,
      organizationId: movement.organization_id,
      mode: 'edit',
    };

    // Map the ID field based on movement type
    if (movement.movement_type === 'partner_contribution') {
      modalData.contributionId = movement.id;
    } else if (movement.movement_type === 'partner_withdrawal') {
      modalData.withdrawalId = movement.id;
    } else {
      modalData.paymentId = movement.id;
    }

    openModal(config.modalType, modalData);
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
        case 'general_cost_payment':
          return deleteGeneralCostPayment({
            paymentId: movement.id,
            organizationId: currentOrganizationId,
          });
        case 'partner_contribution':
          return deletePartnerContributionMutation.mutate({
            contributionId: movement.id,
            organizationId: currentOrganizationId,
          });
        case 'partner_withdrawal':
          return deletePartnerWithdrawalMutation.mutate({
            withdrawalId: movement.id,
            organizationId: currentOrganizationId,
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
                 deletePersonnelPaymentMutation.isPending ||
                 isDeleteGeneralCostPending ||
                 deletePartnerContributionMutation.isPending ||
                 deletePartnerWithdrawalMutation.isPending,
    });
  };

  const columns: Column<UnifiedMovementWithRelations>[] = [
    {
      key: 'payment_date',
      label: 'Fecha',
      type: 'date' as const,
      sortable: true,
      sortType: 'date',
      render: (movement) => {
        const date = parseLocalDate(movement.payment_date);
        return date ? format(date, 'dd/MM/yyyy') : '-';
      },
    },
    {
      key: 'movement_type',
      label: 'Tipo',
      type: 'name' as const,
      sortable: true,
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
      type: 'name' as const,
      sortable: true,
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
      type: 'long-text' as const,
      sortable: true,
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
      type: 'wallet' as const,
      sortable: true,
      render: (movement) => (
        <span className="text-sm truncate" title={movement.wallet?.name}>{movement.wallet?.name || '-'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      type: 'amount' as const,
      sortable: true,
      sortType: 'number',
      render: (movement) => {
        const isPositive = movement.signed_amount >= 0;
        return (
          <div className="flex flex-col items-end">
            <span 
              className="text-sm font-bold"
              style={{ color: isPositive ? 'var(--positive)' : 'var(--negative)' }}
            >
              {isPositive ? '+' : '-'}{formatCurrency(movement.amount, movement.currency?.symbol)}
            </span>
            {isMultiCurrency && movement.exchange_rate != null && (
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

  const balanceDirection: TrendDirection = kpis.balance > 0 ? 'up' : kpis.balance < 0 ? 'down' : 'neutral';
  const balanceTrendLabel = kpis.balance > 0 ? 'Positivo' : kpis.balance < 0 ? 'Negativo' : 'Sin variación';

  const showIngresosBreakdown = isCurrencyReady && hasMultipleCurrencies(kpis.ingresos) && kpis.ingresos.breakdown && kpis.ingresos.breakdown.length > 0;
  const showEgresosBreakdown = isCurrencyReady && hasMultipleCurrencies(kpis.egresos) && kpis.egresos.breakdown && kpis.egresos.breakdown.length > 0;

  // Show empty state if no movements
  if (sortedMovements.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={<DollarSign className="w-12 h-12" />}
        title="Aún no tenés movimientos financieros"
        description="Comienza registrando tu primer movimiento: pago a cliente, material, personal, o aporte de socio."
        action={
          <Button onClick={handleAddMovement} data-testid="button-create-first-movement">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Movimiento
          </Button>
        }
        data-testid="empty-finances-state"
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="organization-finances-movements-tab">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AppCard data-testid="kpi-ingresos">
          <AppCardTitle>
            <ArrowUpRight className="h-4 w-4 text-positive" />
            Ingresos
          </AppCardTitle>
          <AppCardValue style={{ color: 'var(--positive)' }}>
            {isCurrencyReady ? formatMoney(kpis.ingresos.value, currencySymbol) : '-'}
          </AppCardValue>
          {showIngresosBreakdown && (
            <AppCardSubValue>{formatBreakdown(kpis.ingresos)}</AppCardSubValue>
          )}
          <AppCardMeta>
            {kpis.ingresosCount} movimientos
          </AppCardMeta>
        </AppCard>

        <AppCard data-testid="kpi-egresos">
          <AppCardTitle>
            <ArrowDownRight className="h-4 w-4 text-negative" />
            Egresos
          </AppCardTitle>
          <AppCardValue style={{ color: 'var(--negative)' }}>
            {isCurrencyReady ? formatMoney(kpis.egresos.value, currencySymbol) : '-'}
          </AppCardValue>
          {showEgresosBreakdown && (
            <AppCardSubValue>{formatBreakdown(kpis.egresos)}</AppCardSubValue>
          )}
          <AppCardMeta>
            {kpis.egresosCount} movimientos
          </AppCardMeta>
        </AppCard>

        <AppCard data-testid="kpi-balance">
          <AppCardTitle>
            <Scale className="h-4 w-4" />
            Balance
          </AppCardTitle>
          <AppCardValue style={{ color: kpis.balance >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
            {isCurrencyReady 
              ? `${kpis.balance >= 0 ? '+' : ''}${formatMoney(kpis.balance, currencySymbol)}`
              : '-'
            }
          </AppCardValue>
          <AppCardTrend 
            direction={balanceDirection} 
            value={balanceTrendLabel} 
          />
        </AppCard>

        <AppCard data-testid="kpi-total-movimientos">
          <AppCardTitle>
            <Hash className="h-4 w-4" />
            Total Movimientos
          </AppCardTitle>
          <AppCardValue>
            {kpis.totalMovimientos.formatted}
          </AppCardValue>
          <AppCardMeta>
            {kpis.ingresosCount} ingresos · {kpis.egresosCount} egresos
          </AppCardMeta>
        </AppCard>
      </div>

      <Table
        columns={columns}
        data={movements}
        isLoading={isLoading}
        selectable={true}
        selectedItems={selectedMovements}
        onSelectionChange={setSelectedMovements}
        emptyStateConfig={{
          icon: <DollarSign className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay movimientos',
          description: 'No se encontraron movimientos financieros en la organización.',
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
