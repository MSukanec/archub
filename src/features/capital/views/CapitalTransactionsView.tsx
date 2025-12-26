import { useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Edit, Trash2, Plus, TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/shared/table';
import type { Column } from '@/components/shared/table';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/date-utils';
import { formatKPI, format as formatMoneyAmount } from '@/lib/money';
import { calculateMonetaryKPI, formatBreakdown as kpiFormatBreakdown } from '@/lib/kpis';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { useOrganizationDefaultCurrency, useOrgCurrencyContext } from '@/hooks/use-currencies';
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
import { PaymentStatusBadge, type PaymentStatus } from '@/components/shared/PaymentStatusBadge';

interface CapitalTransactionsViewProps {
  activeFilterIssueId?: string | null;
  getAffectedIdsForIssue?: (issueId: string) => Set<string>;
}

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

export function CapitalTransactionsView({ 
  activeFilterIssueId, 
  getAffectedIdsForIssue = () => new Set() 
}: CapitalTransactionsViewProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();

  const organizationId = userData?.organization?.id;

  const { data: contributions = [], isLoading: loadingContributions } = usePartnerContributions(organizationId);
  const { data: withdrawals = [], isLoading: loadingWithdrawals } = usePartnerWithdrawals(organizationId);
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);
  const { isMultiCurrency } = useOrgCurrencyContext(organizationId);
  const { data: partners = [], isLoading: loadingPartners } = usePartners(organizationId, { enabled: !!organizationId });

  const deleteContributionMutation = useDeletePartnerContribution();
  const deleteWithdrawalMutation = useDeletePartnerWithdrawal();

  const isLoading = loadingContributions || loadingWithdrawals || loadingPartners;

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
      return new Date(b.original.created_at).getTime() - new Date(a.original.created_at).getTime();
    });
  }, [contributions, withdrawals]);

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

  const filteredTransactions = useMemo(() => {
    if (!activeFilterIssueId) return transactionsWithLinkedUser;
    const issueIds = getAffectedIdsForIssue(activeFilterIssueId);
    return transactionsWithLinkedUser.filter(t => issueIds.has(t.id));
  }, [transactionsWithLinkedUser, activeFilterIssueId, getAffectedIdsForIssue]);

  const metrics = useMemo(() => {
    const confirmedTransactions = transactions.filter(t => t.status === 'confirmed');
    
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
      symbol: defaultCurrency?.symbol
    });

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
      symbol: defaultCurrency?.symbol
    });

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

  const handleAddTransaction = () => {
    if (!organizationId) {
      console.error('Cannot add transaction: organizationId is required');
      return;
    }
    openModal('capital-transaction', {
      organizationId,
    });
  };

  const columns: Column<UnifiedTransaction>[] = [
    {
      key: 'date',
      label: 'Fecha',
      type: 'date' as const,
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
      type: 'medium-text' as const,
      render: (item: UnifiedTransaction) => (
        <div className="flex items-center gap-2">
          {item.type === 'contribution' ? (
            <>
              <ArrowDownCircle className="h-4 w-4 text-[var(--positive)]" />
              <span className="text-sm">Aporte</span>
            </>
          ) : (
            <>
              <ArrowUpCircle className="h-4 w-4 text-[var(--negative)]" />
              <span className="text-sm">Retiro</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'partner_name',
      label: 'Socio',
      type: 'medium-text' as const,
      render: (item: UnifiedTransaction) => (
        <IdentityBadge 
          name={item.partner_name}
          linkedUser={item.linkedUser}
          size="sm"
        />
      ),
    },
    {
      key: 'notes',
      label: 'Notas',
      type: 'long-text' as const,
      render: (item: UnifiedTransaction) => (
        <span className="text-sm text-muted-foreground truncate">
          {item.notes || '-'}
        </span>
      ),
    },
    {
      key: 'wallet_name',
      label: 'Billetera',
      type: 'wallet' as const,
      render: (item: UnifiedTransaction) => (
        <span className="text-sm text-muted-foreground">
          {item.wallet_name || '-'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      type: 'amount' as const,
      align: 'right' as const,
      sortType: 'number' as const,
      render: (item: UnifiedTransaction) => (
        <div className="flex flex-col items-end">
          <span className={`text-sm font-medium ${item.type === 'contribution' ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
            {item.type === 'contribution' ? '+' : '-'}{item.currency_symbol} {item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {isMultiCurrency && item.exchange_rate != null && (
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
      type: 'status' as const,
      render: (item: UnifiedTransaction) => (
        <PaymentStatusBadge status={item.status as PaymentStatus} />
      ),
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

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<ArrowDownCircle />}
        title="No hay transacciones"
        description="Aún no se han registrado aportes ni retiros de capital."
        action={
          <Button onClick={handleAddTransaction} data-testid="button-empty-add-transaction">
            <Plus className="h-4 w-4 mr-1" />
            Nueva Transacción
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="card-total-contributions">
          <StatCardTitle showArrow={false}>
            <TrendingUp className="h-4 w-4" />
            Total Aportes
          </StatCardTitle>
          <StatCardValue className="text-[var(--positive)]">
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
          <StatCardValue className="text-[var(--negative)]">
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
          <StatCardValue className={metrics.net_balance_kpi.value >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>
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
                  <ArrowDownCircle className="h-5 w-5 text-[var(--positive)]" />
                ) : (
                  <ArrowUpCircle className="h-5 w-5 text-[var(--negative)]" />
                )}
                <span className="font-medium">{item.type === 'contribution' ? 'Aporte' : 'Retiro'}</span>
              </div>
              <PaymentStatusBadge status={item.status as PaymentStatus} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.partner_name}</span>
              <span className="text-sm text-muted-foreground">{format(parseLocalDate(item.date) || new Date(), 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`text-lg font-bold ${item.type === 'contribution' ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {item.type === 'contribution' ? '+' : '-'}{item.currency_symbol} {item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {isMultiCurrency && item.exchange_rate != null && (
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
