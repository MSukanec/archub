import { useMemo, useState } from 'react';
import { DollarSign, Plus, Edit, Trash2, Paperclip, Eye, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/stat-card';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useGeneralCostsPayments, useDeleteGeneralCostPayment, type GeneralCostPayment } from '@/hooks/use-general-costs-payments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GeneralCostPaymentRow } from '@/components/ui/data-row';

export default function GeneralCostsPaymentsTab() {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  
  const organizationId = userData?.organization?.id;

  // Filter states
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterGeneralCost, setFilterGeneralCost] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: allPayments = [], isLoading } = useGeneralCostsPayments(organizationId);
  const deletePaymentMutation = useDeleteGeneralCostPayment();

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const wallets = new Set<string>();
    const currencies = new Set<string>();
    const generalCosts = new Set<string>();

    allPayments.forEach(payment => {
      if (payment.wallet?.wallets?.name) wallets.add(payment.wallet.wallets.name);
      if (payment.currency?.code) currencies.add(payment.currency.code);
      if (payment.general_cost?.name) generalCosts.add(payment.general_cost.name);
    });

    return {
      wallets: Array.from(wallets).sort(),
      currencies: Array.from(currencies).sort(),
      generalCosts: Array.from(generalCosts).sort(),
    };
  }, [allPayments]);

  // Apply filters
  const filteredPayments = useMemo(() => {
    return allPayments.filter(payment => {
      if (filterWallet !== 'all' && payment.wallet?.wallets?.name !== filterWallet) return false;
      if (filterCurrency !== 'all' && payment.currency?.code !== filterCurrency) return false;
      if (filterGeneralCost !== 'all' && payment.general_cost?.name !== filterGeneralCost) return false;
      if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
      return true;
    });
  }, [allPayments, filterWallet, filterCurrency, filterGeneralCost, filterStatus]);

  // Calculate metrics
  const metricsData = useMemo(() => {
    const currencyGroups = new Map<string, {
      total_confirmed: number;
      total_pending: number;
      total_rejected: number;
      count_confirmed: number;
      count_pending: number;
      count_rejected: number;
    }>();

    let latestPaymentDate: string | null = null;

    allPayments.forEach(payment => {
      if (!payment.currency) return;

      const currencyId = payment.currency.id;
      if (!currencyGroups.has(currencyId)) {
        currencyGroups.set(currencyId, {
          total_confirmed: 0,
          total_pending: 0,
          total_rejected: 0,
          count_confirmed: 0,
          count_pending: 0,
          count_rejected: 0,
        });
      }

      const group = currencyGroups.get(currencyId)!;
      if (payment.status === 'confirmed') {
        group.total_confirmed += payment.amount;
        group.count_confirmed += 1;
      } else if (payment.status === 'pending') {
        group.total_pending += payment.amount;
        group.count_pending += 1;
      } else if (payment.status === 'rejected') {
        group.total_rejected += payment.amount;
        group.count_rejected += 1;
      }

      if (!latestPaymentDate || payment.payment_date > latestPaymentDate) {
        latestPaymentDate = payment.payment_date;
      }
    });

    const by_currency = Array.from(currencyGroups.entries()).map(([currencyId, group]) => {
      const currency = allPayments.find(p => p.currency?.id === currencyId)?.currency;
      return {
        currency_id: currencyId,
        currency_code: currency?.code || 'ARS',
        currency_symbol: currency?.symbol || '$',
        ...group,
      };
    });

    return {
      total_count: allPayments.length,
      by_currency,
      latest_payment_date: latestPaymentDate,
    };
  }, [allPayments]);

  const handleEdit = (payment: GeneralCostPayment) => {
    if (!organizationId) return;
    openModal('general-costs-payment', {
      organizationId,
      paymentId: payment.id,
      mode: 'edit',
    });
  };

  const handleDelete = (payment: GeneralCostPayment) => {
    if (!organizationId) return;

    const generalCostName = payment.general_cost?.name || 'Sin categoría';
    const symbol = payment.currency?.symbol || '$';
    const formattedAmount = `${symbol} ${payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const paymentLabel = `${generalCostName} - ${formattedAmount}`;
    
    showDeleteConfirmation({
      mode: 'simple',
      title: "Eliminar pago",
      description: `¿Estás seguro de que querés eliminar este pago? Esta acción no se puede deshacer.`,
      itemName: paymentLabel,
      destructiveActionText: "Eliminar pago",
      onDelete: () => deletePaymentMutation.mutate({
        paymentId: payment.id,
        organizationId,
      }),
      isLoading: deletePaymentMutation.isPending
    });
  };

  const handleView = (payment: GeneralCostPayment) => {
    if (!organizationId) return;
    openModal('general-costs-payment', {
      organizationId,
      editingPayment: payment,
    });
  };

  const handleAddPayment = () => {
    if (!organizationId) return;
    openModal('general-costs-payment', {
      organizationId,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const formatAmount = (amount: number, currencySymbol: string | undefined) => {
    const symbol = currencySymbol || '$';
    return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: 'confirmed' | 'pending' | 'rejected' | 'void') => {
    const statusConfig = {
      confirmed: { label: 'Confirmado', className: 'bg-green-600 text-white hover:bg-green-600' },
      pending: { label: 'Pendiente', className: 'bg-orange-600 text-white hover:bg-orange-600' },
      rejected: { label: 'Rechazado', className: 'bg-red-600 text-white hover:bg-red-600' },
      void: { label: 'Anulado', className: 'bg-gray-600 text-white hover:bg-gray-600' },
    };
    return statusConfig[status];
  };

  const formatCurrencyKPI = (currencyData: Array<{ currency_symbol: string; amount: number }>) => {
    if (!currencyData || currencyData.length === 0) return '-';
    
    return currencyData.map(({ currency_symbol, amount }) => {
      const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${currency_symbol} ${formattedAmount}`;
    }).join(' · ');
  };

  const columns = [
    {
      key: 'payment_date',
      label: 'Fecha de Pago',
      sortable: true,
      align: 'right' as const,
      render: (payment: GeneralCostPayment) => formatDate(payment.payment_date),
    },
    {
      key: 'general_cost',
      label: 'Gasto General',
      sortable: true,
      width: '220px',
      render: (payment: GeneralCostPayment) => (
        <div>
          <div className="font-bold">{payment.general_cost?.name || 'Sin categoría'}</div>
          {payment.general_cost?.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">{payment.general_cost.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'notes',
      label: 'Notas',
      sortable: true,
      width: '400px',
      render: (payment: GeneralCostPayment) => (
        <div className="max-w-full truncate text-xs" title={payment.notes || ''}>
          {payment.notes || '-'}
        </div>
      ),
    },
    {
      key: 'wallet',
      label: 'Billetera',
      sortable: true,
      align: 'right' as const,
      cellClassName: 'font-bold',
      render: (payment: GeneralCostPayment) => payment.wallet?.wallets?.name || '-',
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      sortType: 'number' as const,
      render: (payment: GeneralCostPayment) => (
        <div className="flex flex-col items-end">
          <span className="font-bold">{formatAmount(payment.amount, payment.currency?.symbol)}</span>
          <span className="text-xs text-muted-foreground" style={{ fontSize: '12px' }}>
            Cot. {payment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (payment: GeneralCostPayment) => {
        const statusInfo = getStatusBadge(payment.status);
        return (
          <Badge className={statusInfo.className}>
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      key: 'attachments',
      label: (<Paperclip className="h-4 w-4" />) as any,
      sortable: false,
      align: 'center' as const,
      width: '50px',
      render: (payment: GeneralCostPayment) => {
        const attachmentCount = payment.file_url ? 1 : 0;
        return (
          <span className={attachmentCount > 0 ? 'font-medium' : 'text-muted-foreground'}>
            {attachmentCount}
          </span>
        );
      },
    },
  ];

  const isFilterActive = 
    filterWallet !== 'all' || 
    filterCurrency !== 'all' || 
    filterGeneralCost !== 'all' ||
    filterStatus !== 'all';

  const handleClearFilters = () => {
    setFilterWallet('all');
    setFilterCurrency('all');
    setFilterGeneralCost('all');
    setFilterStatus('all');
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se pudo cargar la información de la organización</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Cargando pagos...</div>
      </div>
    );
  }

  if (allPayments.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={<DollarSign className="w-8 h-8 text-muted-foreground" />}
          title="No hay pagos registrados"
          description="Comienza agregando tus pagos de gastos generales para llevar un registro detallado de los egresos de la organización. Los pagos incluyen información de monto, billetera, fecha, estado y archivos adjuntos."
          action={
            <Button onClick={handleAddPayment} data-testid="button-add-payment">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pago
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard data-testid="stat-card-total-pagos">
          <StatCardTitle showArrow={false}>
            <DollarSign className="w-4 h-4 inline mr-1" />
            Total Pagos
          </StatCardTitle>
          <StatCardValue className="text-2xl md:text-3xl">
            {metricsData?.total_count ?? 0}
          </StatCardValue>
          <StatCardMeta>Cantidad de pagos registrados</StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-total-confirmado">
          <StatCardTitle showArrow={false}>
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Total Confirmado
          </StatCardTitle>
          <StatCardValue className="text-2xl md:text-3xl text-green-600 dark:text-green-400">
            {formatCurrencyKPI(
              metricsData?.by_currency?.map(c => ({
                currency_symbol: c.currency_symbol,
                amount: c.total_confirmed
              })) ?? []
            )}
          </StatCardValue>
          <StatCardMeta>
            {metricsData?.by_currency?.reduce((sum, c) => sum + c.count_confirmed, 0) ?? 0} pagos confirmados
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-total-pendiente">
          <StatCardTitle showArrow={false}>
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Total Pendiente
          </StatCardTitle>
          <StatCardValue className="text-2xl md:text-3xl text-orange-600 dark:text-orange-400">
            {formatCurrencyKPI(
              metricsData?.by_currency?.map(c => ({
                currency_symbol: c.currency_symbol,
                amount: c.total_pending
              })) ?? []
            )}
          </StatCardValue>
          <StatCardMeta>
            {metricsData?.by_currency?.reduce((sum, c) => sum + c.count_pending, 0) ?? 0} pagos pendientes
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-ultimo-pago">
          <StatCardTitle showArrow={false}>
            <Calendar className="w-4 h-4 inline mr-1" />
            Último Pago
          </StatCardTitle>
          <StatCardValue className="text-2xl md:text-3xl">
            {metricsData?.latest_payment_date 
              ? format(new Date(metricsData.latest_payment_date), 'd/M/yyyy')
              : '-'
            }
          </StatCardValue>
          <StatCardMeta>Fecha del último pago registrado</StatCardMeta>
        </StatCard>
      </div>

      <Table
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
        showDoubleHeader={false}
        renderCard={(payment: GeneralCostPayment) => (
          <GeneralCostPaymentRow
            payment={payment}
            onClick={() => handleView(payment)}
          />
        )}
        emptyStateConfig={{
          icon: <DollarSign className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay pagos registrados',
          description: 'Agrega pagos de gastos generales para llevar un registro de los egresos de la organización.',
          action: (
            <Button
              onClick={handleAddPayment}
              size="sm"
              data-testid="button-add-payment-empty"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Pago
            </Button>
          ),
        }}
        topBar={{
          showFilter: true,
          isFilterActive,
          onClearFilters: handleClearFilters,
          renderFilterContent: () => (
            <div className="space-y-3 p-2 min-w-[200px]">
              {/* Filter by General Cost */}
              {filterOptions.generalCosts.length > 0 && (
                <div>
                  <Label className="text-xs font-medium mb-1 block">Gasto General</Label>
                  <Select value={filterGeneralCost} onValueChange={setFilterGeneralCost}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {filterOptions.generalCosts.map(gc => (
                        <SelectItem key={gc} value={gc}>{gc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filter by Wallet */}
              {filterOptions.wallets.length > 0 && (
                <div>
                  <Label className="text-xs font-medium mb-1 block">Billetera</Label>
                  <Select value={filterWallet} onValueChange={setFilterWallet}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {filterOptions.wallets.map(wallet => (
                        <SelectItem key={wallet} value={wallet}>{wallet}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filter by Currency */}
              {filterOptions.currencies.length > 0 && (
                <div>
                  <Label className="text-xs font-medium mb-1 block">Moneda</Label>
                  <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {filterOptions.currencies.map(currency => (
                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filter by Status */}
              <div>
                <Label className="text-xs font-medium mb-1 block">Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                    <SelectItem value="void">Anulado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ),
        }}
        primaryRowAction={(payment: GeneralCostPayment) => ({
          label: 'Ver',
          onClick: () => handleView(payment),
        })}
        rowActions={(payment: GeneralCostPayment) => [
          {
            label: 'Editar Pago',
            icon: Edit,
            onClick: () => handleEdit(payment),
          },
          {
            label: 'Eliminar Pago',
            icon: Trash2,
            onClick: () => handleDelete(payment),
            variant: 'destructive' as const,
          },
        ]}
      />
    </div>
  );
}
