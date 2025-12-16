import { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Edit, Trash2, Plus, TrendingUp, TrendingDown, Wallet, Receipt, ChevronDown, Filter, X } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGlobalModalStore } from '@/components/modal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/date-utils';
import { formatKPI, format as formatMoneyAmount } from '@/lib/money';
import { calculateMonetaryKPI, formatBreakdown as kpiFormatBreakdown } from '@/lib/kpis';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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

type TransactionType = 'contribution' | 'withdrawal';

interface UnifiedTransaction {
  id: string;
  type: TransactionType;
  partner_id: string | null;
  partner_name: string;
  date: string;
  amount: number;
  currency_symbol: string;
  currency_code: string;
  currency_id: string;
  exchange_rate: number | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  notes: string | null;
  reference: string | null;
  original: PartnerContribution | PartnerWithdrawal;
  linkedUser?: { avatar_url?: string | null } | null;
}

function formatPartnerName(partner?: { contacts: { full_name: string | null; first_name: string | null; last_name: string | null; company_name: string | null; email?: string | null } | null }): string {
  if (!partner?.contacts) return 'Sin participante';
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

  // Filter states
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'contribution' | 'withdrawal'>('all');
  const [participantFilter, setParticipantFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  const { data: contributions = [], isLoading: loadingContributions } = usePartnerContributions(organizationId);
  const { data: withdrawals = [], isLoading: loadingWithdrawals } = usePartnerWithdrawals(organizationId);
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);
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
      date: c.contribution_date,
      amount: c.amount,
      currency_symbol: c.currency?.symbol || '$',
      currency_code: c.currency?.code || 'USD',
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
      date: w.withdrawal_date,
      amount: w.amount,
      currency_symbol: w.currency?.symbol || '$',
      currency_code: w.currency?.code || 'USD',
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

  // Get unique currencies and participants for filters
  const uniqueCurrencies = useMemo(() => {
    const currencies = new Map<string, { id: string; code: string; symbol: string }>();
    transactions.forEach(t => {
      if (!currencies.has(t.currency_id)) {
        currencies.set(t.currency_id, {
          id: t.currency_id,
          code: t.currency_code,
          symbol: t.currency_symbol,
        });
      }
    });
    return Array.from(currencies.values());
  }, [transactions]);

  const uniqueParticipants = useMemo(() => {
    const participantMap = new Map<string, { id: string; name: string }>();
    transactions.forEach(t => {
      if (t.partner_id && !participantMap.has(t.partner_id)) {
        participantMap.set(t.partner_id, {
          id: t.partner_id,
          name: t.partner_name,
        });
      }
    });
    return Array.from(participantMap.values());
  }, [transactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (participantFilter !== 'all' && t.partner_id !== participantFilter) return false;
      if (currencyFilter !== 'all' && t.currency_id !== currencyFilter) return false;
      return true;
    });
  }, [transactions, typeFilter, participantFilter, currencyFilter]);

  // Check if any filter is active
  const hasActiveFilters = typeFilter !== 'all' || participantFilter !== 'all' || currencyFilter !== 'all';

  // Clear all filters
  const clearFilters = () => {
    setTypeFilter('all');
    setParticipantFilter('all');
    setCurrencyFilter('all');
  };

  // Enrich transactions with linkedUser from partners
  const transactionsWithLinkedUser = useMemo(() => {
    return filteredTransactions.map(transaction => {
      const partnerData = partners.find(p => p.id === transaction.partner_id);
      const linkedUser = partnerData?.contacts?.linked_user;
      const resolvedLinkedUser = Array.isArray(linkedUser) ? linkedUser[0] : linkedUser;
      
      return {
        ...transaction,
        linkedUser: resolvedLinkedUser,
      };
    });
  }, [filteredTransactions, partners]);

  // KPI system - uses ALL transactions (not filtered)
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
      total_count: transactions.length,
      contributions_count: transactions.filter(t => t.type === 'contribution').length,
      withdrawals_count: transactions.filter(t => t.type === 'withdrawal').length,
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

    const typeLabel = transaction.type === 'contribution' ? 'aporte de capital' : 'retiro de capital';
    const formattedAmount = `${transaction.currency_symbol} ${transaction.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const itemLabel = `${transaction.partner_name} - ${formattedAmount}`;

    showDeleteConfirmation({
      mode: 'simple',
      title: `Eliminar ${typeLabel}`,
      description: `¿Estás seguro de que querés eliminar este ${typeLabel}? Esta acción no se puede deshacer.`,
      itemName: itemLabel,
      destructiveActionText: `Eliminar`,
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

  // Check if multi-currency
  const isMultiCurrency = uniqueCurrencies.length > 1;

  const columns = [
    {
      key: 'date',
      label: 'Fecha',
      width: '1fr',
      sortType: 'date' as const,
      render: (item: UnifiedTransaction) => (
        <span className="text-sm text-muted-foreground">
          {format(parseLocalDate(item.date) || new Date(), "d MMM yyyy", { locale: es })}
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
              <span className="text-sm font-medium">Aporte</span>
            </>
          ) : (
            <>
              <ArrowUpCircle className="h-4 w-4 text-[var(--chart-negative)]" />
              <span className="text-sm font-medium">Retiro</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'partner_name',
      label: 'Participante',
      width: '1.5fr',
      render: (item: UnifiedTransaction) => (
        <IdentityBadge 
          name={item.partner_name}
          linkedUser={item.linkedUser}
          size="sm"
        />
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '1.2fr',
      align: 'right' as const,
      sortType: 'number' as const,
      render: (item: UnifiedTransaction) => (
        <div className="flex flex-col items-end">
          <span className={`text-sm font-semibold ${item.type === 'contribution' ? 'text-[var(--chart-positive)]' : 'text-[var(--chart-negative)]'}`}>
            {item.type === 'contribution' ? '+' : '-'} {item.currency_symbol} {item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {isMultiCurrency && item.exchange_rate && item.exchange_rate !== 1 && (
            <span className="text-xs text-muted-foreground">
              TC: {item.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          )}
        </div>
      ),
    },
    ...(isMultiCurrency ? [{
      key: 'currency',
      label: 'Moneda',
      width: '0.8fr',
      render: (item: UnifiedTransaction) => (
        <Badge variant="outline" className="font-mono text-xs">
          {item.currency_code}
        </Badge>
      ),
    }] : []),
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

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="h-12 w-12" />}
        title="Sin movimientos de capital"
        description="Aún no se han registrado aportes ni retiros de capital en esta organización. Los movimientos de capital permiten llevar un registro patrimonial de los participantes."
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button data-testid="button-empty-new-movement">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Movimiento
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={handleAddContribution} data-testid="button-empty-add-contribution">
                <ArrowDownCircle className="h-4 w-4 mr-2 text-[var(--chart-positive)]" />
                Registrar Aporte
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddWithdrawal} data-testid="button-empty-add-withdrawal">
                <ArrowUpCircle className="h-4 w-4 mr-2 text-[var(--chart-negative)]" />
                Registrar Retiro
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="card-total-contributions">
          <StatCardTitle showArrow={false}>
            <TrendingUp className="h-4 w-4 text-[var(--chart-positive)]" />
            Total Aportes
          </StatCardTitle>
          <StatCardValue className="text-[var(--chart-positive)]">
            + {metrics.contributions_kpi.breakdown && metrics.contributions_kpi.breakdown.length > 0
              ? formatMoneyAmount(metrics.contributions_kpi.value, metrics.contributions_kpi.breakdown[0].currencySymbol)
              : formatKPI(metrics.contributions_kpi.value)
            }
          </StatCardValue>
          <StatCardMeta>
            {metrics.contributions_count} {metrics.contributions_count === 1 ? 'aporte' : 'aportes'}
            {metrics.contributions_kpi.breakdown && metrics.contributions_kpi.breakdown.length > 1 && (
              <> · {kpiFormatBreakdown(metrics.contributions_kpi)}</>
            )}
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="card-total-withdrawals">
          <StatCardTitle showArrow={false}>
            <TrendingDown className="h-4 w-4 text-[var(--chart-negative)]" />
            Total Retiros
          </StatCardTitle>
          <StatCardValue className="text-[var(--chart-negative)]">
            - {metrics.withdrawals_kpi.breakdown && metrics.withdrawals_kpi.breakdown.length > 0
              ? formatMoneyAmount(metrics.withdrawals_kpi.value, metrics.withdrawals_kpi.breakdown[0].currencySymbol)
              : formatKPI(metrics.withdrawals_kpi.value)
            }
          </StatCardValue>
          <StatCardMeta>
            {metrics.withdrawals_count} {metrics.withdrawals_count === 1 ? 'retiro' : 'retiros'}
            {metrics.withdrawals_kpi.breakdown && metrics.withdrawals_kpi.breakdown.length > 1 && (
              <> · {kpiFormatBreakdown(metrics.withdrawals_kpi)}</>
            )}
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="card-net-balance">
          <StatCardTitle showArrow={false}>
            <Wallet className="h-4 w-4" />
            Saldo Neto
          </StatCardTitle>
          <StatCardValue className={metrics.net_balance_kpi.value >= 0 ? 'text-[var(--chart-positive)]' : 'text-[var(--chart-negative)]'}>
            {metrics.net_balance_kpi.value >= 0 ? '+' : ''} {metrics.net_balance_kpi.breakdown && metrics.net_balance_kpi.breakdown.length > 0
              ? formatMoneyAmount(metrics.net_balance_kpi.value, metrics.net_balance_kpi.breakdown[0].currencySymbol)
              : formatKPI(metrics.net_balance_kpi.value)
            }
          </StatCardValue>
          <StatCardMeta>
            Capital neto acumulado
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="card-transactions-count">
          <StatCardTitle showArrow={false}>
            <Receipt className="h-4 w-4" />
            Transacciones
          </StatCardTitle>
          <StatCardValue>
            {metrics.total_count}
          </StatCardValue>
          <StatCardMeta>
            Movimientos de capital
          </StatCardMeta>
        </StatCard>
      </div>

      {/* Filters Section */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-toggle-filters">
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {[typeFilter !== 'all', participantFilter !== 'all', currencyFilter !== 'all'].filter(Boolean).length}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground" data-testid="button-clear-filters">
                <X className="h-3 w-3" />
                Limpiar filtros
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-testid="button-new-movement">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Movimiento
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddContribution} data-testid="button-add-contribution">
                  <ArrowDownCircle className="h-4 w-4 mr-2 text-[var(--chart-positive)]" />
                  Registrar Aporte
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddWithdrawal} data-testid="button-add-withdrawal">
                  <ArrowUpCircle className="h-4 w-4 mr-2 text-[var(--chart-negative)]" />
                  Registrar Retiro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CollapsibleContent className="mt-4">
          <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <Select value={typeFilter} onValueChange={(value: 'all' | 'contribution' | 'withdrawal') => setTypeFilter(value)}>
                <SelectTrigger className="h-9" data-testid="select-filter-type">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="contribution">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="h-3.5 w-3.5 text-[var(--chart-positive)]" />
                      Aportes
                    </div>
                  </SelectItem>
                  <SelectItem value="withdrawal">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-3.5 w-3.5 text-[var(--chart-negative)]" />
                      Retiros
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uniqueParticipants.length > 1 && (
              <div className="flex flex-col gap-1.5 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground">Participante</label>
                <Select value={participantFilter} onValueChange={setParticipantFilter}>
                  <SelectTrigger className="h-9" data-testid="select-filter-participant">
                    <SelectValue placeholder="Todos los participantes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los participantes</SelectItem>
                    {uniqueParticipants.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {uniqueCurrencies.length > 1 && (
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground">Moneda</label>
                <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                  <SelectTrigger className="h-9" data-testid="select-filter-currency">
                    <SelectValue placeholder="Todas las monedas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las monedas</SelectItem>
                    {uniqueCurrencies.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.symbol} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Filtered results info */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredTransactions.length} de {transactions.length} movimientos
        </div>
      )}

      {/* Table or empty filtered state */}
      {filteredTransactions.length === 0 && hasActiveFilters ? (
        <EmptyState
          icon={<Filter className="h-10 w-10" />}
          title="Sin resultados"
          description="No se encontraron movimientos con los filtros seleccionados."
          action={
            <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters-empty">
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <Table
          columns={columns}
          data={transactionsWithLinkedUser}
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
                <span className="text-sm text-muted-foreground">{format(parseLocalDate(item.date) || new Date(), "d MMM yyyy", { locale: es })}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`text-lg font-bold ${item.type === 'contribution' ? 'text-[var(--chart-positive)]' : 'text-[var(--chart-negative)]'}`}>
                    {item.type === 'contribution' ? '+' : '-'} {item.currency_symbol} {item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {isMultiCurrency && (
                    <span className="text-xs text-muted-foreground">{item.currency_code}</span>
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
      )}
    </div>
  );
}
