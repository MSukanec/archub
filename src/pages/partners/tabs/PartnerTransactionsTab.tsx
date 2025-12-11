import { useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Edit, Trash2, Plus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGlobalModalStore } from '@/components/modal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/date-utils';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import {
  usePartnerContributions,
  usePartnerWithdrawals,
  useDeletePartnerContribution,
  useDeletePartnerWithdrawal,
  type PartnerContribution,
  type PartnerWithdrawal,
} from '@/features/partners';
import { getClientPaymentStatusBadgeConfig } from '@/features/clients/utils/statusBadge';

type TransactionType = 'contribution' | 'withdrawal';

interface UnifiedTransaction {
  id: string;
  type: TransactionType;
  partner_id: string | null;
  partner_name: string;
  date: string;
  amount: number;
  currency_symbol: string;
  currency_id: string;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  notes: string | null;
  reference: string | null;
  original: PartnerContribution | PartnerWithdrawal;
}

function formatPartnerName(partner?: { contacts: { first_name: string | null; last_name: string | null; company_name: string | null } }): string {
  if (!partner?.contacts) return 'Sin socio';
  const { first_name, last_name, company_name } = partner.contacts;
  const fullName = `${first_name || ''} ${last_name || ''}`.trim();
  return fullName || company_name || 'Sin nombre';
}

export function PartnerTransactionsTab() {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();

  const organizationId = userData?.organization?.id;

  const { data: contributions = [], isLoading: loadingContributions } = usePartnerContributions(organizationId);
  const { data: withdrawals = [], isLoading: loadingWithdrawals } = usePartnerWithdrawals(organizationId);

  const deleteContributionMutation = useDeletePartnerContribution();
  const deleteWithdrawalMutation = useDeletePartnerWithdrawal();

  const isLoading = loadingContributions || loadingWithdrawals;

  const transactions = useMemo<UnifiedTransaction[]>(() => {
    const contributionItems: UnifiedTransaction[] = contributions.map((c) => ({
      id: c.id,
      type: 'contribution' as TransactionType,
      partner_id: c.partner_id,
      partner_name: formatPartnerName(c.partner),
      date: c.contribution_date,
      amount: c.amount,
      currency_symbol: c.currency?.symbol || '$',
      currency_id: c.currency_id,
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
      currency_id: w.currency_id,
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

  const metrics = useMemo(() => {
    let totalContributions = 0;
    let totalWithdrawals = 0;
    let countContributions = 0;
    let countWithdrawals = 0;

    transactions.forEach((t) => {
      if (t.status === 'confirmed') {
        if (t.type === 'contribution') {
          totalContributions += t.amount;
          countContributions += 1;
        } else {
          totalWithdrawals += t.amount;
          countWithdrawals += 1;
        }
      }
    });

    return {
      totalContributions,
      totalWithdrawals,
      netBalance: totalContributions - totalWithdrawals,
      countContributions,
      countWithdrawals,
    };
  }, [transactions]);

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
      width: '120px',
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
      width: '120px',
      render: (item: UnifiedTransaction) => (
        <div className="flex items-center gap-2">
          {item.type === 'contribution' ? (
            <>
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Aporte</span>
            </>
          ) : (
            <>
              <ArrowUpCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Retiro</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'partner_name',
      label: 'Socio',
      width: '120px',
      render: (item: UnifiedTransaction) => (
        <span className="text-sm font-medium">{item.partner_name}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '120px',
      align: 'right' as const,
      sortType: 'number' as const,
      render: (item: UnifiedTransaction) => (
        <span className={`text-sm font-medium ${item.type === 'contribution' ? 'text-green-600' : 'text-red-600'}`}>
          {item.type === 'contribution' ? '+' : '-'}{item.currency_symbol} {item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      width: '120px',
      render: (item: UnifiedTransaction) => {
        const config = getClientPaymentStatusBadgeConfig(item.status);
        return (
          <Badge variant={config.variant} className={config.className}>
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
        description="Aún no se han registrado aportes ni retiros de socios."
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard data-testid="card-total-contributions">
          <StatCardTitle showArrow={false}>Total Aportes</StatCardTitle>
          <StatCardValue className="text-green-600">
            ${metrics.totalContributions.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </StatCardValue>
          <StatCardMeta>{metrics.countContributions} aportes confirmados</StatCardMeta>
        </StatCard>

        <StatCard data-testid="card-total-withdrawals">
          <StatCardTitle showArrow={false}>Total Retiros</StatCardTitle>
          <StatCardValue className="text-red-600">
            ${metrics.totalWithdrawals.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </StatCardValue>
          <StatCardMeta>{metrics.countWithdrawals} retiros confirmados</StatCardMeta>
        </StatCard>

        <StatCard data-testid="card-net-balance">
          <StatCardTitle showArrow={false}>Saldo Neto</StatCardTitle>
          <StatCardValue className={metrics.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${metrics.netBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </StatCardValue>
          <StatCardMeta>Aportes - Retiros</StatCardMeta>
        </StatCard>
      </div>

      <Table
        columns={columns}
        data={transactions}
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
                  <ArrowDownCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <ArrowUpCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">{item.type === 'contribution' ? 'Aporte' : 'Retiro'}</span>
              </div>
              <Badge variant={getClientPaymentStatusBadgeConfig(item.status).variant} className={getClientPaymentStatusBadgeConfig(item.status).className}>
                {getClientPaymentStatusBadgeConfig(item.status).label}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.partner_name}</span>
              <span className="text-sm text-muted-foreground">{format(parseLocalDate(item.date) || new Date(), 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-lg font-bold ${item.type === 'contribution' ? 'text-green-600' : 'text-red-600'}`}>
                {item.type === 'contribution' ? '+' : '-'}{item.currency_symbol} {item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
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
