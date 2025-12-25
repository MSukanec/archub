import { useMemo, useState, useEffect } from 'react';
import { DollarSign, Plus, Edit, Trash2, Paperclip, Eye, Calendar, TrendingUp, Filter, Search, Bell, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { convertToBaseCurrency, formatKPI, formatSubValue } from '@/lib/money';
import { calculateMonetaryKPI, calculateCountKPI, formatBreakdown } from '@/lib/kpis';

import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/shared/table/Table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useGeneralCostsPayments, useDeleteGeneralCostPayment, type GeneralCostPayment } from '../hooks/use-general-costs-payments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import GeneralCostPaymentRow from '@/features/finances/components/GeneralCostPaymentRow';
import { useOrganizationDefaultCurrency, useOrganizationCurrencies, useOrgCurrencyContext } from '@/hooks/use-currencies';
import { useActionBarMobile } from '@/layouts';
import { useMobile } from '@/hooks/use-mobile';
import { parseLocalDate } from '@/lib/date-utils';
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization/hooks';
import { useGeneralCosts, useCreateGeneralCostPayment, generalCostsKeys } from '@/features/general-costs';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { format as formatMoneyAmount } from '@/lib/money';
import type { TargetField, ImportConfig } from '@/features/imports/types';
import { exportToExcel, createExportColumns } from '@/lib/export-utils';
import { pdf } from '@react-pdf/renderer';
import { GeneralCostPaymentsPDF, type GeneralCostPaymentsPDFData, type GeneralCostPaymentItem } from '@/features/pdf';

interface GeneralCostsPaymentsTabProps {
  initialFilterMonth?: string;
  initialFilterGeneralCost?: string;
  initialFilterCategory?: string;
  onClearDrillDown?: () => void;
}

export default function GeneralCostsPaymentsView({
  initialFilterMonth,
  initialFilterGeneralCost,
  initialFilterCategory,
  onClearDrillDown
}: GeneralCostsPaymentsTabProps = {}) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  
  const organizationId = userData?.organization?.id;
  const defaultCurrencyId = userData?.organization?.preferences?.default_currency_id;

  // Filter states
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterGeneralCost, setFilterGeneralCost] = useState<string>(initialFilterGeneralCost || 'all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(initialFilterMonth || 'all');
  const [filterCategory, setFilterCategory] = useState<string>(initialFilterCategory || 'all');

  // Selection state
  const [selectedPayments, setSelectedPayments] = useState<GeneralCostPayment[]>([]);

  const { data: allPayments = [], isLoading } = useGeneralCostsPayments(organizationId);
  const deletePaymentMutation = useDeleteGeneralCostPayment();
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);
  
  const { data: organizationWallets = [] } = useOrganizationWallets(organizationId);
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(organizationId);
  const { data: generalCostsData = [] } = useGeneralCosts(organizationId ?? null);
  const { data: members = [] } = useOrganizationMembers(organizationId);
  const createPaymentMutation = useCreateGeneralCostPayment();
  const { toast } = useToast();
  const { isMultiCurrency } = useOrgCurrencyContext(organizationId);

  // Obtener el member actual del usuario (igual que en el formulario de pagos)
  const currentMember = useMemo(() => {
    return members.find((m: any) => m.user_id === userData?.user?.id);
  }, [members, userData?.user?.id]);

  // Mobile Action Bar
  const {
    setActions,
    setShowActionBar,
    clearActions,
    setFilterConfig
  } = useActionBarMobile();
  const isMobile = useMobile();

  // Sync filter states with props when they change (drill-down from dashboard)
  useEffect(() => {
    // Reset all drill-down filters first, then apply new ones
    setFilterMonth(initialFilterMonth || 'all');
    setFilterGeneralCost(initialFilterGeneralCost || 'all');
    setFilterCategory(initialFilterCategory || 'all');
  }, [initialFilterMonth, initialFilterGeneralCost, initialFilterCategory]);

  // Check if we have active drill-down filters from dashboard
  const hasDrillDownFilter = !!(initialFilterMonth || initialFilterGeneralCost || initialFilterCategory);
  const drillDownLabel = initialFilterMonth 
    ? (() => {
        const [year, m] = initialFilterMonth.split('-');
        const date = new Date(parseInt(year), parseInt(m) - 1);
        return `Mes: ${date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`;
      })()
    : initialFilterCategory 
      ? `Categoría: ${initialFilterCategory}`
      : initialFilterGeneralCost 
        ? `Gasto General: ${initialFilterGeneralCost}`
        : null;

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const wallets = new Set<string>();
    const currencies = new Set<string>();
    const generalCosts = new Set<string>();
    const categories = new Set<string>();
    const months = new Set<string>();

    allPayments.forEach(payment => {
      if (payment.wallet?.wallets?.name) wallets.add(payment.wallet.wallets.name);
      if (payment.currency?.code) currencies.add(payment.currency.code);
      if (payment.general_cost?.name) generalCosts.add(payment.general_cost.name);
      if (payment.general_cost?.category?.name) categories.add(payment.general_cost.category.name);
      if (payment.payment_date) {
        const date = parseLocalDate(payment.payment_date);
        if (date) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          months.add(monthKey);
        }
      }
    });

    return {
      wallets: Array.from(wallets).sort(),
      currencies: Array.from(currencies).sort(),
      generalCosts: Array.from(generalCosts).sort(),
      categories: Array.from(categories).sort(),
      months: Array.from(months).sort().reverse(),
    };
  }, [allPayments]);

  // Apply filters
  const filteredPayments = useMemo(() => {
    return allPayments.filter(payment => {
      if (filterWallet !== 'all' && payment.wallet?.wallets?.name !== filterWallet) return false;
      if (filterCurrency !== 'all' && payment.currency?.code !== filterCurrency) return false;
      if (filterGeneralCost !== 'all' && payment.general_cost?.name !== filterGeneralCost) return false;
      if (filterCategory !== 'all' && payment.general_cost?.category?.name !== filterCategory) return false;
      if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
      if (filterMonth !== 'all' && payment.payment_date) {
        const date = parseLocalDate(payment.payment_date);
        if (date) {
          const paymentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (paymentMonth !== filterMonth) return false;
        }
      }
      return true;
    });
  }, [allPayments, filterWallet, filterCurrency, filterGeneralCost, filterCategory, filterStatus, filterMonth]);

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

  const handleBulkDelete = () => {
    if (!organizationId || selectedPayments.length === 0) return;

    const count = selectedPayments.length;
    
    showDeleteConfirmation({
      mode: 'simple',
      title: `Eliminar ${count} ${count === 1 ? 'pago' : 'pagos'}`,
      description: `¿Estás seguro de que querés eliminar ${count === 1 ? 'este pago' : `estos ${count} pagos`}? Esta acción no se puede deshacer.`,
      itemName: `${count} ${count === 1 ? 'pago seleccionado' : 'pagos seleccionados'}`,
      destructiveActionText: `Eliminar ${count === 1 ? 'pago' : 'pagos'}`,
      onDelete: async () => {
        let successCount = 0;
        let failCount = 0;
        
        for (const payment of selectedPayments) {
          try {
            await deletePaymentMutation.mutateAsync({
              paymentId: payment.id,
              organizationId,
            });
            successCount++;
          } catch (error) {
            console.error('Error deleting payment:', error);
            failCount++;
          }
        }
        
        setSelectedPayments([]);
        
        if (failCount > 0) {
          toast({
            title: 'Eliminación parcial',
            description: `Se eliminaron ${successCount} de ${count} pagos. ${failCount} fallaron.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Pagos eliminados',
            description: `Se eliminaron ${successCount} pagos correctamente.`,
          });
        }
      },
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
            { label: 'Vencido', value: 'overdue' },
            { label: 'Cancelado', value: 'cancelled' },
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
        'vencido': 'overdue',
        'cancelado': 'cancelled',
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
        onImport: async (rows: any[], onProgress?: (current: number, total: number) => void) => {
          const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

          const generalCostsMap = new Map<string, string>();
          generalCostsData.forEach(gc => {
            const normalized = gc.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            generalCostsMap.set(normalized, gc.id);
          });

          const currenciesMap = new Map<string, string>();
          organizationCurrencies.forEach(oc => {
            if (oc.currency?.code && oc.currency_id) {
              currenciesMap.set(oc.currency.code.toLowerCase().trim(), oc.currency_id);
              if (oc.currency.name) {
                const normalized = oc.currency.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                currenciesMap.set(normalized, oc.currency_id);
              }
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
          const validRowsToImport: Array<{ row: any; resolvedCurrencyId: string; resolvedGeneralCostId: string; resolvedWalletId: string | null }> = [];

          rows.forEach((row, idx) => {
            const rawGeneralCost = row.general_cost_name;
            if (!rawGeneralCost) {
              invalidRows.push({ index: idx + 1, reason: 'Sin gasto general asignado' });
              return;
            }
            let resolvedGeneralCostId = rawGeneralCost;
            if (!isValidUUID(rawGeneralCost)) {
              const normalized = String(rawGeneralCost).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              resolvedGeneralCostId = generalCostsMap.get(normalized) || null;
              if (!resolvedGeneralCostId) {
                invalidRows.push({ index: idx + 1, reason: `Gasto general "${rawGeneralCost}" no encontrado` });
                return;
              }
            }

            const rawCurrency = row.currency_code;
            if (!rawCurrency) {
              invalidRows.push({ index: idx + 1, reason: 'Sin moneda asignada' });
              return;
            }
            let resolvedCurrencyId = rawCurrency;
            if (!isValidUUID(rawCurrency)) {
              const normalized = String(rawCurrency).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              resolvedCurrencyId = currenciesMap.get(normalized) || null;
              if (!resolvedCurrencyId) {
                invalidRows.push({ index: idx + 1, reason: `Moneda "${rawCurrency}" no encontrada` });
                return;
              }
            }

            let resolvedWalletId: string | null = null;
            const rawWallet = row.wallet_name;
            if (rawWallet) {
              if (isValidUUID(rawWallet)) {
                resolvedWalletId = rawWallet;
              } else {
                const normalized = String(rawWallet).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                resolvedWalletId = walletsMap.get(normalized) || null;
              }
            }
            if (!resolvedWalletId) {
              resolvedWalletId = defaultWalletId;
            }

            validRowsToImport.push({ row, resolvedCurrencyId, resolvedGeneralCostId, resolvedWalletId });
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

          const totalToImport = validRowsToImport.length;
          let currentIndex = 0;

          const validStatuses = ['confirmed', 'pending', 'overdue', 'cancelled'];

          for (const { row, resolvedCurrencyId, resolvedGeneralCostId, resolvedWalletId } of validRowsToImport) {
            try {
              const resolvedStatus = validStatuses.includes(row.status) ? row.status : 'confirmed';

              await createPaymentMutation.mutateAsync({
                organization_id: organizationId!,
                payment_date: row.payment_date,
                amount: parseFloat(String(row.amount).replace(/[^0-9.-]/g, '')),
                currency_id: resolvedCurrencyId,
                exchange_rate: row.exchange_rate ? parseFloat(String(row.exchange_rate).replace(/[^0-9.-]/g, '')) : undefined,
                wallet_id: resolvedWalletId || undefined,
                general_cost_id: resolvedGeneralCostId,
                status: resolvedStatus,
                reference: row.reference || undefined,
                notes: row.notes || undefined,
                created_by: currentMember?.id,
              });
              successCount++;
            } catch (error) {
              console.error('Error importing row:', error);
              failCount++;
            }
            currentIndex++;
            onProgress?.(currentIndex, totalToImport);
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

          // Invalidar cache para refrescar la lista y dashboard (scoped by organizationId)
          if (successCount > 0 && organizationId) {
            queryClient.invalidateQueries({ queryKey: generalCostsKeys.paymentList(organizationId) });
            queryClient.invalidateQueries({ queryKey: generalCostsKeys.monthlySummaryList(organizationId) });
            queryClient.invalidateQueries({ queryKey: generalCostsKeys.byCategoryList(organizationId) });
          }
        },
      } as ImportConfig,
    });
  };

  const handleExportExcel = () => {
    const exportColumns = [
      { key: 'payment_date', label: 'Fecha de Pago', render: (p: GeneralCostPayment) => formatDate(p.payment_date) },
      { key: 'general_cost', label: 'Gasto General', render: (p: GeneralCostPayment) => p.general_cost?.name || '-' },
      { key: 'category', label: 'Categoría', render: (p: GeneralCostPayment) => p.general_cost?.category?.name || '-' },
      { key: 'notes', label: 'Notas', render: (p: GeneralCostPayment) => p.notes || '-' },
      { key: 'wallet', label: 'Billetera', render: (p: GeneralCostPayment) => p.wallet?.wallets?.name || '-' },
      { key: 'amount', label: 'Monto', render: (p: GeneralCostPayment) => p.amount },
      { key: 'currency', label: 'Moneda', render: (p: GeneralCostPayment) => p.currency?.code || '-' },
      { key: 'exchange_rate', label: 'Cotización', render: (p: GeneralCostPayment) => p.exchange_rate || '-' },
      { key: 'status', label: 'Estado', render: (p: GeneralCostPayment) => {
        const statusLabels: Record<string, string> = {
          confirmed: 'Confirmado',
          pending: 'Pendiente',
          overdue: 'Vencido',
          cancelled: 'Cancelado',
        };
        return statusLabels[p.status] || p.status;
      }},
      { key: 'reference', label: 'Referencia', render: (p: GeneralCostPayment) => p.reference || '-' },
    ];

    const filename = `gastos_generales_pagos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    
    exportToExcel({
      filename,
      sheetName: 'Pagos',
      columns: exportColumns,
      data: sortedPayments,
    });

    toast({
      title: 'Exportación exitosa',
      description: `Se exportaron ${sortedPayments.length} pagos a Excel.`,
    });
  };

  const handleExportPDF = async () => {
    try {
      const confirmedPayments = sortedPayments.filter(p => p.status === 'confirmed');
      const totalConfirmed = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const defaultSymbol = defaultCurrency?.symbol || '$';

      const pdfData: GeneralCostPaymentsPDFData = {
        organization_name: userData?.organization?.name || 'Mi Organización',
        organization_logo: userData?.organization?.logo_url || null,
        organization_address: userData?.organization?.address || null,
        organization_email: userData?.organization?.email || null,
        organization_phone: userData?.organization?.phone || null,
        payments: sortedPayments.map((p): GeneralCostPaymentItem => ({
          id: p.id,
          payment_date: p.payment_date,
          amount: p.amount,
          exchange_rate: p.exchange_rate,
          status: p.status,
          reference: p.reference,
          notes: p.notes,
          currency_symbol: p.currency?.symbol,
          currency_code: p.currency?.code,
          wallet_name: p.wallet?.wallets?.name,
          general_cost_name: p.general_cost?.name,
          category_name: p.general_cost?.category?.name,
          creator_name: p.creator?.users?.full_name,
        })),
        total_count: sortedPayments.length,
        total_confirmed: confirmedPayments.length,
        total_confirmed_formatted: `${defaultSymbol} ${totalConfirmed.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        generated_at: new Date().toISOString(),
      };

      const blob = await pdf(<GeneralCostPaymentsPDF data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gastos_generales_pagos_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportación exitosa',
        description: `Se exportaron ${sortedPayments.length} pagos a PDF.`,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el PDF. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseLocalDate(dateString);
      return date ? format(date, 'dd/MM/yyyy') : '-';
    } catch {
      return '-';
    }
  };

  const formatAmount = (amount: number, currencySymbol: string | undefined) => {
    const symbol = currencySymbol || '$';
    return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadgeStyle = (status: any): React.CSSProperties => {
    const statusColorMap: Record<string, { colorVar: string }> = {
      confirmed: { colorVar: '--success' },
      pending: { colorVar: '--warning' },
      overdue: { colorVar: '--destructive' },
      cancelled: { colorVar: '--badge-status-neutral' },
    };
    const validStatus = status && typeof status === 'string' && status in statusColorMap 
      ? status 
      : 'cancelled';
    const config = statusColorMap[validStatus];
    return {
      color: `var(${config.colorVar})`,
      backgroundColor: `color-mix(in srgb, var(${config.colorVar}) 10%, transparent)`,
      borderColor: `color-mix(in srgb, var(${config.colorVar}) 30%, transparent)`,
    };
  };

  const getStatusLabel = (status: 'confirmed' | 'pending' | 'overdue' | 'cancelled') => {
    const labels: Record<string, string> = {
      confirmed: 'Confirmado',
      pending: 'Pendiente',
      overdue: 'Vencido',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
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
    setFilterCategory('all');
    setFilterMonth('all');
    onClearDrillDown?.();
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
              { value: 'overdue', label: 'Vencido' },
              { value: 'cancelled', label: 'Cancelado' }
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
          {isMultiCurrency && payment.exchange_rate != null && (
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
        const validStatus = (payment.status === 'confirmed' || payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'cancelled')
          ? payment.status
          : 'cancelled';
        return (
          <Badge 
            variant="default"
            style={getStatusBadgeStyle(validStatus)}
          >
            {getStatusLabel(validStatus)}
          </Badge>
        );
      },
    },
  ];

  const isFilterActive = 
    filterWallet !== 'all' || 
    filterCurrency !== 'all' || 
    filterGeneralCost !== 'all' ||
    filterCategory !== 'all' ||
    filterStatus !== 'all' ||
    filterMonth !== 'all';

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
            <div className="flex gap-3">
              <Button onClick={handleAddPayment} data-testid="button-add-payment">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Pago
              </Button>
              <Button onClick={handleImport} variant="secondary" data-testid="button-import-payments">
                <Upload className="w-4 h-4 mr-2" />
                Importar Pagos
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Drill-down filter banner */}
      {hasDrillDownFilter && drillDownLabel && (
        <div className="flex items-center justify-between bg-accent/10 border border-accent/20 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">
              Filtrando desde dashboard: <span className="text-accent">{drillDownLabel}</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterMonth('all');
              setFilterGeneralCost('all');
              setFilterCategory('all');
              onClearDrillDown?.();
            }}
            className="text-xs"
            data-testid="button-clear-drilldown"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar filtro
          </Button>
        </div>
      )}

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
            {/* Mostrar total con símbolo de la MONEDA BASE de la organización (ej: $ 1.000) */}
            {formatMoneyAmount(
              metricsData?.total_confirmed_kpi?.value ?? 0, 
              defaultCurrency?.symbol || '$'
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
        selectable={true}
        selectedItems={selectedPayments}
        onSelectionChange={setSelectedPayments}
        getItemId={(payment) => payment.id}
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
              Nuevo Pago
            </Button>
          ),
          secondaryAction: (
            <Button
              onClick={handleImport}
              size="sm"
              variant="secondary"
              data-testid="button-import-payments-empty"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar Pagos
            </Button>
          ),
        }}
        topBar={{
          showFilter: true,
          isFilterActive,
          onClearFilters: handleClearFilters,
          showImport: true,
          onImport: handleImport,
          showExport: true,
          onExport: handleExportExcel,
          onExportPDF: handleExportPDF,
          bulkActions: {
            onDelete: handleBulkDelete,
          },
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

              {/* Filter by Month */}
              {filterOptions.months.length > 0 && (
                <div>
                  <Label className="text-xs font-medium mb-1 block">Mes</Label>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {filterOptions.months.map(month => {
                        const [year, m] = month.split('-');
                        const date = new Date(parseInt(year), parseInt(m) - 1);
                        const label = date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
                        return (
                          <SelectItem key={month} value={month}>{label}</SelectItem>
                        );
                      })}
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
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
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
