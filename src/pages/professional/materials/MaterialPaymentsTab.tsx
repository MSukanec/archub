import { useState, useMemo } from 'react';
import { DollarSign, Plus, Edit, Trash2, Paperclip, CheckCircle2, Calendar, Upload } from 'lucide-react'
import { useCurrentUser } from '@/features/users/hooks'
import { useProjectContext } from '@/stores/projectContext'
import { Table, Column } from '@/components/shared/table'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal'
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation'
import { format } from 'date-fns'
import { parseLocalDate } from '@/lib/date-utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components'
import {
  useMaterialPayments,
  useDeleteMaterialPayment,
  useCreateMaterialPayment,
  type MaterialPaymentWithRelations,
  MATERIAL_PAYMENT_STATUS,
} from '@/features/materials'
import { PaymentStatusBadge, type PaymentStatus } from '@/components/shared/PaymentStatusBadge'
import { useProject } from '@/features/projects/hooks/use-project'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization/hooks'
import { useOrganizationCurrencies, useOrgCurrencyContext } from '@/hooks/use-currencies'
import type { TargetField, ImportConfig, ProjectContext } from '@/features/imports/types'

interface MaterialPaymentsTabProps {
  projectId?: string;
  externalFilterIssueId?: string | null;
  onClearExternalFilter?: () => void;
  getAffectedIdsForIssue?: (issueId: string) => string[];
}

interface PaymentMetrics {
  total_count: number;
  reference_currency_id: string | null;
  reference_currency_code: string | null;
  reference_currency_symbol: string | null;
  total_confirmed: number;
  total_pending: number;
  total_rejected: number;
  count_confirmed: number;
  count_pending: number;
  count_rejected: number;
  count_skipped: number;
  latest_payment_date: string | null;
  confirmed_by_currency: Array<{ currency_symbol: string; amount: number }>;
  pending_by_currency: Array<{ currency_symbol: string; amount: number }>;
}

export default function MaterialPaymentsTab({ 
  projectId, 
  externalFilterIssueId, 
  onClearExternalFilter, 
  getAffectedIdsForIssue 
}: MaterialPaymentsTabProps) {
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();
  const { toast } = useToast();
  
  const organizationId = userData?.organization?.id
  const organizationName = userData?.organization?.name
  const activeProjectId = projectId || selectedProjectId
  
  const { data: projectData } = useProject(activeProjectId || undefined);
  const projectName = projectData?.name
  
  const { data: projectsData } = useProjects(organizationId);
  const { data: organizationWallets } = useOrganizationWallets(organizationId);
  const { data: organizationCurrencies } = useOrganizationCurrencies(organizationId);
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId);
  const { isMultiCurrency } = useOrgCurrencyContext(organizationId);

  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (externalFilterIssueId && onClearExternalFilter) {
      onClearExternalFilter();
    }
  };

  const [selectedPayments, setSelectedPayments] = useState<MaterialPaymentWithRelations[]>([]);

  const { data: paymentsData, isLoading } = useMaterialPayments(activeProjectId || undefined, organizationId);

  const allPayments = useMemo(() => {
    if (!paymentsData) return [];
    return paymentsData;
  }, [paymentsData]);

  const referenceCurrency = useMemo(() => {
    if (!allPayments || allPayments.length === 0) return null;
    
    const firstWithCurrency = allPayments.find(p => p.currency);
    return firstWithCurrency?.currency || null;
  }, [allPayments]);

  const metricsData = useMemo<PaymentMetrics>(() => {
    let totalConfirmed = 0;
    let totalPending = 0;
    let totalRejected = 0;
    let countConfirmed = 0;
    let countPending = 0;
    let countRejected = 0;
    let countSkipped = 0;
    let latestPaymentDate: string | null = null;

    const confirmedByCurrency = new Map<string, { symbol: string; amount: number }>();
    const pendingByCurrency = new Map<string, { symbol: string; amount: number }>();

    allPayments.forEach(payment => {
      if (!payment.currency) return;

      const currencySymbol = payment.currency.symbol;

      let convertedAmount = payment.amount;
      if (referenceCurrency && payment.currency.id !== referenceCurrency.id) {
        if (payment.exchange_rate && payment.exchange_rate > 0) {
          convertedAmount = payment.amount / payment.exchange_rate;
        } else {
          countSkipped += 1;
          convertedAmount = 0;
        }
      }

      if (payment.status === 'confirmed') {
        totalConfirmed += convertedAmount;
        countConfirmed += 1;
        
        const existing = confirmedByCurrency.get(currencySymbol);
        if (existing) {
          existing.amount += payment.amount;
        } else {
          confirmedByCurrency.set(currencySymbol, { symbol: currencySymbol, amount: payment.amount });
        }
      } else if (payment.status === 'pending') {
        totalPending += convertedAmount;
        countPending += 1;
        
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

      if (!latestPaymentDate || payment.payment_date > latestPaymentDate) {
        latestPaymentDate = payment.payment_date;
      }
    });

    return {
      total_count: allPayments.length,
      reference_currency_id: referenceCurrency?.id || null,
      reference_currency_code: referenceCurrency?.code || null,
      reference_currency_symbol: referenceCurrency?.symbol || null,
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
  }, [allPayments, referenceCurrency]);

  const filterOptions = useMemo(() => {
    const wallets = new Set<string>();
    const currencies = new Set<string>();

    allPayments.forEach(payment => {
      if (payment.wallet?.wallets?.name) wallets.add(payment.wallet.wallets.name);
      if (payment.currency?.code) currencies.add(payment.currency.code);
    });

    return {
      wallets: Array.from(wallets).sort(),
      currencies: Array.from(currencies).sort(),
    };
  }, [allPayments]);

  const externalFilterIds = useMemo(() => {
    if (!externalFilterIssueId || !getAffectedIdsForIssue) return null;
    return new Set(getAffectedIdsForIssue(externalFilterIssueId));
  }, [externalFilterIssueId, getAffectedIdsForIssue]);

  const materialPayments = useMemo(() => {
    return allPayments.filter(payment => {
      if (externalFilterIds && !externalFilterIds.has(payment.id)) return false;
      if (filterWallet !== 'all' && payment.wallet?.wallets?.name !== filterWallet) return false;
      if (filterCurrency !== 'all' && payment.currency?.code !== filterCurrency) return false;
      if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
      
      return true;
    });
  }, [allPayments, filterWallet, filterCurrency, filterStatus, externalFilterIds]);

  const deletePaymentMutation = useDeleteMaterialPayment();

  const handleEdit = (payment: MaterialPaymentWithRelations) => {
    openModal('material-payment', {
      projectId: activeProjectId,
      organizationId: organizationId,
      paymentId: payment.id,
      mode: 'edit',
    });
  };

  const handleDeletePayment = (payment: MaterialPaymentWithRelations) => {
    if (!organizationId || !activeProjectId) return;

    const symbol = payment.currency?.symbol || '$';
    const formattedAmount = `${symbol} ${payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const paymentLabel = payment.reference 
      ? `${payment.reference} - ${formattedAmount}`
      : `${format(parseLocalDate(payment.payment_date)!, 'dd/MM/yyyy')} - ${formattedAmount}`;
    
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
    openModal('material-payment', {
      projectId: activeProjectId,
      organizationId: organizationId,
    });
  };

  const handleBulkDelete = () => {
    if (!organizationId || !activeProjectId || selectedPayments.length === 0) return;

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
              projectId: activeProjectId,
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

  const createPaymentMutation = useCreateMaterialPayment();

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
          options: (organizationCurrencies || []).map(oc => ({
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
          options: (organizationWallets || []).map(ow => ({
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
    (organizationWallets || []).forEach(ow => {
      if (ow.wallets?.name && ow.id) {
        const normalizedName = ow.wallets.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        walletValueMap[normalizedName] = ow.id;
      }
    });

    const currencyValueMap: Record<string, string> = {};
    (organizationCurrencies || []).forEach(oc => {
      if (oc.currency?.code && oc.currency_id) {
        const normalizedCode = oc.currency.code.toLowerCase().trim();
        currencyValueMap[normalizedCode] = oc.currency_id;
        if (oc.currency.name) {
          const normalizedName = oc.currency.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          currencyValueMap[normalizedName] = oc.currency_id;
        }
      }
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
    };

    const projectContext: ProjectContext = activeProjectId 
      ? { type: 'project', projectId: activeProjectId, projectName: projectName || undefined }
      : { type: 'organization', organizationId: organizationId!, organizationName: organizationName || undefined };

    openModal('universal-import', {
      config: {
        entityName: 'Pago de Materiales',
        entityNamePlural: 'Pagos de Materiales',
        targetSchema,
        valueMapConfig,
        projectContext,
        availableProjects: projectsData?.map(p => ({ id: p.id, name: p.name })) || [],
        fieldHelpMessages: {
          wallet_name: {
            message: 'Las billeteras que no se encuentran deben agregarse primero en la configuración de tu organización.',
            linkText: 'Ir a Configuración de Finanzas',
            linkUrl: '/settings/finances',
          },
          currency_code: {
            message: 'Las monedas que no se encuentran deben agregarse primero en la configuración de tu organización.',
            linkText: 'Ir a Configuración de Finanzas',
            linkUrl: '/settings/finances',
          },
        },
        onImport: async (rows: Record<string, any>[]) => {
          const currenciesMap = new Map<string, string>();
          (organizationCurrencies || []).forEach(oc => {
            if (oc.currency?.code && oc.currency_id) {
              currenciesMap.set(oc.currency.code.toLowerCase(), oc.currency_id);
              if (oc.currency.name) {
                currenciesMap.set(oc.currency.name.toLowerCase(), oc.currency_id);
              }
            }
          });

          const walletsMap = new Map<string, string>();
          let defaultWalletId: string | null = null;
          
          allPayments.forEach(payment => {
            if (payment.wallet?.wallets?.name && payment.wallet.id) {
              const normalizedName = payment.wallet.wallets.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              walletsMap.set(normalizedName, payment.wallet.id);
              if (!defaultWalletId) {
                defaultWalletId = payment.wallet.id;
              }
            }
          });
          
          if (walletsMap.size === 0 && organizationWallets && organizationWallets.length > 0) {
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
          }

          const invalidRows: Array<{ index: number; reason: string }> = [];
          const validRowsToImport: typeof rows = [];

          rows.forEach((row, idx) => {
            const errors: string[] = [];
            
            const projectId = row._projectId;
            if (!projectId && !activeProjectId) {
              errors.push('Proyecto no especificado');
            }
            
            const currencyInput = (row.currency_id || row.currency_code || '') as string;
            let currencyId: string | null = null;
            
            if (!currencyInput.trim()) {
              errors.push('Código de moneda vacío');
            } else {
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currencyInput.trim());
              if (isUUID) {
                currencyId = currencyInput.trim();
              } else {
                const currencyCodeLower = currencyInput.toLowerCase().trim();
                currencyId = currenciesMap.get(currencyCodeLower) || 
                            valueMapConfig.currency_code?.[currencyCodeLower] || null;
                
                if (!currencyId) {
                  const availableCurrencies = Array.from(currenciesMap.keys()).map(c => c.toUpperCase());
                  errors.push(`Moneda "${currencyInput}" no encontrada. Monedas disponibles: ${availableCurrencies.join(', ')}`);
                }
              }
            }
            
            const amount = parseFloat(row.amount);
            if (isNaN(amount) || amount <= 0) {
              errors.push(`Monto inválido: "${row.amount}" (debe ser un número mayor a 0)`);
            }
            
            const paymentDate = row.payment_date;
            if (!paymentDate) {
              errors.push('Fecha de pago vacía');
            }

            if (errors.length > 0) {
              invalidRows.push({ index: idx + 1, reason: errors.join(' | ') });
              return;
            }

            validRowsToImport.push({ ...row, _currencyId: currencyId });
          });

          if (invalidRows.length > 0) {
            const errorMsg = invalidRows.map(e => `Fila ${e.index}: ${e.reason}`).join('\n');
            toast({
              title: 'Error de validación',
              description: `No se puede importar. Problemas encontrados:\n${errorMsg}`,
              variant: 'destructive',
            });
            throw new Error(`Validación fallida: ${invalidRows.length} filas inválidas`);
          }

          if (!defaultWalletId) {
            toast({
              title: 'Error de validación',
              description: 'No hay billeteras disponibles en el proyecto. Crea al menos una billetera antes de importar pagos.',
              variant: 'destructive',
            });
            throw new Error('No hay billeteras disponibles');
          }

          const validStatuses = ['confirmed', 'pending', 'overdue', 'cancelled'];
          let successCount = 0;
          for (const row of validRowsToImport) {
            try {
              let resolvedWalletId: string | null = defaultWalletId;
              if (row.wallet_name) {
                const walletInput = String(row.wallet_name).trim();
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(walletInput);
                if (isUUID) {
                  resolvedWalletId = walletInput;
                } else {
                  resolvedWalletId = walletsMap.get(walletInput.toLowerCase()) || defaultWalletId;
                }
              }

              const resolvedStatus = validStatuses.includes(row.status) ? row.status : 'confirmed';

              const paymentData = {
                purchase_id: null,
                amount: parseFloat(row.amount) || 0,
                currency_id: row._currencyId,
                exchange_rate: parseFloat(row.exchange_rate) || null,
                payment_date: row.payment_date || new Date().toISOString().split('T')[0],
                status: resolvedStatus,
                wallet_id: resolvedWalletId,
                reference: row.reference || null,
                notes: row.notes || null,
              };

              const targetProjectId = row._projectId || activeProjectId;
              
              if (!targetProjectId) {
                throw new Error('No se pudo determinar el proyecto para este pago');
              }
              
              const currentMember = organizationMembers.find((m: any) => m.user_id === userData?.user?.id);
              if (!currentMember) {
                throw new Error('No se encontró el miembro de la organización actual');
              }
              
              await createPaymentMutation.mutateAsync({
                payment: paymentData,
                projectId: targetProjectId,
                organizationId,
                createdBy: currentMember.id,
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

  const formatDate = (dateString: string, formatString: string) => {
    try {
      const date = parseLocalDate(dateString);
      return date ? format(date, formatString) : '-';
    } catch {
      return '-';
    }
  };

  const formatAmount = (amount: number, currencySymbol: string | undefined) => {
    const symbol = currencySymbol || '$';
    return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCurrencyKPI = (amount: number, currencySymbol: string | null) => {
    const formattedInteger = Math.round(amount).toLocaleString('es-AR');
    const symbol = currencySymbol || '$';
    return <span>{symbol} {formattedInteger}</span>;
  };

  const formatCurrencyBreakdown = (currencyData: Array<{ currency_symbol: string; amount: number }>) => {
    if (!currencyData || currencyData.length === 0) return '-';
    
    return currencyData.map(({ currency_symbol, amount }) => {
      const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${currency_symbol} ${formattedAmount}`;
    }).join(' + ');
  };

  const columns: Column<MaterialPaymentWithRelations>[] = [
    {
      key: 'payment_date',
      label: 'Fecha de Pago',
      type: 'date' as const,
      sortable: true,
      render: (payment: MaterialPaymentWithRelations) => formatDate(payment.payment_date, 'dd/MM/yyyy'),
    },
    ...(activeProjectId ? [] : [{
      key: 'project',
      label: 'Proyecto',
      type: 'badge' as const,
      sortable: true,
      render: (payment: MaterialPaymentWithRelations) => {
        if (!payment.project) return '-';
        return (
          <Badge variant="neutral" className="font-medium whitespace-nowrap">
            {payment.project.name}
          </Badge>
        );
      },
    }]),
    {
      key: 'notes',
      label: 'Descripción',
      type: 'long-text' as const,
      sortable: true,
      render: (payment: MaterialPaymentWithRelations) => payment.notes || '-',
    },
    {
      key: 'wallet',
      label: 'Billetera',
      type: 'wallet' as const,
      sortable: true,
      render: (payment: MaterialPaymentWithRelations) => payment.wallet?.wallets?.name || '-',
    },
    {
      key: 'amount',
      label: 'Monto',
      type: 'amount' as const,
      sortable: true,
      sortType: 'number' as const,
      render: (payment: MaterialPaymentWithRelations) => (
        <div className="flex flex-col items-end">
          <span className="font-bold">{formatAmount(payment.amount, payment.currency?.symbol)}</span>
          {isMultiCurrency && payment.exchange_rate != null && (
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
      type: 'status' as const,
      sortable: true,
      render: (payment: MaterialPaymentWithRelations) => (
        <PaymentStatusBadge status={payment.status as PaymentStatus} />
      ),
    },
  ];

  const isFilterActive = 
    filterWallet !== 'all' || 
    filterCurrency !== 'all' || 
    filterStatus !== 'all';

  const handleClearFilters = () => {
    setFilterWallet('all');
    setFilterCurrency('all');
    setFilterStatus('all');
    if (onClearExternalFilter) {
      onClearExternalFilter();
    }
  };

  const handleViewPayment = (payment: MaterialPaymentWithRelations) => {
    openModal('material-payment', {
      projectId: activeProjectId,
      organizationId: organizationId,
      paymentId: payment.id,
      mode: 'view',
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard className="col-span-2" data-testid="stat-card-total-confirmado">
          <StatCardTitle showArrow={false}>
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Total Confirmado
          </StatCardTitle>
          <StatCardValue>
            {metricsData?.total_confirmed > 0
              ? formatCurrencyKPI(metricsData.total_confirmed, metricsData.reference_currency_symbol)
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

        <StatCard data-testid="stat-card-ultimo-pago">
          <StatCardTitle showArrow={false}>
            <Calendar className="w-4 h-4 inline mr-1" />
            Último Pago
          </StatCardTitle>
          <StatCardValue>
            {metricsData?.latest_payment_date 
              ? format(parseLocalDate(metricsData.latest_payment_date)!, 'd/M/yyyy')
              : '-'
            }
          </StatCardValue>
          <StatCardMeta>Fecha del último pago registrado</StatCardMeta>
        </StatCard>
      </div>

      <Table
        columns={columns}
        data={materialPayments}
        isLoading={isLoading}
        showDoubleHeader={false}
        selectable={true}
        selectedItems={selectedPayments}
        onSelectionChange={setSelectedPayments}
        getItemId={(payment) => payment.id}
        emptyStateConfig={{
          icon: <DollarSign className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay pagos de materiales',
          description: 'Agrega pagos de materiales para llevar un registro de los gastos del proyecto.',
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
          bulkActions: {
            onDelete: handleBulkDelete,
          },
          renderFilterContent: () => (
            <div className="space-y-3 p-2 min-w-[200px]">
              <div>
                <Label className="text-xs font-medium mb-1 block">Billetera</Label>
                <Select value={filterWallet} onValueChange={handleFilterChange(setFilterWallet)}>
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
                <Select value={filterCurrency} onValueChange={handleFilterChange(setFilterCurrency)}>
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
                <Label className="text-xs font-medium mb-1 block">Estado</Label>
                <Select value={filterStatus} onValueChange={handleFilterChange(setFilterStatus)}>
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
        leadingRowAction={(payment: MaterialPaymentWithRelations) => 
          payment.attachments && payment.attachments.length > 0 ? {
            label: 'Ver Adjunto',
            icon: Paperclip,
            onClick: () => window.open(payment.attachments![0].file_url, '_blank'),
          } : null
        }
        rowActions={(payment: MaterialPaymentWithRelations) => [
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
        renderCard={(payment: MaterialPaymentWithRelations) => (
          <div 
            className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleViewPayment(payment)}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-muted-foreground">
                {formatDate(payment.payment_date, 'dd/MM/yyyy')}
              </span>
              <PaymentStatusBadge status={payment.status as PaymentStatus} />
            </div>
            <div className="font-bold text-lg">
              {formatAmount(payment.amount, payment.currency?.symbol)}
            </div>
            {payment.wallet?.wallets?.name && (
              <div className="text-sm text-muted-foreground">
                {payment.wallet.wallets.name}
              </div>
            )}
            {payment.reference && (
              <div className="text-sm text-muted-foreground mt-1">
                Ref: {payment.reference}
              </div>
            )}
          </div>
        )}
      />
    </div>
  )
}
