import React, { useState, useMemo } from 'react';
import { DollarSign, Plus, Edit, Trash2, Paperclip, Eye, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation'
import { format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
import { ClientPaymentRow } from '@/components/ui/data-row'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard'
import {
  useClientPayments,
  useDeleteClientPayment,
  useClientCommitments,
  type ClientPaymentWithRelations,
} from '@/features/clients'
import { getClientPaymentStatusBadgeConfig } from '@/features/clients/utils/statusBadge'

interface ClientPaymentsTabProps {
  projectId?: string;
}

interface PaymentMetrics {
  total_count: number;
  commitment_currency_id: string | null;
  commitment_currency_code: string | null;
  commitment_currency_symbol: string | null;
  total_confirmed: number;
  total_pending: number;
  total_rejected: number;
  count_confirmed: number;
  count_pending: number;
  count_rejected: number;
  count_skipped: number; // Payments skipped due to missing exchange_rate
  latest_payment_date: string | null;
  // Breakdown by original currency (not converted)
  confirmed_by_currency: Array<{ currency_symbol: string; amount: number }>;
  pending_by_currency: Array<{ currency_symbol: string; amount: number }>;
}

export default function ClientPaymentsTab({ projectId }: ClientPaymentsTabProps) {
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  const { toast } = useToast();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  // Filter states
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterHasSchedule, setFilterHasSchedule] = useState<string>('all');
  const [filterHasCommitment, setFilterHasCommitment] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Use feature hooks to get client payments and commitments
  const { data: paymentsData, isLoading } = useClientPayments(activeProjectId || undefined, organizationId);
  const { data: commitmentsData } = useClientCommitments(activeProjectId || undefined, organizationId);

  // Use payments data directly
  const allPayments = useMemo(() => {
    if (!paymentsData) return [];
    return paymentsData;
  }, [paymentsData]);

  // Determine the commitment currency (the most common currency in commitments)
  const commitmentCurrency = useMemo(() => {
    if (!commitmentsData || commitmentsData.length === 0) return null;
    
    // Count occurrences of each currency in commitments
    const currencyCount = new Map<string, { count: number; currency: NonNullable<typeof commitmentsData[0]['currency']> }>();
    
    commitmentsData.forEach(commitment => {
      if (!commitment.currency) return;
      
      const currencyId = commitment.currency.id;
      const existing = currencyCount.get(currencyId);
      
      if (existing) {
        existing.count += 1;
      } else {
        currencyCount.set(currencyId, {
          count: 1,
          currency: commitment.currency,
        });
      }
    });
    
    // Find the most common currency
    const entries = Array.from(currencyCount.values());
    if (entries.length === 0) return null;
    
    const mostCommon = entries.reduce((max, entry) => 
      entry.count > max.count ? entry : max
    );
    
    return mostCommon.currency;
  }, [commitmentsData]);

  // Calculate metrics client-side from payments data
  const metricsData = useMemo<PaymentMetrics>(() => {
    // If no commitment currency is defined, return empty metrics to avoid mixing currencies
    if (!commitmentCurrency) {
      return {
        total_count: allPayments.length,
        commitment_currency_id: null,
        commitment_currency_code: null,
        commitment_currency_symbol: null,
        total_confirmed: 0,
        total_pending: 0,
        total_rejected: 0,
        count_confirmed: 0,
        count_pending: 0,
        count_rejected: 0,
        count_skipped: 0,
        latest_payment_date: allPayments.length > 0 
          ? allPayments.reduce((latest, p) => p.payment_date > latest ? p.payment_date : latest, allPayments[0].payment_date)
          : null,
        confirmed_by_currency: [],
        pending_by_currency: [],
      };
    }

    // Helper: Convert payment amount to commitment currency
    const convertToCommitmentCurrency = (payment: ClientPaymentWithRelations): { amount: number; skipped: boolean } => {
      // If payment is already in commitment currency, return as-is
      if (payment.currency?.id === commitmentCurrency.id) {
        return { amount: payment.amount, skipped: false };
      }
      
      // If payment has no exchange_rate and is in different currency, cannot convert
      if (!payment.exchange_rate || payment.exchange_rate === 0) {
        return { amount: 0, skipped: true }; // Mark as skipped
      }
      
      // Convert using exchange_rate
      // The exchange_rate represents "cotización": how many units of payment currency per 1 unit of commitment currency
      // Example: if payment is 10,000 ARS and exchange_rate is 1000 (1 USD = 1000 ARS), result is 10,000 / 1000 = 10 USD
      return { amount: payment.amount / payment.exchange_rate, skipped: false };
    };

    let totalConfirmed = 0;
    let totalPending = 0;
    let totalRejected = 0;
    let countConfirmed = 0;
    let countPending = 0;
    let countRejected = 0;
    let countSkipped = 0;
    let latestPaymentDate: string | null = null;

    // Track totals by original currency for breakdown
    const confirmedByCurrency = new Map<string, { symbol: string; amount: number }>();
    const pendingByCurrency = new Map<string, { symbol: string; amount: number }>();

    allPayments.forEach(payment => {
      if (!payment.currency) return;

      const { amount: convertedAmount, skipped } = convertToCommitmentCurrency(payment);
      const currencySymbol = payment.currency.symbol;
      
      // Count skipped payments separately
      if (skipped) {
        countSkipped += 1;
      } else {
        // Only count payments that could be converted (not skipped)
        if (payment.status === 'confirmed') {
          totalConfirmed += convertedAmount;
          countConfirmed += 1;
          
          // Track by original currency
          const existing = confirmedByCurrency.get(currencySymbol);
          if (existing) {
            existing.amount += payment.amount;
          } else {
            confirmedByCurrency.set(currencySymbol, { symbol: currencySymbol, amount: payment.amount });
          }
        } else if (payment.status === 'pending') {
          totalPending += convertedAmount;
          countPending += 1;
          
          // Track by original currency
          const existing = pendingByCurrency.get(currencySymbol);
          if (existing) {
            existing.amount += payment.amount;
          } else {
            pendingByCurrency.set(currencySymbol, { symbol: currencySymbol, amount: payment.amount });
          }
        } else if (payment.status === 'rejected') {
          totalRejected += convertedAmount;
          countRejected += 1;
        }
      }

      if (!latestPaymentDate || payment.payment_date > latestPaymentDate) {
        latestPaymentDate = payment.payment_date;
      }
    });

    return {
      total_count: allPayments.length,
      commitment_currency_id: commitmentCurrency.id,
      commitment_currency_code: commitmentCurrency.code,
      commitment_currency_symbol: commitmentCurrency.symbol,
      total_confirmed: totalConfirmed,
      total_pending: totalPending,
      total_rejected: totalRejected,
      count_confirmed: countConfirmed,
      count_pending: countPending,
      count_rejected: countRejected,
      count_skipped: countSkipped,
      latest_payment_date: latestPaymentDate,
      confirmed_by_currency: Array.from(confirmedByCurrency.values()).map(c => ({
        currency_symbol: c.symbol,
        amount: c.amount,
      })),
      pending_by_currency: Array.from(pendingByCurrency.values()).map(c => ({
        currency_symbol: c.symbol,
        amount: c.amount,
      })),
    };
  }, [allPayments, commitmentCurrency]);

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const wallets = new Set<string>();
    const currencies = new Set<string>();
    const clients = new Set<string>();
    const units = new Set<string>();

    allPayments.forEach(payment => {
      if (payment.wallet?.wallets?.name) wallets.add(payment.wallet.wallets.name);
      if (payment.currency?.code) currencies.add(payment.currency.code);
      if (payment.client?.contact) {
        const clientName = payment.client.contact.company_name || 
                          payment.client.contact.full_name || 
                          `${payment.client.contact.first_name || ''} ${payment.client.contact.last_name || ''}`.trim();
        if (clientName) clients.add(clientName);
      }
      if (payment.client?.unit) units.add(payment.client.unit);
    });

    return {
      wallets: Array.from(wallets).sort(),
      currencies: Array.from(currencies).sort(),
      clients: Array.from(clients).sort(),
      units: Array.from(units).sort(),
    };
  }, [allPayments]);

  // Apply filters
  const clientPayments = useMemo(() => {
    return allPayments.filter(payment => {
      // Filter by wallet
      if (filterWallet !== 'all' && payment.wallet?.wallets?.name !== filterWallet) return false;
      
      // Filter by currency
      if (filterCurrency !== 'all' && payment.currency?.code !== filterCurrency) return false;
      
      // Filter by has schedule
      if (filterHasSchedule === 'yes' && !payment.schedule_id) return false;
      if (filterHasSchedule === 'no' && payment.schedule_id) return false;
      
      // Filter by has commitment
      if (filterHasCommitment === 'yes' && !payment.commitment_id) return false;
      if (filterHasCommitment === 'no' && payment.commitment_id) return false;
      
      // Filter by client
      if (filterClient !== 'all') {
        const clientName = payment.client?.contact?.company_name || 
                          payment.client?.contact?.full_name || 
                          `${payment.client?.contact?.first_name || ''} ${payment.client?.contact?.last_name || ''}`.trim();
        if (clientName !== filterClient) return false;
      }
      
      // Filter by unit
      if (filterUnit !== 'all' && payment.client?.unit !== filterUnit) return false;
      
      // Filter by status
      if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
      
      return true;
    });
  }, [allPayments, filterWallet, filterCurrency, filterHasSchedule, filterHasCommitment, filterClient, filterUnit, filterStatus]);

  // Delete payment mutation using feature hook
  const deletePaymentMutation = useDeleteClientPayment();

  const handleEdit = (payment: ClientPaymentWithRelations) => {
    openModal('client-payment', {
      projectId: activeProjectId,
      organizationId: organizationId,
      paymentId: payment.id,
      mode: 'edit',
    });
  };

  const handleDeletePayment = (payment: ClientPaymentWithRelations) => {
    if (!organizationId || !activeProjectId) return;

    const clientName = payment.client?.contact?.company_name || 
                      payment.client?.contact?.full_name || 
                      `${payment.client?.contact?.first_name || ''} ${payment.client?.contact?.last_name || ''}`.trim();
    const symbol = payment.currency?.symbol || '$';
    const formattedAmount = `${symbol} ${payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const paymentLabel = `${clientName} - ${formattedAmount}`;
    
    showDeleteConfirmation({
      mode: 'simple',
      title: "Eliminar pago",
      description: `¿Estás seguro de que querés eliminar este pago? Esta acción no se puede deshacer.`,
      itemName: paymentLabel,
      destructiveActionText: "Eliminar pago",
      onDelete: () => deletePaymentMutation.mutate({
        paymentId: payment.id,
        organizationId,
        projectId: activeProjectId,
      }),
      isLoading: deletePaymentMutation.isPending
    });
  };

  const handleAddPayment = () => {
    openModal('client-payment', {
      projectId: activeProjectId,
      organizationId: organizationId,
    });
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se pudo cargar la información de la organización</p>
      </div>
    )
  }

  // Format date helper
  const formatDate = (dateString: string, formatString: string) => {
    try {
      return format(new Date(dateString), formatString);
    } catch {
      return '-';
    }
  };

  // Format amount with currency
  const formatAmount = (amount: number, currencySymbol: string | undefined) => {
    const symbol = currencySymbol || '$';
    return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };


  // Format currency for KPIs - single value in commitment currency
  const formatCurrencyKPI = (amount: number, currencySymbol: string | null) => {
    // If no commitment currency, show placeholder
    if (!currencySymbol) {
      return '-';
    }
    const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currencySymbol} ${formattedAmount}`;
  };

  // Format currency breakdown by original currency
  const formatCurrencyBreakdown = (currencyData: Array<{ currency_symbol: string; amount: number }>) => {
    if (!currencyData || currencyData.length === 0) return '-';
    
    return currencyData.map(({ currency_symbol, amount }) => {
      const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${currency_symbol} ${formattedAmount}`;
    }).join(' + ');
  };

  // Table columns
  const columns: Array<{
    key: string;
    label: string;
    render?: (item: ClientPaymentWithRelations) => React.ReactNode;
    sortable?: boolean;
    sortType?: "string" | "number" | "date";
    width?: string;
    align?: 'left' | 'center' | 'right';
    cellClassName?: string;
  }> = [
    {
      key: 'payment_date',
      label: 'Fecha de Pago',
      sortable: true,
      align: 'right' as const,
      render: (payment: ClientPaymentWithRelations) => formatDate(payment.payment_date, 'dd/MM/yyyy'),
    },
    // Project column - only shown when viewing organization-wide data
    ...(activeProjectId ? [] : [{
      key: 'project',
      label: 'Proyecto',
      sortable: true,
      width: '200px',
      render: (payment: ClientPaymentWithRelations) => {
        if (!payment.project) return '-';
        return (
          <Badge 
            className="font-medium whitespace-nowrap"
            style={{ 
              backgroundColor: payment.project.color,
              color: 'white'
            }}
          >
            {payment.project.name}
          </Badge>
        );
      },
    }]),
    {
      key: 'contact',
      label: 'Cliente',
      sortable: true,
      width: '220px',
      render: (payment: ClientPaymentWithRelations) => {
        const initials = payment.client?.contact?.first_name?.[0] && payment.client?.contact?.last_name?.[0]
          ? `${payment.client.contact.first_name[0]}${payment.client.contact.last_name[0]}`
          : payment.client?.contact?.first_name?.[0] || '?';
        
        const displayName = payment.client?.contact?.company_name || 
                           payment.client?.contact?.full_name || 
                           `${payment.client?.contact?.first_name || ''} ${payment.client?.contact?.last_name || ''}`.trim();
        
        const unit = payment.client?.unit;
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-bold truncate">{displayName || '-'}</span>
              {unit && <span className="text-xs text-muted-foreground truncate">{unit}</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'notes',
      label: 'Notas',
      sortable: true,
      width: '400px',
      render: (payment: ClientPaymentWithRelations) => (
        <div className="max-w-full truncate" title={payment.notes || ''}>
          {payment.notes || '-'}
        </div>
      ),
    },
    {
      key: 'reference',
      label: 'Referencia',
      sortable: true,
      align: 'right' as const,
      render: (payment: ClientPaymentWithRelations) => payment.reference || '-',
    },
    {
      key: 'commitment_id',
      label: 'Compromiso',
      sortable: true,
      align: 'right' as const,
      render: (payment: ClientPaymentWithRelations) => {
        if (!payment.commitment) return '-';
        return (
          <span className="text-xs text-muted-foreground">
            {formatAmount(payment.commitment.amount, payment.currency?.symbol)}
          </span>
        );
      },
    },
    {
      key: 'schedule_id',
      label: 'Cuota',
      sortable: true,
      align: 'right' as const,
      render: (payment: ClientPaymentWithRelations) => {
        if (!payment.schedule) return '-';
        return (
          <span className="text-xs text-muted-foreground">
            Vcto: {formatDate(payment.schedule.due_date, 'dd/MM/yyyy')}
          </span>
        );
      },
    },
    {
      key: 'wallet',
      label: 'Billetera',
      sortable: true,
      align: 'right' as const,
      cellClassName: 'font-bold',
      render: (payment: ClientPaymentWithRelations) => payment.wallet?.wallets?.name || '-',
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      sortType: 'number' as const,
      render: (payment: ClientPaymentWithRelations) => (
        <div className="flex flex-col items-end">
          <span className="font-bold">{formatAmount(payment.amount, payment.currency?.symbol)}</span>
          {payment.exchange_rate && (
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
      render: (payment: ClientPaymentWithRelations) => {
        const statusInfo = getClientPaymentStatusBadgeConfig(payment.status);
        return (
          <Badge variant={statusInfo.variant} className={statusInfo.className}>
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
      render: (payment: ClientPaymentWithRelations) => {
        const attachmentCount = payment.file_url ? 1 : 0;
        return (
          <span className={attachmentCount > 0 ? 'font-medium' : 'text-muted-foreground'}>
            {attachmentCount}
          </span>
        );
      },
    },
  ] as const;

  const isFilterActive = 
    filterWallet !== 'all' || 
    filterCurrency !== 'all' || 
    filterHasSchedule !== 'all' || 
    filterHasCommitment !== 'all' || 
    filterClient !== 'all' || 
    filterUnit !== 'all' ||
    filterStatus !== 'all';

  const handleClearFilters = () => {
    setFilterWallet('all');
    setFilterCurrency('all');
    setFilterHasSchedule('all');
    setFilterHasCommitment('all');
    setFilterClient('all');
    setFilterUnit('all');
    setFilterStatus('all');
  };

  const handleViewPayment = (payment: ClientPaymentWithRelations) => {
    openModal('client-payment', {
      projectId: activeProjectId,
      organizationId: organizationId,
      paymentId: payment.id,
      mode: 'view',
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Pagos (count) */}
        <StatCard data-testid="stat-card-total-pagos">
          <StatCardTitle showArrow={false}>
            <DollarSign className="w-4 h-4 inline mr-1" />
            Total Pagos
          </StatCardTitle>
          <StatCardValue>
            {metricsData?.total_count ?? 0}
          </StatCardValue>
          <StatCardMeta>Cantidad de pagos registrados</StatCardMeta>
        </StatCard>

        {/* Card 2: Total Confirmado (in commitment currency) */}
        <StatCard data-testid="stat-card-total-confirmado">
          <StatCardTitle showArrow={false}>
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Total Confirmado
          </StatCardTitle>
          <StatCardValue>
            {metricsData?.commitment_currency_symbol 
              ? formatCurrencyKPI(metricsData.total_confirmed, metricsData.commitment_currency_symbol)
              : '-'
            }
          </StatCardValue>
          <StatCardMeta>
            {metricsData?.commitment_currency_symbol 
              ? formatCurrencyBreakdown(metricsData.confirmed_by_currency)
              : 'Sin compromisos registrados'
            }
          </StatCardMeta>
        </StatCard>

        {/* Card 3: Total Pendiente (in commitment currency) */}
        <StatCard data-testid="stat-card-total-pendiente">
          <StatCardTitle showArrow={false}>
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Total Pendiente
          </StatCardTitle>
          <StatCardValue>
            {metricsData?.commitment_currency_symbol 
              ? formatCurrencyKPI(metricsData.total_pending, metricsData.commitment_currency_symbol)
              : '-'
            }
          </StatCardValue>
          <StatCardMeta>
            {metricsData?.commitment_currency_symbol 
              ? formatCurrencyBreakdown(metricsData.pending_by_currency)
              : 'Sin compromisos registrados'
            }
          </StatCardMeta>
        </StatCard>

        {/* Card 4: Último Pago (latest payment date) */}
        <StatCard data-testid="stat-card-ultimo-pago">
          <StatCardTitle showArrow={false}>
            <Calendar className="w-4 h-4 inline mr-1" />
            Último Pago
          </StatCardTitle>
          <StatCardValue>
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
        data={clientPayments}
        isLoading={isLoading}
        showDoubleHeader={false}
        emptyStateConfig={{
          icon: <DollarSign className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay pagos registrados',
          description: 'Agrega pagos de clientes para llevar un registro de los ingresos del proyecto.',
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
              <div>
                <Label className="text-xs font-medium mb-1 block">Billetera</Label>
                <Select value={filterWallet} onValueChange={setFilterWallet}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las billeteras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las billeteras</SelectItem>
                    {filterOptions.wallets.map((wallet) => (
                      <SelectItem key={wallet} value={wallet}>
                        {wallet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Moneda</Label>
                <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las monedas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las monedas</SelectItem>
                    {filterOptions.currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Cuota</Label>
                <Select value={filterHasSchedule} onValueChange={setFilterHasSchedule}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="yes">Con cuota</SelectItem>
                    <SelectItem value="no">Sin cuota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Compromiso</Label>
                <Select value={filterHasCommitment} onValueChange={setFilterHasCommitment}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Con compromiso</SelectItem>
                    <SelectItem value="no">Sin compromiso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Cliente</Label>
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {filterOptions.clients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Unidad Funcional</Label>
                <Select value={filterUnit} onValueChange={setFilterUnit}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas las unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las unidades</SelectItem>
                    {filterOptions.units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
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
        primaryRowAction={(payment: ClientPaymentWithRelations) => ({
          label: 'Ver',
          onClick: () => handleViewPayment(payment),
        })}
        rowActions={(payment: ClientPaymentWithRelations) => [
          {
            label: 'Editar Pago',
            icon: Edit,
            onClick: () => handleEdit(payment),
          },
          {
            label: 'Eliminar Pago',
            icon: Trash2,
            onClick: () => handleDeletePayment(payment),
            variant: 'destructive' as const,
          },
        ]}
        renderCard={(payment: ClientPaymentWithRelations) => (
          <ClientPaymentRow
            payment={payment}
            onClick={() => handleViewPayment(payment)}
          />
        )}
      />
    </div>
  )
}
