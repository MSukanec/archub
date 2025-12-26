import { useState, useMemo, useEffect } from 'react';
import { DollarSign, Plus, Edit, Trash2, Paperclip, CheckCircle2, Calendar, Download, Filter, X } from 'lucide-react'
import { formatKPI, format as formatMoney } from '@/lib/money'
import { calculateMonetaryKPI, calculateCountKPI, calculateTextKPI, formatBreakdown } from '@/lib/kpis'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { Table } from '@/components/shared/table'
import { IdentityBadge } from '@/components/shared/IdentityBadge'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal'
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation'
import { format } from 'date-fns'
import { parseLocalDate } from '@/lib/date-utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
import ClientPaymentRow from '@/features/clients/components/ClientPaymentRow'
import { AppCard, AppCardTitle, AppCardValue, AppCardMeta } from '@/components/ActivityCard'
import {
  useClientPayments,
  useDeleteClientPayment,
  useCreateClientPayment,
  useClientCommitments,
  useProjectClients,
  type ClientPaymentWithRelations,
} from '@/features/clients'
import { useProject } from '@/features/projects/hooks/use-project'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { PaymentStatusBadge, type PaymentStatus } from '@/components/shared/PaymentStatusBadge'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization/hooks'
import { useOrganizationCurrencies, useOrgCurrencyContext } from '@/hooks/use-currencies'
import type { TargetField, ImportConfig, ProjectContext } from '@/features/imports/types'
import { formatContactName } from '@/utils/contacts'
import { PaymentReceiptPDF, type PaymentReceiptData } from '@/features/pdf'
import { pdf } from '@react-pdf/renderer'
import { useIsAdmin } from '@/hooks/use-admin-permissions'

interface ClientPaymentsViewProps {
  projectId?: string;
  initialFilterMonth?: string;
  initialFilterClient?: string;
  onClearDrillDown?: () => void;
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
  count_skipped: number;
  latest_payment_date: string | null;
  confirmed_by_currency: Array<{ currency_symbol: string; amount: number }>;
  pending_by_currency: Array<{ currency_symbol: string; amount: number }>;
}

export function ClientPaymentsView({ projectId, initialFilterMonth, initialFilterClient, onClearDrillDown }: ClientPaymentsViewProps) {
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
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
  const [filterHasSchedule, setFilterHasSchedule] = useState<string>('all');
  const [filterHasCommitment, setFilterHasCommitment] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>(initialFilterClient || 'all');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(initialFilterMonth || 'all');

  useEffect(() => {
    if (initialFilterMonth !== undefined) {
      setFilterMonth(initialFilterMonth || 'all');
    }
  }, [initialFilterMonth]);

  useEffect(() => {
    if (initialFilterClient !== undefined) {
      setFilterClient(initialFilterClient || 'all');
    }
  }, [initialFilterClient]);

  const [selectedPayments, setSelectedPayments] = useState<ClientPaymentWithRelations[]>([]);

  const { data: paymentsData, isLoading } = useClientPayments(activeProjectId || undefined, organizationId);
  const { data: commitmentsData } = useClientCommitments(activeProjectId || undefined, organizationId);
  const { data: projectClientsData } = useProjectClients(activeProjectId || undefined, organizationId);

  const allPayments = useMemo(() => {
    if (!paymentsData) return [];
    return paymentsData;
  }, [paymentsData]);

  const commitmentCurrency = useMemo(() => {
    if (!commitmentsData || commitmentsData.length === 0) return null;
    
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
    
    const entries = Array.from(currencyCount.values());
    if (entries.length === 0) return null;
    
    const mostCommon = entries.reduce((max, entry) => 
      entry.count > max.count ? entry : max
    );
    
    return mostCommon.currency;
  }, [commitmentsData]);

  const metricsKPIs = useMemo(() => {
    const confirmedPayments = allPayments.filter(p => p.status === 'confirmed');
    const latestDate = allPayments.length > 0 
      ? allPayments.reduce((latest, p) => p.payment_date > latest.payment_date ? p : latest).payment_date
      : null;
    
    const totalConfirmedKPI = calculateMonetaryKPI({
      items: confirmedPayments.map(p => ({
        amount: p.amount,
        currency_id: p.currency_id,
        currency: p.currency,
        exchange_rate: p.exchange_rate
      })),
      baseCurrencyId: commitmentCurrency?.code || commitmentCurrency?.id,
      symbol: commitmentCurrency?.symbol
    });

    const totalPaymentsKPI = calculateCountKPI({
      count: allPayments.length,
      label: 'Pagos'
    });

    const lastPaymentKPI = calculateTextKPI({
      text: latestDate ? format(parseLocalDate(latestDate)!, 'd/M/yyyy') : '-',
      icon: 'calendar'
    });

    return {
      total_confirmado_kpi: totalConfirmedKPI,
      total_count_kpi: totalPaymentsKPI,
      latest_payment_kpi: lastPaymentKPI,
      total_count: allPayments.length,
      latest_payment_date: latestDate
    };
  }, [allPayments, commitmentCurrency]);

  const metricsData = useMemo<PaymentMetrics>(() => {
    return {
      total_count: metricsKPIs.total_count,
      commitment_currency_id: null,
      commitment_currency_code: null,
      commitment_currency_symbol: null,
      total_confirmed: metricsKPIs.total_confirmado_kpi?.value ?? 0,
      total_pending: 0,
      total_rejected: 0,
      count_confirmed: 0,
      count_pending: 0,
      count_rejected: 0,
      count_skipped: 0,
      latest_payment_date: metricsKPIs.latest_payment_date,
      confirmed_by_currency: metricsKPIs.total_confirmado_kpi?.breakdown?.map(b => ({ currency_symbol: b.currencySymbol, amount: b.total })) || [],
      pending_by_currency: [],
    };
  }, [metricsKPIs]);

  const filterOptions = useMemo(() => {
    const wallets = new Set<string>();
    const currencies = new Set<string>();
    const clients = new Set<string>();
    const units = new Set<string>();
    const months = new Set<string>();

    allPayments.forEach(payment => {
      if (payment.wallet?.wallets?.name) wallets.add(payment.wallet.wallets.name);
      if (payment.currency?.code) currencies.add(payment.currency.code);
      if (payment.client?.contact) {
        const clientName = formatContactName(payment.client.contact);
        if (clientName && clientName !== 'Cliente') clients.add(clientName);
      }
      if (payment.commitment?.unit_name) units.add(payment.commitment.unit_name);
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
      clients: Array.from(clients).sort(),
      units: Array.from(units).sort(),
      months: Array.from(months).sort().reverse(),
    };
  }, [allPayments]);

  const clientPayments = useMemo(() => {
    return allPayments.filter(payment => {
      if (filterWallet !== 'all' && payment.wallet?.wallets?.name !== filterWallet) return false;
      if (filterCurrency !== 'all' && payment.currency?.code !== filterCurrency) return false;
      if (filterHasSchedule === 'yes' && !payment.schedule_id) return false;
      if (filterHasSchedule === 'no' && payment.schedule_id) return false;
      if (filterHasCommitment === 'yes' && !payment.commitment_id) return false;
      if (filterHasCommitment === 'no' && payment.commitment_id) return false;
      if (filterClient !== 'all') {
        const clientName = formatContactName(payment.client?.contact);
        if (clientName !== filterClient) return false;
      }
      if (filterUnit !== 'all' && payment.commitment?.unit_name !== filterUnit) return false;
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
  }, [allPayments, filterWallet, filterCurrency, filterHasSchedule, filterHasCommitment, filterClient, filterUnit, filterStatus, filterMonth]);

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

    const clientName = formatContactName(payment.client?.contact);
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

  const handleDownloadReceipt = async (payment: ClientPaymentWithRelations) => {
    try {
      const clientContact = payment.client?.contact;
      const clientName = formatContactName(clientContact);
      
      const receiptData: PaymentReceiptData = {
        id: payment.id,
        payment_date: payment.payment_date,
        amount: payment.amount,
        currency_symbol: payment.currency?.symbol || '$',
        currency_code: payment.currency?.code || 'ARS',
        exchange_rate: payment.exchange_rate,
        status: payment.status,
        reference: payment.reference,
        notes: payment.notes,
        wallet_name: payment.wallet?.wallets?.name,
        client_name: clientName,
        client_email: clientContact?.email,
        client_phone: clientContact?.phone,
        client_address: clientContact?.location,
        project_name: payment.project?.name || projectName,
        project_code: payment.project?.code,
        organization_name: organizationName,
        organization_logo: userData?.organization?.logo_url,
        organization_address: userData?.organization?.address,
        organization_email: userData?.organization?.email,
        organization_phone: userData?.organization?.phone,
        commitment_total: payment.commitment?.amount,
      };

      const blob = await pdf(<PaymentReceiptPDF data={receiptData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo-${payment.id.slice(0, 8)}-${payment.payment_date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Recibo descargado",
        description: "El recibo de pago se ha descargado correctamente.",
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el recibo. Intenta de nuevo.",
        variant: "destructive",
      });
    }
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

  const createPaymentMutation = useCreateClientPayment();

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
        field: 'client_name',
        label: 'Cliente (Nombre)',
        type: 'foreign-key',
        required: false,
        description: 'Ej: Juan García (opcional, puede omitirse)',
        foreignKeyConfig: {
          entityName: 'client',
          labelKey: 'label',
          valueKey: 'value',
          options: [],
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

    const availableClientsMap = new Map<string, { id: string; name: string }>();
    
    if (projectClientsData && projectClientsData.length > 0) {
      projectClientsData.forEach(client => {
        if (client.contact && client.id) {
          const clientName = formatContactName(client.contact);
          if (clientName !== 'Cliente' && !availableClientsMap.has(client.id)) {
            availableClientsMap.set(client.id, { id: client.id, name: clientName });
          }
        }
      });
    }
    
    if (commitmentsData && commitmentsData.length > 0) {
      commitmentsData.forEach(commitment => {
        if (commitment.project_client?.contact && commitment.client_id) {
          const clientName = formatContactName(commitment.project_client.contact);
          if (clientName !== 'Cliente' && !availableClientsMap.has(commitment.client_id)) {
            availableClientsMap.set(commitment.client_id, { id: commitment.client_id, name: clientName });
          }
        }
      });
    }
    
    allPayments.forEach(payment => {
      if (payment.client?.contact && payment.client_id) {
        const clientName = formatContactName(payment.client.contact);
        if (clientName !== 'Cliente' && !availableClientsMap.has(payment.client_id)) {
          availableClientsMap.set(payment.client_id, { id: payment.client_id, name: clientName });
        }
      }
    });

    const availableClients = Array.from(availableClientsMap.values());

    openModal('universal-import', {
      config: {
        entityName: 'Pago de Cliente',
        entityNamePlural: 'Pagos de Clientes',
        targetSchema,
        valueMapConfig,
        projectContext,
        availableProjects: projectsData?.map(p => ({ id: p.id, name: p.name })) || [],
        availableClients,
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
        },
        onImport: async (rows: any[]) => {
          const clientsData: Record<string, string> = {};
          
          if (projectClientsData && projectClientsData.length > 0) {
            projectClientsData.forEach(client => {
              if (client.contact && client.id) {
                const clientName = formatContactName(client.contact);
                if (clientName !== 'Cliente') {
                  clientsData[clientName.toLowerCase()] = client.id;
                }
              }
            });
          }
          
          if (commitmentsData && commitmentsData.length > 0) {
            commitmentsData.forEach(commitment => {
              if (commitment.project_client?.contact && commitment.client_id) {
                const clientName = formatContactName(commitment.project_client.contact);
                if (clientName !== 'Cliente') {
                  clientsData[clientName.toLowerCase()] = commitment.client_id;
                }
              }
            });
          }
          
          allPayments.forEach(payment => {
            if (payment.client?.contact && payment.client_id) {
              const clientName = formatContactName(payment.client.contact);
              if (clientName !== 'Cliente') {
                clientsData[clientName.toLowerCase()] = payment.client_id;
              }
            }
          });

          const currenciesMap = new Map<string, string>();
          allPayments.forEach(payment => {
            if (payment.currency) {
              currenciesMap.set(payment.currency.code.toLowerCase(), payment.currency.id);
            }
          });
          
          if (currenciesMap.size === 0) {
            for (const [code, id] of Object.entries(valueMapConfig.currency_code || {})) {
              currenciesMap.set(code, id);
            }
          }

          const walletsMap = new Map<string, string>();
          let defaultWalletId: string | null = null;
          
          allPayments.forEach(payment => {
            if (payment.wallet?.wallets?.name && payment.wallet_id) {
              walletsMap.set(payment.wallet.wallets.name.toLowerCase(), payment.wallet_id);
              if (!defaultWalletId) {
                defaultWalletId = payment.wallet_id;
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
            
            const clientNameInput = (row._clientId || row.client_id || row.client_name || '') as string;
            const clientName = clientNameInput.toLowerCase().trim();
            let clientId: string | null = null;
            
            if (clientNameInput.trim()) {
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientNameInput.trim());
              if (isUUID) {
                clientId = clientNameInput.trim();
              } else {
                clientId = clientsData[clientName] || null;
                if (!clientId) {
                  errors.push(`Cliente "${clientNameInput}" no encontrado. Clientes disponibles: ${Object.keys(clientsData).slice(0, 3).join(', ')}${Object.keys(clientsData).length > 3 ? '...' : ''}`);
                }
              }
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

            validRowsToImport.push({ ...row, _clientId: clientId, _currencyId: currencyId });
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
                client_id: row._clientId,
                amount: parseFloat(row.amount) || 0,
                currency_id: row._currencyId,
                exchange_rate: parseFloat(row.exchange_rate) || null,
                payment_date: row.payment_date || new Date().toISOString().split('T')[0],
                status: resolvedStatus,
                wallet_id: resolvedWalletId,
                reference: row.reference || null,
                notes: row.notes || null,
                commitment_id: null,
                schedule_id: null,
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

  const columns = [
    {
      key: 'payment_date',
      label: 'Fecha de Pago',
      type: 'date' as const,
      sortable: true,
      render: (payment: ClientPaymentWithRelations) => formatDate(payment.payment_date, 'dd/MM/yyyy'),
    },
    ...(activeProjectId ? [] : [{
      key: 'project',
      label: 'Proyecto',
      type: 'badge' as const,
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
      type: 'long-text' as const,
      sortable: true,
      render: (payment: ClientPaymentWithRelations) => {
        const contact = payment.client?.contact;
        const displayName = formatContactName(contact) || '-';
        
        const avatarUrl = (contact?.image_bucket && contact?.image_path)
          ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${contact.image_bucket}/${contact.image_path}`
          : null;
        
        const unit = payment.commitment?.unit_name;
        
        return (
          <IdentityBadge
            name={displayName}
            avatarUrl={avatarUrl}
            size="sm"
            subLabel={unit}
          />
        );
      },
    },
    {
      key: 'commitment_id',
      label: 'Compromiso',
      type: 'amount' as const,
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
      type: 'date' as const,
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
      type: 'amount' as const,
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
      render: (payment: ClientPaymentWithRelations) => (
        <PaymentStatusBadge status={payment.status as PaymentStatus} />
      ),
    },
  ];

  const isFilterActive = 
    filterWallet !== 'all' || 
    filterCurrency !== 'all' || 
    filterHasSchedule !== 'all' || 
    filterHasCommitment !== 'all' || 
    filterClient !== 'all' || 
    filterUnit !== 'all' ||
    filterStatus !== 'all' ||
    filterMonth !== 'all';

  const hasDrillDownFilter = !!(initialFilterMonth || initialFilterClient);
  const drillDownLabel = useMemo(() => {
    const parts: string[] = [];
    if (initialFilterMonth) {
      const [year, month] = initialFilterMonth.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      parts.push(`${monthNames[parseInt(month) - 1]} ${year}`);
    }
    if (initialFilterClient) {
      parts.push(initialFilterClient);
    }
    return parts.join(' - ');
  }, [initialFilterMonth, initialFilterClient]);

  const handleClearFilters = () => {
    setFilterWallet('all');
    setFilterCurrency('all');
    setFilterHasSchedule('all');
    setFilterHasCommitment('all');
    setFilterClient('all');
    setFilterUnit('all');
    setFilterStatus('all');
    setFilterMonth('all');
    onClearDrillDown?.();
  };

  const handleViewPayment = (payment: ClientPaymentWithRelations) => {
    openModal('client-payment', {
      projectId: activeProjectId,
      organizationId: organizationId,
      paymentId: payment.id,
      mode: 'view',
    });
  };

  if (!isLoading && allPayments.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign />}
        title="No hay pagos registrados"
        description="Agrega pagos de clientes para llevar un registro de los ingresos del proyecto."
        action={
          <Button
            onClick={handleAddPayment}
            size="sm"
            data-testid="button-add-payment-empty"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Pago
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
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
            onClick={handleClearFilters}
            className="text-xs"
            data-testid="button-clear-drilldown"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar filtro
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AppCard className="col-span-2" data-testid="stat-card-total-confirmado">
          <AppCardTitle showArrow={false}>
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Total Confirmado
          </AppCardTitle>
          <AppCardValue>
            {metricsKPIs?.total_confirmado_kpi?.breakdown && metricsKPIs.total_confirmado_kpi.breakdown.length > 0
              ? formatMoney(metricsKPIs.total_confirmado_kpi.value, metricsKPIs.total_confirmado_kpi.breakdown[0].currencySymbol)
              : formatKPI(metricsKPIs?.total_confirmado_kpi?.value ?? 0)
            }
          </AppCardValue>
          <AppCardMeta>
            {metricsKPIs?.total_confirmado_kpi?.breakdown && metricsKPIs.total_confirmado_kpi.breakdown.length > 0
              ? formatBreakdown(metricsKPIs.total_confirmado_kpi)
              : 'Sin pagos confirmados'
            }
          </AppCardMeta>
        </AppCard>

        <AppCard data-testid="stat-card-total-pagos">
          <AppCardTitle showArrow={false}>
            <DollarSign className="w-4 h-4 inline mr-1" />
            Total Pagos
          </AppCardTitle>
          <AppCardValue>
            {metricsData?.total_count ?? 0}
          </AppCardValue>
          <AppCardMeta>Cantidad de pagos registrados</AppCardMeta>
        </AppCard>

        <AppCard data-testid="stat-card-ultimo-pago">
          <AppCardTitle showArrow={false}>
            <Calendar className="w-4 h-4 inline mr-1" />
            Último Pago
          </AppCardTitle>
          <AppCardValue>
            {metricsData?.latest_payment_date 
              ? format(parseLocalDate(metricsData.latest_payment_date)!, 'd/M/yyyy')
              : '-'
            }
          </AppCardValue>
          <AppCardMeta>Fecha del último pago registrado</AppCardMeta>
        </AppCard>
      </div>

      <Table
        columns={columns}
        data={clientPayments}
        isLoading={isLoading}
        showDoubleHeader={false}
        selectable={true}
        selectedItems={selectedPayments}
        onSelectionChange={setSelectedPayments}
        getItemId={(payment) => payment.id}
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
          bulkActions: {
            onDelete: handleBulkDelete,
          },
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
          ...(isAdmin ? [{
            label: 'Descargar Recibo',
            icon: Download,
            onClick: () => handleDownloadReceipt(payment),
          }] : []),
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

export default ClientPaymentsView;
