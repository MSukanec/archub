import React, { useState, useMemo } from 'react';
import { DollarSign, Plus, Edit, Trash2, Paperclip, Eye, CheckCircle2, AlertCircle, Calendar, Upload } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal'
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation'
import { format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
import ClientPaymentRow from '@/features/clients/components/ClientPaymentRow'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard'
import {
  useClientPayments,
  useDeleteClientPayment,
  useCreateClientPayment,
  useClientCommitments,
  type ClientPaymentWithRelations,
} from '@/features/clients'
import { getClientPaymentStatusBadgeConfig } from '@/features/clients/utils/statusBadge'
import type { TargetField, ImportConfig } from '@/components/forms/imports/types'

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
    let totalConfirmed = 0;
    let totalPending = 0;
    let totalRejected = 0;
    let countConfirmed = 0;
    let countPending = 0;
    let countRejected = 0;
    let countSkipped = 0;
    let latestPaymentDate: string | null = null;

    // Track totals by original currency for breakdown (SIEMPRE se calcula)
    const confirmedByCurrency = new Map<string, { symbol: string; amount: number }>();
    const pendingByCurrency = new Map<string, { symbol: string; amount: number }>();

    // SIEMPRE calcular la suma real de montos sin conversión
    allPayments.forEach(payment => {
      if (!payment.currency) return;

      const currencySymbol = payment.currency.symbol;

      // Contar por estado - SIEMPRE sumar los montos reales en su moneda original
      if (payment.status === 'confirmed') {
        totalConfirmed += payment.amount;
        countConfirmed += 1;
        
        // Track by original currency
        const existing = confirmedByCurrency.get(currencySymbol);
        if (existing) {
          existing.amount += payment.amount;
        } else {
          confirmedByCurrency.set(currencySymbol, { symbol: currencySymbol, amount: payment.amount });
        }
      } else if (payment.status === 'pending') {
        totalPending += payment.amount;
        countPending += 1;
        
        // Track by original currency
        const existing = pendingByCurrency.get(currencySymbol);
        if (existing) {
          existing.amount += payment.amount;
        } else {
          pendingByCurrency.set(currencySymbol, { symbol: currencySymbol, amount: payment.amount });
        }
      } else if (payment.status === 'rejected') {
        totalRejected += payment.amount;
        countRejected += 1;
      }

      if (!latestPaymentDate || payment.payment_date > latestPaymentDate) {
        latestPaymentDate = payment.payment_date;
      }
    });

    return {
      total_count: allPayments.length,
      commitment_currency_id: commitmentCurrency?.id || null,
      commitment_currency_code: commitmentCurrency?.code || null,
      commitment_currency_symbol: commitmentCurrency?.symbol || null,
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

  const createPaymentMutation = useCreateClientPayment();

  const handleImport = () => {
    if (!organizationId || !activeProjectId || !userData?.user?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información requerida',
        variant: 'destructive',
      });
      return;
    }

    // Definir el schema de importación para pagos de cliente
    const targetSchema: TargetField[] = [
      {
        field: 'payment_date',
        label: 'Fecha de Pago',
        type: 'date',
        required: true,
        description: 'Ej: 2024-01-15',
      },
      {
        field: 'client_name',
        label: 'Cliente (Nombre)',
        type: 'string',
        required: true,
        description: 'Ej: Juan García',
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
          options: [
            { label: 'USD', value: 'USD' },
            { label: 'ARS', value: 'ARS' },
            { label: 'EUR', value: 'EUR' },
          ],
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
        type: 'string',
        required: false,
        description: 'Ej: Efectivo, Banco, Tarjeta',
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

    // Value map para traducir valores del CSV a IDs reales
    const valueMapConfig: Record<string, Record<string, string>> = {
      currency_code: {
        'usd': 'currency-usd-id',
        'ars': 'currency-ars-id',
        'eur': 'currency-eur-id',
      },
      status: {
        'confirmado': 'confirmed',
        'pendiente': 'pending',
        'rechazado': 'rejected',
        'anulado': 'void',
      },
    };

    // Abrir modal de importación universal
    openModal('universal-import', {
      config: {
        entityName: 'Pago de Cliente',
        entityNamePlural: 'Pagos de Clientes',
        targetSchema,
        valueMapConfig,
        onImport: async (rows: any[]) => {
          // Obtener los clientes desde TODOS los clientes del proyecto, no solo los pagos
          // Esto incluye clientes sin pagos previos
          const clientsData: Record<string, string> = {};
          
          // Primero, agregamos los clientes de los pagos existentes
          allPayments.forEach(payment => {
            if (payment.client?.contact && payment.client_id) {
              const clientName = String(payment.client.contact.company_name || 
                               payment.client.contact.full_name || 
                               `${payment.client.contact.first_name || ''} ${payment.client.contact.last_name || ''}`.trim());
              clientsData[clientName.toLowerCase()] = payment.client_id;
            }
          });

          // Obtener IDs de monedas
          const currenciesMap = new Map<string, string>();
          allPayments.forEach(payment => {
            if (payment.currency) {
              currenciesMap.set(payment.currency.code.toLowerCase(), payment.currency.id);
            }
          });

          // Obtener billeteras
          const walletsMap = new Map<string, string>();
          allPayments.forEach(payment => {
            if (payment.wallet?.wallets?.name && payment.wallet_id) {
              walletsMap.set(payment.wallet.wallets.name.toLowerCase(), payment.wallet_id);
            }
          });

          // Validar que TODOS los clientes existan ANTES de importar
          const invalidRows: Array<{ index: number; reason: string }> = [];
          const validRowsToImport: typeof rows = [];

          rows.forEach((row, idx) => {
            const clientNameInput = (row.client_id || row.client_name || '') as string;
            const clientName = clientNameInput.toLowerCase();
            const clientId = clientsData[clientName];
            const currencyCode = (row.currency_id || row.currency_code || '') as string;
            const currencyId = currenciesMap.get(currencyCode.toLowerCase());

            if (!clientId) {
              invalidRows.push({ index: idx + 1, reason: `Cliente "${row.client_id || row.client_name}" no encontrado en el sistema` });
              return;
            }

            if (!currencyId) {
              invalidRows.push({ index: idx + 1, reason: `Moneda "${currencyCode}" no encontrada` });
              return;
            }

            validRowsToImport.push({ ...row, _clientId: clientId, _currencyId: currencyId });
          });

          // Si hay filas inválidas, mostrar error y detener
          if (invalidRows.length > 0) {
            const errorMsg = invalidRows.map(e => `Fila ${e.index}: ${e.reason}`).join('\n');
            toast({
              title: 'Error de validación',
              description: `No se puede importar. Problemas encontrados:\n${errorMsg}`,
              variant: 'destructive',
            });
            throw new Error(`Validación fallida: ${invalidRows.length} filas inválidas`);
          }

          // Importar solo las filas válidas
          let successCount = 0;
          for (const row of validRowsToImport) {
            try {
              const paymentData = {
                client_id: row._clientId,
                amount: parseFloat(row.amount) || 0,
                currency_id: row._currencyId,
                exchange_rate: parseFloat(row.exchange_rate) || null,
                payment_date: row.payment_date || new Date().toISOString().split('T')[0],
                status: row.status || 'pending',
                wallet_id: (row.wallet_name && walletsMap.get(row.wallet_name.toLowerCase())) || null,
                reference: row.reference || null,
                notes: row.notes || null,
                commitment_id: null,
                schedule_id: null,
              };

              await createPaymentMutation.mutateAsync({
                payment: paymentData,
                projectId: activeProjectId,
                organizationId,
                createdBy: userData.user.id,
              });
              
              successCount++;
            } catch (error) {
              console.error('Error importando pago:', error);
              toast({
                title: 'Error al guardar pago',
                description: `No se pudo guardar un pago: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                variant: 'destructive',
              });
            }
          }

          toast({
            title: 'Importación completada',
            description: `Se importaron ${successCount} de ${rows.length} pagos correctamente`,
          });
        },
      },
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


  // Format currency for KPIs (integers only, no decimals)
  const formatCurrencyKPI = (amount: number, currencySymbol: string | null) => {
    const formattedInteger = Math.round(amount).toLocaleString('es-AR');
    const symbol = currencySymbol || '$';
    return <span>{symbol} {formattedInteger}</span>;
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
      render: (payment: ClientPaymentWithRelations) => formatDate(payment.payment_date, 'dd/MM/yyyy'),
    },
    // Project column - only shown when viewing organization-wide data
    ...(activeProjectId ? [] : [{
      key: 'project',
      label: 'Proyecto',
      sortable: true,
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
      key: 'commitment_id',
      label: 'Compromiso',
      sortable: true,
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
      key: 'amount',
      label: 'Monto',
      sortable: true,
      sortType: 'number' as const,
      render: (payment: ClientPaymentWithRelations) => (
        <div className="flex flex-col items-end">
          <span className="font-bold">{formatAmount(payment.amount, payment.currency?.symbol)}</span>
          {payment.wallet?.wallets?.name && (
            <span className="text-xs text-muted-foreground">
              {payment.wallet.wallets.name}
            </span>
          )}
          {payment.exchange_rate && (
            <span className="text-xs text-muted-foreground">
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
        {/* Card 1: Total Confirmado (2 cols en desktop, full row en mobile) */}
        <StatCard className="col-span-2" data-testid="stat-card-total-confirmado">
          <StatCardTitle showArrow={false}>
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Total Confirmado
          </StatCardTitle>
          <StatCardValue>
            {metricsData?.total_confirmed > 0
              ? formatCurrencyKPI(metricsData.total_confirmed, metricsData.commitment_currency_symbol)
              : <span>-</span>
            }
          </StatCardValue>
          <StatCardMeta>
            {metricsData?.confirmed_by_currency && metricsData.confirmed_by_currency.length > 0
              ? formatCurrencyBreakdown(metricsData.confirmed_by_currency)
              : 'Sin pagos confirmados'
            }
          </StatCardMeta>
        </StatCard>

        {/* Card 2: Total Pagos (1 col) */}
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

        {/* Card 3: Último Pago (1 col) */}
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
          showImport: true,
          onImport: handleImport,
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
        onRowClick={handleViewPayment}
        leadingRowAction={(payment: ClientPaymentWithRelations) => 
          payment.attachments && payment.attachments.length > 0 ? {
            label: 'Ver Adjunto',
            icon: Paperclip,
            onClick: () => window.open(payment.attachments![0].file_url, '_blank'),
          } : null
        }
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
