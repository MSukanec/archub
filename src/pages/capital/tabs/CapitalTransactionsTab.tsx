import { useMemo, useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Edit, Trash2, Plus, TrendingUp, TrendingDown, Wallet, Receipt, AlertTriangle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGlobalModalStore } from '@/components/modal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/date-utils';
import { formatKPI, format as formatMoneyAmount } from '@/lib/money';
import { calculateMonetaryKPI, formatBreakdown as kpiFormatBreakdown } from '@/lib/kpis';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import {
  usePartners,
  usePartnerContributions,
  usePartnerWithdrawals,
  useDeletePartnerContribution,
  useDeletePartnerWithdrawal,
  type PartnerContribution,
  type PartnerWithdrawal,
} from '@/features/capital';
import { getPartnerTransactionStatusBadgeConfig } from '@/features/capital/utils/statusBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCapitalDataHealth, type NormalizedCapitalTransaction } from '@/core/data-health';

type TransactionType = 'contribution' | 'withdrawal';

interface UnifiedTransaction {
  id: string;
  type: TransactionType;
  partner_id: string | null;
  partner_name: string;
  wallet_name: string | null;
  date: string;
  amount: number;
  currency_symbol: string;
  currency_id: string;
  exchange_rate: number | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  notes: string | null;
  reference: string | null;
  original: PartnerContribution | PartnerWithdrawal;
  linkedUser?: { avatar_url?: string | null } | null;
}

function formatPartnerName(partner?: { contacts: { full_name: string | null; first_name: string | null; last_name: string | null; company_name: string | null; email?: string | null } | null }): string {
  if (!partner?.contacts) return 'Sin socio';
  const { full_name, first_name, last_name, company_name, email } = partner.contacts;
  if (full_name) return full_name;
  const constructedName = `${first_name || ''} ${last_name || ''}`.trim();
  return constructedName || company_name || email || 'Sin nombre';
}

export function CapitalTransactionsTab() {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();

  const organizationId = userData?.organization?.id;

  const { data: contributions = [], isLoading: loadingContributions } = usePartnerContributions(organizationId);
  const { data: withdrawals = [], isLoading: loadingWithdrawals } = usePartnerWithdrawals(organizationId);
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);
  const { data: partners = [], isLoading: loadingPartners } = usePartners(organizationId, { enabled: !!organizationId });

  const deleteContributionMutation = useDeletePartnerContribution();
  const deleteWithdrawalMutation = useDeletePartnerWithdrawal();

  const isLoading = loadingContributions || loadingWithdrawals || loadingPartners;

  const [showOnlyProblems, setShowOnlyProblems] = useState(false);

  const transactions = useMemo<UnifiedTransaction[]>(() => {
    const contributionItems: UnifiedTransaction[] = contributions.map((c) => ({
      id: c.id,
      type: 'contribution' as TransactionType,
      partner_id: c.partner_id,
      partner_name: formatPartnerName(c.partner),
      wallet_name: (c as any).organization_wallet?.wallets?.name || null,
      date: c.contribution_date,
      amount: c.amount,
      currency_symbol: c.currency?.symbol || '$',
      currency_id: c.currency_id,
      exchange_rate: c.exchange_rate || null,
      status: c.status,
      notes: c.notes,
      reference: c.reference,
      original: c,
    }));

    const withdrawalItems: UnifiedTransaction[] = withdrawals.map((w) => ({
      id: w.id,
      type: 'withdrawal' as TransactionType,
      partner_id: w.partner_id,
      partner_name: formatPartnerName(w.partner),
      wallet_name: (w as any).organization_wallet?.wallets?.name || null,
      date: w.withdrawal_date,
      amount: w.amount,
      currency_symbol: w.currency?.symbol || '$',
      currency_id: w.currency_id,
      exchange_rate: w.exchange_rate || null,
      status: w.status,
      notes: w.notes,
      reference: w.reference,
      original: w,
    }));

    return [...contributionItems, ...withdrawalItems].sort((a, b) => {
      const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      // Si las fechas son iguales, ordenar por fecha de creación (más recientes primero)
      return new Date(b.original.created_at).getTime() - new Date(a.original.created_at).getTime();
    });
  }, [contributions, withdrawals]);

  // Enrich transactions with linkedUser from partners
  const transactionsWithLinkedUser = useMemo(() => {
    return transactions.map(transaction => {
      const partnerData = partners.find(p => p.id === transaction.partner_id);
      const linkedUser = partnerData?.contacts?.linked_user;
      const resolvedLinkedUser = Array.isArray(linkedUser) ? linkedUser[0] : linkedUser;
      
      return {
        ...transaction,
        linkedUser: resolvedLinkedUser,
      };
    });
  }, [transactions, partners]);

  // Preparar transacciones para Data Health
  const normalizedForHealth = useMemo<NormalizedCapitalTransaction[]>(() => {
    return transactions.map(t => ({
      id: t.id,
      type: t.type,
      partnerName: t.partner_name,
      walletId: (t.original as any).wallet_id || null,
      walletName: t.wallet_name,
      date: t.date,
      amount: t.amount,
      currencyId: t.currency_id,
      exchangeRate: t.exchange_rate,
    }));
  }, [transactions]);

  // Data Health: detectar problemas en las transacciones
  const dataHealth = useCapitalDataHealth(normalizedForHealth, {
    organizationId: organizationId || '',
    defaultCurrencyId: defaultCurrency?.id,
    enabled: !!organizationId && transactions.length > 0,
  });

  // Auto-reset del filtro cuando ya no hay problemas
  useEffect(() => {
    if (showOnlyProblems && !dataHealth.hasIssues) {
      setShowOnlyProblems(false);
    }
  }, [showOnlyProblems, dataHealth.hasIssues]);

  // Filtrar transacciones: mostrar todas o solo las que tienen problemas
  const filteredTransactions = useMemo(() => {
    if (!showOnlyProblems) return transactionsWithLinkedUser;
    return transactionsWithLinkedUser.filter(t => dataHealth.affectedIds.has(t.id));
  }, [transactionsWithLinkedUser, showOnlyProblems, dataHealth.affectedIds]);

  // KPI system - REFACTORIZADO
  const metrics = useMemo(() => {
    // Filter confirmed transactions
    const confirmedTransactions = transactions.filter(t => t.status === 'confirmed');
    
    // KPI: Total Aportes (contributions)
    const contributionsKPI = calculateMonetaryKPI({
      items: confirmedTransactions
        .filter(t => t.type === 'contribution')
        .map(t => ({
          amount: t.amount,
          currency_id: t.currency_id,
          currency: { id: t.currency_id, code: t.original.currency?.code, symbol: t.currency_symbol },
          exchange_rate: t.exchange_rate
        })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol  // Use base currency symbol
    });

    // KPI: Total Retiros (withdrawals)
    const withdrawalsKPI = calculateMonetaryKPI({
      items: confirmedTransactions
        .filter(t => t.type === 'withdrawal')
        .map(t => ({
          amount: t.amount,
          currency_id: t.currency_id,
          currency: { id: t.currency_id, code: t.original.currency?.code, symbol: t.currency_symbol },
          exchange_rate: t.exchange_rate
        })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol  // Use base currency symbol
    });

    // KPI: Saldo Neto (net balance = contributions - withdrawals)
    const netBalance = contributionsKPI.value - withdrawalsKPI.value;
    const netBalanceKPI = {
      ...contributionsKPI,
      value: netBalance,
      formatted: formatKPI(netBalance)
    };

    return {
      contributions_kpi: contributionsKPI,
      withdrawals_kpi: withdrawalsKPI,
      net_balance_kpi: netBalanceKPI,
    };
  }, [transactions, defaultCurrency]);

  const handleEdit = (transaction: UnifiedTransaction) => {
    if (!organizationId) {
      console.error('Cannot edit transaction: organizationId is required');
      return;
    }

    if (transaction.type === 'contribution') {
      openModal('partner-contribution', {
        organizationId,
        contributionId: transaction.id,
        mode: 'edit',
      });
    } else {
      openModal('partner-withdrawal', {
        organizationId,
        withdrawalId: transaction.id,
        mode: 'edit',
      });
    }
  };

  const handleDelete = (transaction: UnifiedTransaction) => {
    if (!organizationId) {
      console.error('Cannot delete transaction: organizationId is required');
      return;
    }

    const typeLabel = transaction.type === 'contribution' ? 'aporte' : 'retiro';
    const formattedAmount = `${transaction.currency_symbol} ${transaction.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const itemLabel = `${transaction.partner_name} - ${formattedAmount}`;

    showDeleteConfirmation({
      mode: 'simple',
      title: `Eliminar ${typeLabel}`,
      description: `¿Estás seguro de que querés eliminar este ${typeLabel}? Esta acción no se puede deshacer.`,
      itemName: itemLabel,
      destructiveActionText: `Eliminar ${typeLabel}`,
      onDelete: () => {
        if (transaction.type === 'contribution') {
          deleteContributionMutation.mutate({
            contributionId: transaction.id,
            organizationId,
          });
        } else {
          deleteWithdrawalMutation.mutate({
            withdrawalId: transaction.id,
            organizationId,
          });
        }
      },
      isLoading: deleteContributionMutation.isPending || deleteWithdrawalMutation.isPending,
    });
  };

  const handleAddContribution = () => {
    if (!organizationId) {
      console.error('Cannot add contribution: organizationId is required');
      return;
    }
    openModal('partner-contribution', {
      organizationId,
    });
  };

  const handleAddWithdrawal = () => {
    if (!organizationId) {
      console.error('Cannot add withdrawal: organizationId is required');
      return;
    }
    openModal('partner-withdrawal', {
      organizationId,
    });
  };

  const columns = [
    {
      key: 'date',
      label: 'Fecha',
      width: '1fr',
      sortType: 'date' as const,
      render: (item: UnifiedTransaction) => (
        <span className="text-sm text-muted-foreground">
          {format(parseLocalDate(item.date) || new Date(), 'dd/MM/yyyy')}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      width: '1fr',
      render: (item: UnifiedTransaction) => (
        <div className="flex items-center gap-2">
          {item.type === 'contribution' ? (
            <>
              <ArrowDownCircle className="h-4 w-4 text-[var(--chart-positive)]" />
              <span className="text-sm">Aporte</span>
            </>
          ) : (
            <>
              <ArrowUpCircle className="h-4 w-4 text-[var(--chart-negative)]" />
              <span className="text-sm">Retiro</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'partner_name',
      label: 'Socio',
      width: '1fr',
      render: (item: UnifiedTransaction) => (
        <IdentityBadge 
          name={item.partner_name}
          linkedUser={item.linkedUser}
          size="sm"
        />
      ),
    },
    {
      key: 'wallet_name',
      label: 'Billetera',
      width: '1fr',
      render: (item: UnifiedTransaction) => (
        <span className="text-sm text-muted-foreground">
          {item.wallet_name || '-'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '1fr',
      align: 'right' as const,
      sortType: 'number' as const,
      render: (item: UnifiedTransaction) => (
        <div className="flex flex-col items-end">
          <span className={`text-sm font-medium ${item.type === 'contribution' ? 'text-[var(--chart-positive)]' : 'text-[var(--chart-negative)]'}`}>
            {item.type === 'contribution' ? '+' : '-'}{item.currency_symbol} {item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {item.exchange_rate && item.exchange_rate !== 1 && (
            <span className="text-xs text-muted-foreground">
              Cot. {item.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      width: '1fr',
      render: (item: UnifiedTransaction) => {
        const config = getPartnerTransactionStatusBadgeConfig(item.status);
        return (
          <Badge 
            variant="default"
            style={{
              color: `var(${config.colorVar})`,
              backgroundColor: `color-mix(in srgb, var(${config.colorVar}) 10%, transparent)`,
              borderColor: `color-mix(in srgb, var(${config.colorVar}) 30%, transparent)`,
            }}
          >
            {config.label}
          </Badge>
        );
      },
    },
  ];

  const rowActions = (item: UnifiedTransaction) => [
    {
      label: 'Editar',
      icon: Edit,
      onClick: () => handleEdit(item),
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      onClick: () => handleDelete(item),
      variant: 'destructive' as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show only empty state when no transactions
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<ArrowDownCircle />}
        title="No hay transacciones"
        description="Aún no se han registrado aportes ni retiros de capital."
        action={
          <div className="flex items-center gap-2">
            <Button onClick={handleAddContribution} data-testid="button-empty-add-contribution">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Aporte
            </Button>
            <Button onClick={handleAddWithdrawal} data-testid="button-empty-add-withdrawal">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Retiro
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerta de Data Health */}
      {dataHealth.hasIssues && (
        <Alert 
          variant="default" 
          className={`cursor-pointer transition-all border-chart-negative/30 bg-chart-negative/5 hover:bg-chart-negative/10 ${showOnlyProblems ? 'ring-2 ring-chart-negative/50' : ''}`}
          onClick={() => setShowOnlyProblems(!showOnlyProblems)}
          data-testid="capital-data-health-alert"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-chart-negative" />
              <AlertDescription className="text-sm">
                <span className="font-medium text-chart-negative">
                  {dataHealth.affectedIds.size} transacción{dataHealth.affectedIds.size !== 1 ? 'es' : ''} con problemas
                </span>
                <span className="text-muted-foreground ml-2">
                  {showOnlyProblems ? '(mostrando solo problemáticas)' : '- Click para filtrar'}
                </span>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="card-total-contributions">
          <StatCardTitle showArrow={false}>
            <TrendingUp className="h-4 w-4" />
            Total Aportes
          </StatCardTitle>
          <StatCardValue className="text-[var(--chart-positive)]">
            {metrics.contributions_kpi.breakdown && metrics.contributions_kpi.breakdown.length > 0
              ? formatMoneyAmount(metrics.contributions_kpi.value, metrics.contributions_kpi.breakdown[0].currencySymbol)
              : formatKPI(metrics.contributions_kpi.value)
            }
          </StatCardValue>
          <StatCardMeta>
            {metrics.contributions_kpi.breakdown && metrics.contributions_kpi.breakdown.length > 0
              ? kpiFormatBreakdown(metrics.contributions_kpi)
              : 'Sin aportes confirmados'}
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="card-total-withdrawals">
          <StatCardTitle showArrow={false}>
            <TrendingDown className="h-4 w-4" />
            Total Retiros
          </StatCardTitle>
          <StatCardValue className="text-[var(--chart-negative)]">
            {metrics.withdrawals_kpi.breakdown && metrics.withdrawals_kpi.breakdown.length > 0
              ? formatMoneyAmount(metrics.withdrawals_kpi.value, metrics.withdrawals_kpi.breakdown[0].currencySymbol)
              : formatKPI(metrics.withdrawals_kpi.value)
            }
          </StatCardValue>
          <StatCardMeta>
            {metrics.withdrawals_kpi.breakdown && metrics.withdrawals_kpi.breakdown.length > 0
              ? kpiFormatBreakdown(metrics.withdrawals_kpi)
              : 'Sin retiros confirmados'}
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="card-net-balance">
          <StatCardTitle showArrow={false}>
            <Wallet className="h-4 w-4" />
            Saldo Neto
          </StatCardTitle>
          <StatCardValue className={metrics.net_balance_kpi.value >= 0 ? 'text-[var(--chart-positive)]' : 'text-[var(--chart-negative)]'}>
            {metrics.net_balance_kpi.breakdown && metrics.net_balance_kpi.breakdown.length > 0
              ? formatMoneyAmount(metrics.net_balance_kpi.value, metrics.net_balance_kpi.breakdown[0].currencySymbol)
              : formatKPI(metrics.net_balance_kpi.value)
            }
          </StatCardValue>
          <StatCardMeta>
            {metrics.net_balance_kpi.breakdown && metrics.net_balance_kpi.breakdown.length > 0
              ? kpiFormatBreakdown(metrics.net_balance_kpi)
              : 'Sin saldo'}
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="card-transactions-count">
          <StatCardTitle showArrow={false}>
            <Receipt className="h-4 w-4" />
            Transacciones
          </StatCardTitle>
          <StatCardValue>
            {transactions.length}
          </StatCardValue>
          <StatCardMeta>
            Movimientos registrados
          </StatCardMeta>
        </StatCard>
      </div>

      <Table
        columns={columns}
        data={filteredTransactions}
        rowActions={rowActions}
        defaultSort={{ key: 'date', direction: 'desc' }}
        topBar={{
          showSearch: true,
        }}
        renderCard={(item: UnifiedTransaction) => (
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.type === 'contribution' ? (
                  <ArrowDownCircle className="h-5 w-5 text-[var(--chart-positive)]" />
                ) : (
                  <ArrowUpCircle className="h-5 w-5 text-[var(--chart-negative)]" />
                )}
                <span className="font-medium">{item.type === 'contribution' ? 'Aporte' : 'Retiro'}</span>
              </div>
              {(() => {
                const config = getPartnerTransactionStatusBadgeConfig(item.status);
                return (
                  <Badge 
                    variant="default"
                    style={{
                      color: `var(${config.colorVar})`,
                      backgroundColor: `color-mix(in srgb, var(${config.colorVar}) 10%, transparent)`,
                      borderColor: `color-mix(in srgb, var(${config.colorVar}) 30%, transparent)`,
                    }}
                  >
                    {config.label}
                  </Badge>
                );
              })()}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.partner_name}</span>
              <span className="text-sm text-muted-foreground">{format(parseLocalDate(item.date) || new Date(), 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`text-lg font-bold ${item.type === 'contribution' ? 'text-[var(--chart-positive)]' : 'text-[var(--chart-negative)]'}`}>
                  {item.type === 'contribution' ? '+' : '-'}{item.currency_symbol} {item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {item.exchange_rate && item.exchange_rate !== 1 && (
                  <span className="text-xs text-muted-foreground">
                    Cot. {item.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(item)} data-testid={`button-edit-transaction-${item.id}`}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item)} data-testid={`button-delete-transaction-${item.id}`}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
