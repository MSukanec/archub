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
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/stat-card'
import {
  useClientPayments,
  useDeleteClientPayment,
  type ClientPaymentWithRelations,
} from '@/features/clients'

interface ClientPaymentsTabProps {
  projectId?: string;
}

interface ClientPayment {
  id: string;
  project_id: string;
  commitment_id: string | null;
  schedule_id: string | null;
  organization_id: string;
  client_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
  wallet_id: string | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  file_url: string | null;
  project_client: {
    id: string;
    unit: string | null;
    contact: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
      email: string | null;
      phone?: string | null;
      company_name?: string | null;
      linked_user?: {
        id: string;
        avatar_url?: string;
      } | null;
    } | null;
  } | null;
  currency: {
    id: string;
    code: string;
    symbol: string;
  } | null;
  wallet: {
    id: string;
    organization_id: string;
    wallet_id: string;
    is_active: boolean;
    is_default: boolean;
    wallets: {
      id: string;
      name: string;
      is_active: boolean;
    } | null;
  } | null;
  commitment: {
    id: string;
    amount: number;
  } | null;
  schedule: {
    id: string;
    due_date: string;
    amount: number;
  } | null;
  projects?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface PaymentMetrics {
  total_count: number;
  by_currency: Array<{
    currency_id: string;
    currency_code: string;
    currency_symbol: string;
    total_confirmed: number;
    total_pending: number;
    total_rejected: number;
    count_confirmed: number;
    count_pending: number;
    count_rejected: number;
  }>;
  latest_payment_date: string | null;
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

  // Use feature hook to get client payments
  const { data: paymentsData, isLoading } = useClientPayments(activeProjectId || undefined, organizationId);

  // Transform payments from feature data structure to component's expected structure
  const allPayments = useMemo(() => {
    if (!paymentsData) return [];
    
    return paymentsData.map((payment: ClientPaymentWithRelations) => ({
      id: payment.id,
      project_id: payment.project_id,
      commitment_id: payment.commitment_id,
      schedule_id: payment.schedule_id,
      organization_id: payment.organization_id,
      client_id: payment.client_id,
      amount: payment.amount,
      currency_id: payment.currency_id,
      exchange_rate: payment.exchange_rate,
      payment_date: payment.payment_date,
      notes: payment.notes,
      reference: payment.reference,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      wallet_id: payment.wallet_id,
      status: payment.status,
      file_url: payment.file_url,
      project_client: payment.client ? {
        id: payment.client.id,
        unit: payment.client.unit,
        contact: payment.client.contact,
      } : null,
      currency: payment.currency,
      wallet: payment.wallet,
      commitment: payment.commitment,
      schedule: payment.schedule,
    }));
  }, [paymentsData]);

  // Calculate metrics client-side from payments data
  const metricsData = useMemo<PaymentMetrics>(() => {
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

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const wallets = new Set<string>();
    const currencies = new Set<string>();
    const clients = new Set<string>();
    const units = new Set<string>();

    allPayments.forEach(payment => {
      if (payment.wallet?.wallets?.name) wallets.add(payment.wallet.wallets.name);
      if (payment.currency?.code) currencies.add(payment.currency.code);
      if (payment.project_client?.contact) {
        const clientName = payment.project_client.contact.company_name || 
                          payment.project_client.contact.full_name || 
                          `${payment.project_client.contact.first_name || ''} ${payment.project_client.contact.last_name || ''}`.trim();
        if (clientName) clients.add(clientName);
      }
      if (payment.project_client?.unit) units.add(payment.project_client.unit);
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
        const clientName = payment.project_client?.contact?.company_name || 
                          payment.project_client?.contact?.full_name || 
                          `${payment.project_client?.contact?.first_name || ''} ${payment.project_client?.contact?.last_name || ''}`.trim();
        if (clientName !== filterClient) return false;
      }
      
      // Filter by unit
      if (filterUnit !== 'all' && payment.project_client?.unit !== filterUnit) return false;
      
      // Filter by status
      if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
      
      return true;
    });
  }, [allPayments, filterWallet, filterCurrency, filterHasSchedule, filterHasCommitment, filterClient, filterUnit, filterStatus]);

  // Delete payment mutation using feature hook
  const deletePaymentMutation = useDeleteClientPayment();

  const handleEdit = (payment: ClientPayment) => {
    openModal('client-payment', {
      projectId: activeProjectId,
      organizationId: organizationId,
      paymentId: payment.id,
      mode: 'edit',
    });
  };

  const handleDeletePayment = (payment: ClientPayment) => {
    if (!organizationId || !activeProjectId) return;

    const clientName = payment.project_client?.contact?.company_name || 
                      payment.project_client?.contact?.full_name || 
                      `${payment.project_client?.contact?.first_name || ''} ${payment.project_client?.contact?.last_name || ''}`.trim();
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

  // Get status badge configuration
  const getStatusBadge = (status: 'confirmed' | 'pending' | 'rejected' | 'void') => {
    const statusConfig = {
      confirmed: { label: 'Confirmado', className: 'bg-green-600 text-white hover:bg-green-600' },
      pending: { label: 'Pendiente', className: 'bg-orange-600 text-white hover:bg-orange-600' },
      rejected: { label: 'Rechazado', className: 'bg-red-600 text-white hover:bg-red-600' },
      void: { label: 'Anulado', className: 'bg-gray-600 text-white hover:bg-gray-600' },
    };
    return statusConfig[status];
  };

  // Format currency for KPIs - groups by currency
  const formatCurrencyKPI = (currencyData: Array<{ currency_symbol: string; amount: number }>) => {
    if (!currencyData || currencyData.length === 0) return '-';
    
    return currencyData.map(({ currency_symbol, amount }) => {
      const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${currency_symbol} ${formattedAmount}`;
    }).join(' · ');
  };

  // Table columns
  const columns: Array<{
    key: string;
    label: string;
    render?: (item: ClientPayment) => React.ReactNode;
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
      render: (payment: ClientPayment) => formatDate(payment.payment_date, 'dd/MM/yyyy'),
    },
    // Project column - only shown when viewing organization-wide data
    ...(activeProjectId ? [] : [{
      key: 'project',
      label: 'Proyecto',
      sortable: true,
      width: '200px',
      render: (payment: ClientPayment) => {
        if (!payment.projects) return '-';
        return (
          <Badge 
            className="font-medium whitespace-nowrap"
            style={{ 
              backgroundColor: payment.projects.color,
              color: 'white'
            }}
          >
            {payment.projects.name}
          </Badge>
        );
      },
    }]),
    {
      key: 'contact',
      label: 'Cliente',
      sortable: true,
      width: '220px',
      render: (payment: ClientPayment) => {
        const avatarUrl = payment.project_client?.contact?.linked_user?.avatar_url;
        const initials = payment.project_client?.contact?.first_name?.[0] && payment.project_client?.contact?.last_name?.[0]
          ? `${payment.project_client.contact.first_name[0]}${payment.project_client.contact.last_name[0]}`
          : payment.project_client?.contact?.first_name?.[0] || '?';
        
        const displayName = payment.project_client?.contact?.company_name || 
                           payment.project_client?.contact?.full_name || 
                           `${payment.project_client?.contact?.first_name || ''} ${payment.project_client?.contact?.last_name || ''}`.trim();
        
        const unit = payment.project_client?.unit;
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
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
      render: (payment: ClientPayment) => (
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
      render: (payment: ClientPayment) => payment.reference || '-',
    },
    {
      key: 'commitment_id',
      label: 'Compromiso',
      sortable: true,
      align: 'right' as const,
      render: (payment: ClientPayment) => {
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
      render: (payment: ClientPayment) => {
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
      render: (payment: ClientPayment) => payment.wallet?.wallets?.name || '-',
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      sortType: 'number' as const,
      render: (payment: ClientPayment) => (
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
      render: (payment: ClientPayment) => {
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
      render: (payment: ClientPayment) => {
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

  const handleViewPayment = (payment: ClientPayment) => {
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
          <StatCardValue className="text-2xl md:text-3xl">
            {metricsData?.total_count ?? 0}
          </StatCardValue>
          <StatCardMeta>Cantidad de pagos registrados</StatCardMeta>
        </StatCard>

        {/* Card 2: Total Confirmado (sum of confirmed amounts by currency) */}
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

        {/* Card 3: Total Pendiente (sum of pending amounts by currency) */}
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

        {/* Card 4: Último Pago (latest payment date) */}
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
        primaryRowAction={(payment: ClientPayment) => ({
          label: 'Ver',
          onClick: () => handleViewPayment(payment),
        })}
        rowActions={(payment: ClientPayment) => [
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
        renderCard={(payment: ClientPayment) => (
          <ClientPaymentRow
            payment={payment}
            onClick={() => handleViewPayment(payment)}
          />
        )}
      />
    </div>
  )
}
