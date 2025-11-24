import { useMemo, useState, useEffect } from 'react';
import { DollarSign, Plus, Edit, Trash2, Paperclip, Eye, Calendar, TrendingUp, Filter, Search, Bell } from 'lucide-react';
import { format } from 'date-fns';

import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useGeneralCostsPayments, useDeleteGeneralCostPayment, type GeneralCostPayment } from '@/hooks/use-general-costs-payments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import GeneralCostPaymentRow from '@/features/finances/components/GeneralCostPaymentRow';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { useActionBarMobile } from '@/layouts';
import { useMobile } from '@/hooks/use-mobile';

export default function GeneralCostsPaymentsTab() {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  
  const organizationId = userData?.organization?.id;
  const defaultCurrencyId = userData?.organization_preferences?.default_currency_id;

  // Filter states
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterGeneralCost, setFilterGeneralCost] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: allPayments = [], isLoading } = useGeneralCostsPayments(organizationId);
  const deletePaymentMutation = useDeleteGeneralCostPayment();
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);

  // Mobile Action Bar
  const {
    setActions,
    setShowActionBar,
    clearActions,
    setFilterConfig
  } = useActionBarMobile();
  const isMobile = useMobile();

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
    let latestPaymentDate: string | null = null;
    let totalConfirmedInDefaultCurrency = 0;

    allPayments.forEach(payment => {
      // Track latest payment date
      if (!latestPaymentDate || payment.payment_date > latestPaymentDate) {
        latestPaymentDate = payment.payment_date;
      }

      // Calculate total confirmed in default currency
      if (payment.status === 'confirmed') {
        if (!defaultCurrency) {
          // If no default currency, just sum in original currency (fallback)
          totalConfirmedInDefaultCurrency += payment.amount;
        } else if (payment.currency?.id === defaultCurrency.id) {
          // Same currency, no conversion needed
          totalConfirmedInDefaultCurrency += payment.amount;
        } else {
          // Different currency, convert using exchange_rate (use 1 as fallback if not specified)
          const rate = payment.exchange_rate ?? 1;
          totalConfirmedInDefaultCurrency += payment.amount * rate;
        }
      }
    });

    return {
      total_count: allPayments.length,
      total_confirmed_default_currency: totalConfirmedInDefaultCurrency,
      latest_payment_date: latestPaymentDate,
    };
  }, [allPayments, defaultCurrency]);

  const handleEdit = (payment: GeneralCostPayment) => {
    if (!organizationId) return;
    console.log('[DEBUG] Opening modal in EDIT mode for payment:', payment.id);
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
    openModal('general-costs-payment-view', {
      organizationId,
      paymentId: payment.id,
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

  const formatCurrencyAmount = (amount: number, currencySymbol?: string) => {
    const symbol = currencySymbol || '$';
    const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${symbol} ${formattedAmount}`;
  };

  // Configure Mobile Action Bar - Always show 5 buttons
  useEffect(() => {
    if (!isMobile) return;

    setActions({
      search: {
        id: 'search',
        icon: Search,
        label: 'Buscar',
        onClick: () => { }, // Popover is handled in ActionBarMobile
      },
      create: {
        id: 'create',
        icon: Plus,
        label: 'Nuevo Pago',
        onClick: handleAddPayment,
        variant: 'primary'
      },
      filter: {
        id: 'filter',
        icon: Filter,
        label: 'Filtros',
        onClick: () => { }, // Popover is handled in ActionBarMobile
      },
      notifications: {
        id: 'notifications',
        icon: Bell,
        label: 'Notificaciones',
        onClick: () => { }, // Popover is handled in ActionBarMobile
      },
    });
    setShowActionBar(true);

    // Cleanup when component unmounts
    return () => {
      clearActions();
      setShowActionBar(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // Handler to clear all filters
  const handleClearFilters = () => {
    setFilterWallet('all');
    setFilterCurrency('all');
    setFilterGeneralCost('all');
    setFilterStatus('all');
  };

  // Configure filters for Mobile Action Bar
  useEffect(() => {
    if (isMobile && filterOptions.wallets.length > 0) {
      setFilterConfig({
        filters: [
          {
            label: 'Gasto General',
            value: filterGeneralCost,
            onChange: setFilterGeneralCost,
            placeholder: 'Todos',
            allOptionLabel: 'Todos',
            options: filterOptions.generalCosts.map(gc => ({ value: gc, label: gc }))
          },
          {
            label: 'Billetera',
            value: filterWallet,
            onChange: setFilterWallet,
            placeholder: 'Todas',
            allOptionLabel: 'Todas',
            options: filterOptions.wallets.map(wallet => ({ value: wallet, label: wallet }))
          },
          {
            label: 'Moneda',
            value: filterCurrency,
            onChange: setFilterCurrency,
            placeholder: 'Todas',
            allOptionLabel: 'Todas',
            options: filterOptions.currencies.map(currency => ({ value: currency, label: currency }))
          },
          {
            label: 'Estado',
            value: filterStatus,
            onChange: setFilterStatus,
            placeholder: 'Todos',
            allOptionLabel: 'Todos',
            options: [
              { value: 'confirmed', label: 'Confirmado' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'rejected', label: 'Rechazado' },
              { value: 'void', label: 'Anulado' }
            ]
          }
        ],
        onClearFilters: handleClearFilters
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, filterOptions, filterGeneralCost, filterWallet, filterCurrency, filterStatus]);

  const columns = [
    {
      key: 'payment_date',
      label: 'Fecha de Pago',
      sortable: true,
      align: 'left' as const,
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
          {payment.exchange_rate != null && (
            <span className="text-xs text-muted-foreground" style={{ fontSize: '12px' }}>
              Cot. {payment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          )}
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
  ];

  const isFilterActive = 
    filterWallet !== 'all' || 
    filterCurrency !== 'all' || 
    filterGeneralCost !== 'all' ||
    filterStatus !== 'all';

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
        {/* Total Pagos (2 columnas) */}
        <StatCard data-testid="stat-card-total-pagos" className="col-span-2">
          <StatCardTitle showArrow={false}>
            <DollarSign className="w-4 h-4 inline mr-1" />
            Total Pagos
          </StatCardTitle>
          <StatCardValue>
            {metricsData?.total_count ?? 0}
          </StatCardValue>
          <StatCardMeta>Cantidad de pagos registrados</StatCardMeta>
        </StatCard>

        {/* Pagos a la Fecha (2 columnas) */}
        <StatCard data-testid="stat-card-pagos-fecha" className="col-span-2">
          <StatCardTitle showArrow={false}>
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Pagos a la Fecha
          </StatCardTitle>
          <StatCardValue>
            {metricsData?.total_confirmed_default_currency 
              ? formatCurrencyAmount(metricsData.total_confirmed_default_currency, defaultCurrency?.symbol)
              : '-'
            }
          </StatCardValue>
          <StatCardMeta>
            Total de pagos confirmados en {defaultCurrency?.code || 'moneda principal'}
          </StatCardMeta>
        </StatCard>
      </div>

      <Table
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
        showDoubleHeader={false}
        onRowClick={(payment) => handleView(payment)}
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
        leadingRowAction={(payment: GeneralCostPayment) => 
          payment.attachments_count && payment.attachments_count > 0 ? {
            label: `${payment.attachments_count} Adjunto${payment.attachments_count > 1 ? 's' : ''}`,
            icon: Paperclip,
            onClick: () => handleView(payment),
          } : null
        }
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
