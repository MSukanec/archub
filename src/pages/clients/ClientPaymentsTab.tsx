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
import { parseLocalDate } from '@/lib/date-utils'
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
  useProjectClients,
  type ClientPaymentWithRelations,
} from '@/features/clients'
import { useProject } from '@/features/projects/hooks/use-project'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { getClientPaymentStatusBadgeConfig } from '@/features/clients/utils/statusBadge'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization/hooks'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import type { TargetField, ImportConfig, ProjectContext } from '@/features/imports/types'
import { formatContactName } from '@/utils/contacts'

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
  const organizationName = userData?.organization?.name
  const activeProjectId = projectId || selectedProjectId
  
  const { data: projectData } = useProject(activeProjectId || undefined);
  const projectName = projectData?.name
  
  // Get all projects for organization-level import
  const { data: projectsData } = useProjects(organizationId);
  
  // Get organization wallets for import
  const { data: organizationWallets } = useOrganizationWallets(organizationId);
  
  // Get organization currencies for import
  const { data: organizationCurrencies } = useOrganizationCurrencies(organizationId);
  
  // Get organization members to find current member for created_by FK
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId);

  // Filter states
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterHasSchedule, setFilterHasSchedule] = useState<string>('all');
  const [filterHasCommitment, setFilterHasCommitment] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Multi-select state
  const [selectedPayments, setSelectedPayments] = useState<ClientPaymentWithRelations[]>([]);

  // Use feature hooks to get client payments, commitments, and all project clients
  const { data: paymentsData, isLoading } = useClientPayments(activeProjectId || undefined, organizationId);
  const { data: commitmentsData } = useClientCommitments(activeProjectId || undefined, organizationId);
  const { data: projectClientsData } = useProjectClients(activeProjectId || undefined, organizationId);

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

    // Track totals by original currency for breakdown
    const confirmedByCurrency = new Map<string, { symbol: string; amount: number }>();
    const pendingByCurrency = new Map<string, { symbol: string; amount: number }>();

    allPayments.forEach(payment => {
      if (!payment.currency) return;

      const currencySymbol = payment.currency.symbol;

      // Convert amount to commitment currency using payment's exchange_rate
      // exchange_rate represents: 1 unit of payment currency = X units of commitment currency
      // So to convert: payment_amount * exchange_rate = amount in commitment currency
      let convertedAmount = payment.amount;
      if (commitmentCurrency && payment.currency.id !== commitmentCurrency.id) {
        if (payment.exchange_rate && payment.exchange_rate > 0) {
          convertedAmount = payment.amount * payment.exchange_rate;
        } else {
          countSkipped += 1;
          convertedAmount = 0; // Skip if no exchange rate
        }
      }

      if (payment.status === 'confirmed') {
        totalConfirmed += convertedAmount;
        countConfirmed += 1;
        
        // Track by original currency (unconverted amounts)
        const existing = confirmedByCurrency.get(currencySymbol);
        if (existing) {
          existing.amount += payment.amount;
        } else {
          confirmedByCurrency.set(currencySymbol, { symbol: currencySymbol, amount: payment.amount });
        }
      } else if (payment.status === 'pending') {
        totalPending += convertedAmount;
        countPending += 1;
        
        // Track by original currency (unconverted amounts)
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
        const clientName = formatContactName(payment.client.contact);
        if (clientName && clientName !== 'Cliente') clients.add(clientName);
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
        const clientName = formatContactName(payment.client?.contact);
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

  // Bulk delete handler
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
        
        // Clear selection after bulk delete
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
        type: 'foreign-key',
        required: false,
        description: 'Ej: Juan García (opcional, puede omitirse)',
        foreignKeyConfig: {
          entityName: 'client',
          labelKey: 'label',
          valueKey: 'value',
          options: [], // Will be populated dynamically with availableClients
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
            value: ow.id, // Use organization_wallets.id (FK target for client_payments.wallet_id)
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

    // Build wallet value map from organization wallets
    // IMPORTANT: client_payments.wallet_id is FK to organization_wallets.id, NOT wallets.id
    const walletValueMap: Record<string, string> = {};
    (organizationWallets || []).forEach(ow => {
      if (ow.wallets?.name && ow.id) {
        const normalizedName = ow.wallets.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        walletValueMap[normalizedName] = ow.id; // Use organization_wallets.id, not wallet_id
      }
    });

    // Build currency value map from organization currencies
    const currencyValueMap: Record<string, string> = {};
    (organizationCurrencies || []).forEach(oc => {
      if (oc.currency?.code && oc.currency_id) {
        // Map by code (lowercase)
        const normalizedCode = oc.currency.code.toLowerCase().trim();
        currencyValueMap[normalizedCode] = oc.currency_id;
        // Also map by name (lowercase, without accents)
        if (oc.currency.name) {
          const normalizedName = oc.currency.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          currencyValueMap[normalizedName] = oc.currency_id;
        }
      }
    });

    // Value map para traducir valores del CSV a IDs reales
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

    // Contexto de proyecto para la importación - always pass project context with name
    const projectContext: ProjectContext = activeProjectId 
      ? { type: 'project', projectId: activeProjectId, projectName: projectName || undefined }
      : { type: 'organization', organizationId: organizationId!, organizationName: organizationName || undefined };

    // Build available clients list for foreign-key resolution using formatContactName

    const availableClientsMap = new Map<string, { id: string; name: string }>();
    
    // Add clients from projectClientsData (primary source)
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
    
    // Add clients from commitments
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
    
    // Add clients from existing payments
    allPayments.forEach(payment => {
      if (payment.client?.contact && payment.client_id) {
        const clientName = formatContactName(payment.client.contact);
        if (clientName !== 'Cliente' && !availableClientsMap.has(payment.client_id)) {
          availableClientsMap.set(payment.client_id, { id: payment.client_id, name: clientName });
        }
      }
    });

    const availableClients = Array.from(availableClientsMap.values());

    // Abrir modal de importación universal
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

          // Obtener IDs de monedas
          const currenciesMap = new Map<string, string>();
          allPayments.forEach(payment => {
            if (payment.currency) {
              currenciesMap.set(payment.currency.code.toLowerCase(), payment.currency.id);
            }
          });
          
          // Agregar valueMapConfig como fallback (en caso de que no haya pagos existentes)
          if (currenciesMap.size === 0) {
            for (const [code, id] of Object.entries(valueMapConfig.currency_code || {})) {
              currenciesMap.set(code, id);
            }
          }

          // Obtener billeteras
          const walletsMap = new Map<string, string>();
          let defaultWalletId: string | null = null;
          
          // First try to get from existing payments
          allPayments.forEach(payment => {
            if (payment.wallet?.wallets?.name && payment.wallet_id) {
              walletsMap.set(payment.wallet.wallets.name.toLowerCase(), payment.wallet_id);
              if (!defaultWalletId) {
                defaultWalletId = payment.wallet_id;
              }
            }
          });
          
          // Fallback to organization wallets if no payments exist
          // IMPORTANT: client_payments.wallet_id is FK to organization_wallets.id, NOT wallets.id
          if (walletsMap.size === 0 && organizationWallets && organizationWallets.length > 0) {
            console.log('[Import] Using organizationWallets fallback:', organizationWallets);
            organizationWallets.forEach(ow => {
              if (ow.wallets?.name && ow.id) {
                const normalizedName = ow.wallets.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                console.log('[Import] Adding wallet to map:', { name: normalizedName, id: ow.id, is_default: ow.is_default });
                walletsMap.set(normalizedName, ow.id); // Use organization_wallets.id
                if (!defaultWalletId && ow.is_default) {
                  defaultWalletId = ow.id; // Use organization_wallets.id
                  console.log('[Import] Set defaultWalletId from is_default:', defaultWalletId);
                }
              }
            });
            // If no default wallet, use the first one
            if (!defaultWalletId && organizationWallets.length > 0) {
              defaultWalletId = organizationWallets[0].id; // Use organization_wallets.id
              console.log('[Import] Set defaultWalletId from first wallet:', defaultWalletId);
            }
          }
          console.log('[Import] Final walletsMap:', Object.fromEntries(walletsMap));
          console.log('[Import] Final defaultWalletId:', defaultWalletId);

          // Validar que TODOS los clientes existan ANTES de importar
          const invalidRows: Array<{ index: number; reason: string }> = [];
          const validRowsToImport: typeof rows = [];

          rows.forEach((row, idx) => {
            const errors: string[] = [];
            
            // Validar proyecto (para importación a nivel organización)
            const projectId = row._projectId;
            if (!projectId && !activeProjectId) {
              errors.push('Proyecto no especificado');
            }
            
            // Validar cliente (opcional - client_id puede ser null)
            const clientNameInput = (row._clientId || row.client_id || row.client_name || '') as string;
            const clientName = clientNameInput.toLowerCase().trim();
            let clientId: string | null = null;
            
            // Si hay un nombre de cliente, intentar resolverlo
            if (clientNameInput.trim()) {
              // Check if it's already a UUID (from manual mapping in conflicts step)
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
            // Si clientNameInput está vacío o es null, clientId queda como null (permitido)
            
            // Validar moneda
            const currencyInput = (row.currency_id || row.currency_code || '') as string;
            let currencyId: string | null = null;
            
            if (!currencyInput.trim()) {
              errors.push('Código de moneda vacío');
            } else {
              // Check if it's already a UUID (from conflict resolution step)
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currencyInput.trim());
              if (isUUID) {
                currencyId = currencyInput.trim();
              } else {
                // Try to resolve by code/name
                const currencyCodeLower = currencyInput.toLowerCase().trim();
                currencyId = currenciesMap.get(currencyCodeLower) || 
                            valueMapConfig.currency_code?.[currencyCodeLower] || null;
                
                if (!currencyId) {
                  const availableCurrencies = Array.from(currenciesMap.keys()).map(c => c.toUpperCase());
                  errors.push(`Moneda "${currencyInput}" no encontrada. Monedas disponibles: ${availableCurrencies.join(', ')}`);
                }
              }
            }
            
            // Validar monto
            const amount = parseFloat(row.amount);
            if (isNaN(amount) || amount <= 0) {
              errors.push(`Monto inválido: "${row.amount}" (debe ser un número mayor a 0)`);
            }
            
            // Validar fecha
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

          // Si no hay billetera, mostrar error
          if (!defaultWalletId) {
            toast({
              title: 'Error de validación',
              description: 'No hay billeteras disponibles en el proyecto. Crea al menos una billetera antes de importar pagos.',
              variant: 'destructive',
            });
            throw new Error('No hay billeteras disponibles');
          }

          // Importar solo las filas válidas
          let successCount = 0;
          for (const row of validRowsToImport) {
            try {
              // Resolve wallet_id - check if it's already a UUID from conflict resolution
              let resolvedWalletId: string | null = defaultWalletId;
              if (row.wallet_name) {
                const walletInput = String(row.wallet_name).trim();
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(walletInput);
                if (isUUID) {
                  resolvedWalletId = walletInput;
                  console.log('[Import] wallet_name is UUID, using directly:', resolvedWalletId);
                } else {
                  resolvedWalletId = walletsMap.get(walletInput.toLowerCase()) || defaultWalletId;
                  console.log('[Import] Resolved wallet_name:', { input: walletInput, resolved: resolvedWalletId });
                }
              } else {
                console.log('[Import] No wallet_name in row, using defaultWalletId:', defaultWalletId);
              }
              console.log('[Import] Final resolvedWalletId for this row:', resolvedWalletId);

              const paymentData = {
                client_id: row._clientId,
                amount: parseFloat(row.amount) || 0,
                currency_id: row._currencyId,
                exchange_rate: parseFloat(row.exchange_rate) || null,
                payment_date: row.payment_date || new Date().toISOString().split('T')[0],
                status: row.status || 'confirmed',
                wallet_id: resolvedWalletId,
                reference: row.reference || null,
                notes: row.notes || null,
                commitment_id: null,
                schedule_id: null,
              };

              // El projectId puede venir del row._projectId (importación org) o activeProjectId
              const targetProjectId = row._projectId || activeProjectId;
              
              if (!targetProjectId) {
                throw new Error('No se pudo determinar el proyecto para este pago');
              }
              
              // Find current organization member (created_by FK references organization_members.id, NOT users.id)
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

  // Format date helper - uses parseLocalDate to avoid timezone issues
  const formatDate = (dateString: string, formatString: string) => {
    try {
      const date = parseLocalDate(dateString);
      return date ? format(date, formatString) : '-';
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
        
        const displayName = formatContactName(payment.client?.contact);
        
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
              ? format(parseLocalDate(metricsData.latest_payment_date)!, 'd/M/yyyy')
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
