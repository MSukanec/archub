import { useMemo, useState, useEffect } from 'react';
import { DollarSign, Plus, Edit, Trash2, Paperclip, Eye, Calendar, TrendingUp, Filter, Search, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { convertToBaseCurrency, formatKPI, formatSubValue } from '@/lib/money';
import { calculateMonetaryKPI, calculateCountKPI, formatBreakdown } from '@/lib/kpis';

import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useGeneralCostsPayments, useDeleteGeneralCostPayment, type GeneralCostPayment } from '@/hooks/use-general-costs-payments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import GeneralCostPaymentRow from '@/features/finances/components/GeneralCostPaymentRow';
import { useOrganizationDefaultCurrency, useOrganizationCurrencies } from '@/hooks/use-currencies';
import { useActionBarMobile } from '@/layouts';
import { useMobile } from '@/hooks/use-mobile';
import { formatDate as formatDateUtil } from '@/lib/date-utils';
import { useOrganizationWallets } from '@/features/organization/hooks';
import { useGeneralCosts, useCreateGeneralCostPayment } from '@/features/general-costs';
import { useToast } from '@/hooks/use-toast';
import { format as formatMoneyAmount } from '@/lib/money';
import type { TargetField, ImportConfig } from '@/features/imports/types';

export default function GeneralCostsPaymentsTab() {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  
  const organizationId = userData?.organization?.id;
  const defaultCurrencyId = userData?.organization?.preferences?.default_currency_id;

  // Filter states
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterGeneralCost, setFilterGeneralCost] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: allPayments = [], isLoading } = useGeneralCostsPayments(organizationId);
  const deletePaymentMutation = useDeleteGeneralCostPayment();
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);
  
  const { data: organizationWallets = [] } = useOrganizationWallets(organizationId);
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(organizationId);
  const { data: generalCostsData = [] } = useGeneralCosts(organizationId ?? null);
  const createPaymentMutation = useCreateGeneralCostPayment();
  const { toast } = useToast();

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

  // Sort by payment_date DESC, then by created_at DESC
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      // Primero por payment_date (más reciente primero) - usar parseLocalDate para evitar timezone shift
      const dateA = parseLocalDate(a.payment_date)?.getTime() ?? 0;
      const dateB = parseLocalDate(b.payment_date)?.getTime() ?? 0;
      const dateComparison = dateB - dateA;
      
      if (dateComparison !== 0) return dateComparison;
      
      // Si tienen la misma fecha de pago, por created_at (más nuevo primero)
      const createdAtA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdAtB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createdAtB - createdAtA;
    });
  }, [filteredPayments]);

  // Calculate metrics using new KPI system
  const metricsData = useMemo(() => {
    // KPI 1: Total Pagos (conteo simple)
    const totalPagosKPI = calculateCountKPI({
      count: allPayments.length,
      label: 'Cantidad de pagos'
    });

    // KPI 2: Pagos a la Fecha (monetaria - TOTAL convertido a moneda base + breakdown original)
    // Solo incluye pagos confirmados
    const confirmedPayments = allPayments.filter(p => p.status === 'confirmed');
    const pagosALaFechaKPI = calculateMonetaryKPI({
      items: confirmedPayments.map(p => ({
        amount: p.amount,
        currency_id: p.currency_id,
        currency: p.currency,
        exchange_rate: p.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code  // Moneda para convertir (se refetcha automáticamente)
    });

    return {
      total_count_kpi: totalPagosKPI,
      total_confirmed_kpi: pagosALaFechaKPI,
    };
  }, [allPayments, defaultCurrency]);  // ← CRÍTICO: defaultCurrency en dependencias

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

  const handleImport = () => {
    if (!organizationId || !userData?.user?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información requerida',
        variant: 'destructive',
      });
      return;
    }

    const targetSchema: TargetField[] = [
      {
        field: 'payment_date',
        label: 'Fecha de Pago',
        type: 'date',
        required: true,
        description: 'Ej: 2024-01-15',
      },
      {
        field: 'general_cost_name',
        label: 'Gasto General (Nombre)',
        type: 'foreign-key',
        required: true,
        description: 'Ej: Expensas, Servicios, Alquiler',
        foreignKeyConfig: {
          entityName: 'general_cost',
          labelKey: 'label',
          valueKey: 'value',
          options: generalCostsData.map(gc => ({
            label: gc.name,
            value: gc.id,
          })),
        },
      },
      {
        field: 'amount',
        label: 'Monto',
        type: 'number',
        required: true,
        description: 'Ej: 5000',
      },
      {
        field: 'currency_code',
        label: 'Moneda (Código)',
        type: 'foreign-key',
        required: true,
        description: 'Ej: USD, ARS, EUR',
        foreignKeyConfig: {
          entityName: 'currency',
          labelKey: 'label',
          valueKey: 'value',
          options: organizationCurrencies.map(oc => ({
            label: `${oc.currency?.code || ''} - ${oc.currency?.name || 'Sin nombre'}`,
            value: oc.currency_id,
          })),
        },
      },
      {
        field: 'exchange_rate',
        label: 'Cotización (opcional)',
        type: 'number',
        required: false,
        description: 'Ej: 1000',
      },
      {
        field: 'wallet_name',
        label: 'Billetera (opcional)',
        type: 'foreign-key',
        required: false,
        description: 'Ej: Efectivo, Banco, Tarjeta',
        foreignKeyConfig: {
          entityName: 'wallet',
          labelKey: 'label',
          valueKey: 'value',
          options: organizationWallets.map(ow => ({
            label: ow.wallets?.name || 'Sin nombre',
            value: ow.id,
          })),
        },
      },
      {
        field: 'status',
        label: 'Estado (opcional)',
        type: 'foreign-key',
        required: false,
        description: 'Ej: Confirmado, Pendiente',
        foreignKeyConfig: {
          entityName: 'status',
          labelKey: 'label',
          valueKey: 'value',
          options: [
            { label: 'Confirmado', value: 'confirmed' },
            { label: 'Pendiente', value: 'pending' },
            { label: 'Rechazado', value: 'rejected' },
            { label: 'Anulado', value: 'void' },
          ],
        },
      },
      {
        field: 'reference',
        label: 'Referencia (opcional)',
        type: 'string',
        required: false,
        description: 'Ej: Cheque #123, Transferencia ABC',
      },
      {
        field: 'notes',
        label: 'Notas (opcional)',
        type: 'string',
        required: false,
        description: 'Observaciones adicionales',
      },
    ];

    const walletValueMap: Record<string, string> = {};
    organizationWallets.forEach(ow => {
      if (ow.wallets?.name && ow.id) {
        const normalizedName = ow.wallets.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        walletValueMap[normalizedName] = ow.id;
      }
    });

    const currencyValueMap: Record<string, string> = {};
    organizationCurrencies.forEach(oc => {
      if (oc.currency?.code && oc.currency_id) {
        const normalizedCode = oc.currency.code.toLowerCase().trim();
        currencyValueMap[normalizedCode] = oc.currency_id;
        if (oc.currency.name) {
          const normalizedName = oc.currency.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          currencyValueMap[normalizedName] = oc.currency_id;
        }
      }
    });

    const generalCostValueMap: Record<string, string> = {};
    generalCostsData.forEach(gc => {
      const normalizedName = gc.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      generalCostValueMap[normalizedName] = gc.id;
    });

    const valueMapConfig: Record<string, Record<string, string>> = {
      currency_code: currencyValueMap,
      status: {
        'confirmado': 'confirmed',
        'pendiente': 'pending',
        'rechazado': 'rejected',
        'anulado': 'void',
      },
      wallet_name: walletValueMap,
      general_cost_name: generalCostValueMap,
    };

    openModal('universal-import', {
      config: {
        entityName: 'Pago de Gasto General',
        entityNamePlural: 'Pagos de Gastos Generales',
        targetSchema,
        valueMapConfig,
        fieldHelpMessages: {
          wallet_name: {
            message: 'Las billeteras que no se encuentran deben agregarse primero en la configuración de tu organización.',
            linkText: 'Ir a Configuración de Finanzas',
            linkPath: '/settings/finances',
          },
          currency_code: {
            message: 'Las monedas que no se encuentran deben agregarse primero en la configuración de tu organización.',
            linkText: 'Ir a Configuración de Finanzas',
            linkPath: '/settings/finances',
          },
          general_cost_name: {
            message: 'Los gastos generales que no se encuentran deben agregarse primero.',
            linkText: 'Ir a Gastos Generales',
            linkPath: '/general-costs',
          },
        },
        onImport: async (rows: any[]) => {
          const generalCostsMap = new Map<string, string>();
          generalCostsData.forEach(gc => {
            generalCostsMap.set(gc.name.toLowerCase(), gc.id);
          });

          const currenciesMap = new Map<string, string>();
          organizationCurrencies.forEach(oc => {
            if (oc.currency?.code && oc.currency_id) {
              currenciesMap.set(oc.currency.code.toLowerCase(), oc.currency_id);
            }
          });

          const walletsMap = new Map<string, string>();
          let defaultWalletId: string | null = null;
          
          organizationWallets.forEach(ow => {
            if (ow.wallets?.name && ow.id) {
              const normalizedName = ow.wallets.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              walletsMap.set(normalizedName, ow.id);
              if (!defaultWalletId && ow.is_default) {
                defaultWalletId = ow.id;
              }
            }
          });
          if (!defaultWalletId && organizationWallets.length > 0) {
            defaultWalletId = organizationWallets[0].id;
          }

          const invalidRows: Array<{ index: number; reason: string }> = [];
          const validRowsToImport: typeof rows = [];

          rows.forEach((row, idx) => {
            const generalCostId = row.general_cost_name;
            if (!generalCostId) {
              invalidRows.push({ index: idx + 1, reason: 'Sin gasto general asignado' });
              return;
            }

            const currencyId = row.currency_code;
            if (!currencyId) {
              invalidRows.push({ index: idx + 1, reason: 'Sin moneda asignada' });
              return;
            }

            validRowsToImport.push(row);
          });

          if (invalidRows.length > 0) {
            toast({
              title: `${invalidRows.length} filas no se pudieron importar`,
              description: invalidRows.slice(0, 3).map(r => `Fila ${r.index}: ${r.reason}`).join('. ') + (invalidRows.length > 3 ? '...' : ''),
              variant: 'destructive',
            });
          }

          let successCount = 0;
          let failCount = 0;

          for (const row of validRowsToImport) {
            try {
              const walletId = row.wallet_name || defaultWalletId;

              await createPaymentMutation.mutateAsync({
                organization_id: organizationId!,
                payment_date: row.payment_date,
                amount: parseFloat(String(row.amount).replace(/[^0-9.-]/g, '')),
                currency_id: row.currency_code,
                exchange_rate: row.exchange_rate ? parseFloat(String(row.exchange_rate).replace(/[^0-9.-]/g, '')) : undefined,
                wallet_id: walletId || undefined,
                general_cost_id: row.general_cost_name,
                status: row.status || 'confirmed',
                reference: row.reference || undefined,
                notes: row.notes || undefined,
                created_by: userData?.user?.id,
              });
              successCount++;
            } catch (error) {
              console.error('Error importing row:', error);
              failCount++;
            }
          }

          if (failCount > 0) {
            toast({
              title: 'Importación parcial',
              description: `Se importaron ${successCount} de ${validRowsToImport.length} pagos. ${failCount} fallaron.`,
              variant: 'destructive',
            });
          } else if (successCount > 0) {
            toast({
              title: 'Importación exitosa',
              description: `Se importaron ${successCount} pagos correctamente.`,
            });
          }
        },
      } as ImportConfig,
    });
  };


  const formatAmount = (amount: number, currencySymbol: string | undefined) => {
    const symbol = currencySymbol || '$';
    return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadgeConfig = (status: 'confirmed' | 'pending' | 'overdue' | 'cancelled') => {
    const statusConfig: Record<string, { label: string; colorVar: string }> = {
      confirmed: { label: 'Confirmado', colorVar: '--badge-status-success' },
      pending: { label: 'Pendiente', colorVar: '--badge-status-warning' },
      overdue: { label: 'Vencido', colorVar: '--badge-status-destructive' },
      cancelled: { label: 'Cancelado', colorVar: '--badge-status-neutral' },
    };
    return statusConfig[status] || { label: status, colorVar: '--badge-status-neutral' };
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
      render: (payment: GeneralCostPayment) => formatDateUtil(payment.payment_date),
    },
    {
      key: 'general_cost',
      label: 'Gasto General',
      sortable: true,
      width: '280px',
      render: (payment: GeneralCostPayment) => (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div>
                  <IdentityBadge 
                    name={payment.creator?.users?.full_name}
                    avatarUrl={payment.creator?.users?.avatar_url}
                    showName={false}
                    size="sm"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {payment.creator?.users?.full_name || 'Sin creador'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">{payment.general_cost?.name || 'Sin categoría'}</div>
            {payment.general_cost?.category ? (
              <div className="text-xs text-muted-foreground line-clamp-1">{payment.general_cost.category.name}</div>
            ) : (
              <div className="text-xs text-muted-foreground">Sin categoría</div>
            )}
          </div>
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
      align: 'left' as const,
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
        const statusConfig = getStatusBadgeConfig(payment.status);
        return (
          <Badge 
            variant="default"
            style={{
              color: `var(${statusConfig.colorVar})`,
              backgroundColor: `color-mix(in srgb, var(${statusConfig.colorVar}) 10%, transparent)`,
              borderColor: `color-mix(in srgb, var(${statusConfig.colorVar}) 30%, transparent)`,
            } as React.CSSProperties}
          >
            {statusConfig.label}
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
        {/* Total Pagos - Mobile: 1 col, Desktop: 2 cols */}
        <StatCard data-testid="stat-card-total-pagos" className="col-span-1 lg:col-span-2">
          <StatCardTitle showArrow={false}>
            <DollarSign className="w-4 h-4 inline mr-1" />
            Total Pagos
          </StatCardTitle>
          <StatCardValue>
            {metricsData?.total_count_kpi?.formatted ?? '0'}
          </StatCardValue>
          <StatCardMeta>{metricsData?.total_count_kpi?.meta?.unit}</StatCardMeta>
        </StatCard>

        {/* Pagos a la Fecha - Mobile: 1 col, Desktop: 2 cols */}
        <StatCard data-testid="stat-card-pagos-fecha" className="col-span-1 lg:col-span-2">
          <StatCardTitle showArrow={false}>
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Pagos a la Fecha
          </StatCardTitle>
          <StatCardValue>
            {/* Mostrar total con símbolo de la MONEDA BASE de la organización (ej: USD 1.000) */}
            {formatMoneyAmount(
              metricsData?.total_confirmed_kpi?.value ?? 0, 
              defaultCurrency?.code || defaultCurrency?.symbol || '$'
            )}
          </StatCardValue>
          <StatCardMeta>
            {/* Mostrar desglose por moneda original (ej: ARS 1.140.000) */}
            {metricsData?.total_confirmed_kpi?.breakdown && metricsData.total_confirmed_kpi.breakdown.length > 0
              ? `Detalle: ${formatBreakdown(metricsData.total_confirmed_kpi)}`
              : `Total de pagos confirmados`
            }
          </StatCardMeta>
        </StatCard>
      </div>

      <Table
        columns={columns}
        data={sortedPayments}
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
          showImport: true,
          onImport: handleImport,
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
