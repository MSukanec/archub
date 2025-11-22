import React, { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast'
import { Users, Plus, Edit, Trash2, User, FileText, Calendar, DollarSign, CheckCircle2, AlertCircle, ListChecks } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Link, useLocation } from 'wouter'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard'
import {
  useClientDashboard,
  useClientCommitments,
  useClientPayments,
  useDeleteProjectClient,
  useDeleteClientCommitment,
  mapToClientSummaries,
  type ProjectClientSummary,
  type CurrencyFinancial,
} from '@/features/clients'

// Extended type for table with computed clientName field
type EnrichedClient = ProjectClientSummary & { clientName: string };

interface ClientListTabProps {
  projectId?: string;
}

export default function ClientListTab({ projectId }: ClientListTabProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { setSidebarLevel } = useNavigationStore();
  const [, navigate] = useLocation();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  // Debug: log values
  console.log('[ClientObligationsTab] organizationId:', organizationId);
  console.log('[ClientObligationsTab] activeProjectId:', activeProjectId);
  console.log('[ClientObligationsTab] enabled:', !!activeProjectId && !!organizationId);

  // Use feature hooks to get dashboard data, commitments, and payments
  const { data: dashboardData, isLoading } = useClientDashboard(activeProjectId || undefined, organizationId);

  // Debug: log dashboard data
  console.log('[ClientObligationsTab] dashboardData:', dashboardData);
  console.log('[ClientObligationsTab] isLoading:', isLoading);
  const { data: commitmentsData } = useClientCommitments(activeProjectId || undefined, organizationId);
  const { data: paymentsData } = useClientPayments(activeProjectId || undefined, organizationId);

  // Transform dashboard data using mappers (no inline calculations)
  const projectClients = useMemo(() => {
    if (!dashboardData) return [];
    return mapToClientSummaries(dashboardData.clients, dashboardData.financialSummaries);
  }, [dashboardData]);

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

  // Delete mutations using feature hooks
  const deleteClientMutation = useDeleteProjectClient();
  const deleteCommitmentMutation = useDeleteClientCommitment();

  const handleDelete = async (client: ProjectClientSummary) => {
    if (!activeProjectId || !organizationId) {
      toast({
        title: 'No disponible',
        description: 'Para eliminar un cliente, selecciona un proyecto específico',
        variant: 'destructive',
      });
      return;
    }

    const clientName = client.contacts 
      ? `${client.contacts.first_name} ${client.contacts.last_name}`.trim()
      : 'Cliente';
    
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Cliente',
      description: 'Se eliminará este cliente del proyecto. Esta acción no se puede deshacer.',
      itemName: clientName,
      itemType: 'cliente',
      onConfirm: async () => {
        try {
          await deleteClientMutation.mutateAsync({
            clientId: client.id,
            organizationId,
            projectId: activeProjectId!,
          });
          toast({
            title: 'Cliente eliminado',
            description: 'El cliente ha sido eliminado del proyecto correctamente',
          });
        } catch (error: any) {
          toast({
            title: 'Error al eliminar cliente',
            description: error.message,
            variant: 'destructive',
          });
        }
      },
    });
  };

  const handleEdit = (client: ProjectClientSummary) => {
    openModal('project-client', {
      projectId: activeProjectId,
      clientId: client.id,
    });
  };

  const handleEditContact = (client: ProjectClientSummary) => {
    if (!client.contacts) {
      toast({
        title: 'Error',
        description: 'Este cliente no tiene un contacto asociado',
        variant: 'destructive',
      });
      return;
    }

    openModal('contact', {
      isEditing: true,
      editingContact: {
        id: client.contacts.id,
        organization_id: organizationId,
        first_name: client.contacts.first_name,
        last_name: client.contacts.last_name,
        email: client.contacts.email,
        phone: client.contacts.phone,
        created_at: new Date().toISOString(),
      },
    });
  };

  const handleDeleteCommitment = async (commitmentId: string, clientName: string) => {
    if (!activeProjectId || !organizationId) {
      toast({
        title: 'No disponible',
        description: 'Para eliminar un compromiso, selecciona un proyecto específico',
        variant: 'destructive',
      });
      return;
    }

    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Compromiso',
      description: 'Se eliminará este compromiso de pago. Esta acción no se puede deshacer.',
      itemName: clientName,
      itemType: 'compromiso de pago',
      onConfirm: async () => {
        try {
          await deleteCommitmentMutation.mutateAsync({
            commitmentId,
            organizationId,
            projectId: activeProjectId!,
          });

          toast({
            title: 'Compromiso eliminado',
            description: 'El compromiso ha sido eliminado correctamente',
          });
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo eliminar el compromiso',
            variant: 'destructive',
          });
        }
      },
    });
  };

  const handleAddClient = () => {
    openModal('project-client', {
      projectId: activeProjectId,
    });
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se pudo cargar la información de la organización</p>
      </div>
    )
  }

  // Helper function to format currency
  const formatCurrency = (amount: number, currency: CurrencyFinancial['currency']) => {
    if (!currency) return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${currency.symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format currency for KPIs (integers only, no decimals)
  const formatCurrencyKPI = (amount: number) => {
    if (!commitmentCurrency) return null;
    
    const formattedInteger = Math.round(amount).toLocaleString('es-AR');
    
    return <span>{commitmentCurrency.symbol} {formattedInteger}</span>;
  };

  // Format currency breakdown by original currency
  const formatCurrencyBreakdown = (currencyData: Array<{ symbol: string; amount: number }>) => {
    if (!currencyData || currencyData.length === 0) return '-';
    
    return currencyData.map(({ symbol, amount }) => {
      const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${symbol} ${formattedAmount}`;
    }).join(' + ');
  };

  // Helper function to calculate client-specific totals with percentages
  const renderClientFinancial = (client: ProjectClientSummary, type: 'committed' | 'paid' | 'balance') => {
    if (!commitmentCurrency) return <span>-</span>;

    let total = 0;
    let percentage = 0;

    // Build exchange rate map from commitments
    const exchangeRateMap = new Map<string, number>();
    commitmentsData?.forEach(commitment => {
      if (commitment.currency && commitment.exchange_rate) {
        exchangeRateMap.set(commitment.currency.id, commitment.exchange_rate);
      }
    });

    if (type === 'committed') {
      // Calculate committed amount from financialByCurrency (using commitment exchange rates)
      client.financialByCurrency.forEach(financial => {
        if (!financial.currency) return;
        
        if (financial.currency.id === commitmentCurrency.id) {
          total += financial.total_committed_amount;
        } else {
          const exchangeRate = exchangeRateMap.get(financial.currency.id);
          if (exchangeRate && exchangeRate > 0) {
            total += financial.total_committed_amount / exchangeRate;
          }
        }
      });
      percentage = 100; // Committed is always 100%
    } 
    else if (type === 'paid') {
      // Calculate paid amount from actual payments (using payment.exchange_rate)
      const clientPayments = (paymentsData || []).filter(p => 
        p.client?.id === client.id && p.status === 'confirmed'
      );

      clientPayments.forEach(payment => {
        if (!payment.currency) return;

        if (payment.currency.id === commitmentCurrency.id) {
          total += payment.amount;
        } else if (payment.exchange_rate && payment.exchange_rate > 0) {
          total += payment.amount / payment.exchange_rate;
        }
      });

      // Calculate committed total for percentage
      let committedTotal = 0;
      client.financialByCurrency.forEach(financial => {
        if (!financial.currency) return;
        if (financial.currency.id === commitmentCurrency.id) {
          committedTotal += financial.total_committed_amount;
        } else {
          const exchangeRate = exchangeRateMap.get(financial.currency.id);
          if (exchangeRate && exchangeRate > 0) {
            committedTotal += financial.total_committed_amount / exchangeRate;
          }
        }
      });

      percentage = committedTotal > 0 ? (total / committedTotal) * 100 : 0;
    }
    else if (type === 'balance') {
      // Calculate committed
      let committedTotal = 0;
      client.financialByCurrency.forEach(financial => {
        if (!financial.currency) return;
        if (financial.currency.id === commitmentCurrency.id) {
          committedTotal += financial.total_committed_amount;
        } else {
          const exchangeRate = exchangeRateMap.get(financial.currency.id);
          if (exchangeRate && exchangeRate > 0) {
            committedTotal += financial.total_committed_amount / exchangeRate;
          }
        }
      });

      // Calculate paid from actual payments
      let paidTotal = 0;
      const clientPayments = (paymentsData || []).filter(p => 
        p.client?.id === client.id && p.status === 'confirmed'
      );

      clientPayments.forEach(payment => {
        if (!payment.currency) return;
        if (payment.currency.id === commitmentCurrency.id) {
          paidTotal += payment.amount;
        } else if (payment.exchange_rate && payment.exchange_rate > 0) {
          paidTotal += payment.amount / payment.exchange_rate;
        }
      });

      total = committedTotal - paidTotal;
      percentage = committedTotal > 0 ? (total / committedTotal) * 100 : 0;
    }

    const formattedAmount = Math.round(total).toLocaleString('es-AR');

    return (
      <div className="flex flex-col items-end text-right">
        <span className="font-semibold text-sm">
          {commitmentCurrency.symbol} {formattedAmount}
        </span>
        <span className="text-muted-foreground text-xs font-normal">
          {percentage.toFixed(1)}%
        </span>
      </div>
    );
  };

  // Table columns
  const columns = [
    {
      key: 'clientName',
      label: 'Cliente',
      width: '220px',
      sortable: true,
      render: (client: EnrichedClient) => {
        const avatarUrl = client.contacts?.linked_user?.avatar_url;
        const initials = client.contacts?.first_name?.[0] && client.contacts?.last_name?.[0]
          ? `${client.contacts.first_name[0]}${client.contacts.last_name[0]}`
          : client.contacts?.first_name?.[0] || '?';
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
              <AvatarFallback>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold">{client.clientName}</span>
          </div>
        );
      },
    },
    {
      key: 'total_committed_amount',
      label: 'Compromiso total',
      sortable: true,
      align: 'right' as const,
      render: (client: EnrichedClient) => renderClientFinancial(client, 'committed'),
    },
    {
      key: 'total_paid_amount',
      label: 'Pagado',
      sortable: true,
      align: 'right' as const,
      render: (client: EnrichedClient) => renderClientFinancial(client, 'paid'),
    },
    {
      key: 'balance_due',
      label: 'Saldo pendiente',
      sortable: true,
      align: 'right' as const,
      render: (client: EnrichedClient) => renderClientFinancial(client, 'balance'),
    },
  ];

  // Calculate KPIs with currency conversion
  const kpis = useMemo(() => {
    if (!dashboardData || !commitmentCurrency) {
      return {
        totalCommittedAmount: 0,
        totalPaidAmount: 0,
        totalBalanceDue: 0,
        paidPercentage: 0,
        balancePercentage: 0,
        totalScheduleItems: 0,
        totalSchedulePaid: 0,
        schedulePercentage: 0,
        committedByOriginalCurrency: [] as Array<{ symbol: string; amount: number }>,
        paidByOriginalCurrency: [] as Array<{ symbol: string; amount: number }>,
        balanceByOriginalCurrency: [] as Array<{ symbol: string; amount: number }>,
      };
    }

    // Helper: Convert amount to commitment currency using exchange_rate
    const convertToCommitmentCurrency = (amount: number, currency: CurrencyFinancial['currency'], exchangeRate: number | null): number => {
      if (!currency) return 0;
      
      // If already in commitment currency, return as-is
      if (currency.id === commitmentCurrency.id) {
        return amount;
      }
      
      // If no exchange rate, cannot convert
      if (!exchangeRate || exchangeRate === 0) {
        return 0; // Skip
      }
      
      // Convert using exchange_rate (divide by cotización)
      return amount / exchangeRate;
    };

    let totalCommitted = 0;
    let totalScheduleItems = 0;
    let totalSchedulePaid = 0;

    const committedByCurrency = new Map<string, number>();
    const paidByCurrency = new Map<string, number>();

    // Process commitments to get exchange rates
    const exchangeRateMap = new Map<string, number>();
    commitmentsData?.forEach(commitment => {
      if (commitment.currency && commitment.exchange_rate) {
        exchangeRateMap.set(commitment.currency.id, commitment.exchange_rate);
      }
    });

    // Calculate COMMITTED amount from financial data (using commitment exchange_rate)
    projectClients.forEach(client => {
      client.financialByCurrency.forEach(financial => {
        if (!financial.currency) return;

        const exchangeRate = exchangeRateMap.get(financial.currency.id) || null;
        const currencySymbol = financial.currency.symbol;

        // Track committed by original currency
        committedByCurrency.set(currencySymbol, (committedByCurrency.get(currencySymbol) || 0) + financial.total_committed_amount);

        // Convert and sum committed
        totalCommitted += convertToCommitmentCurrency(financial.total_committed_amount, financial.currency, exchangeRate);
        
        totalScheduleItems += financial.total_schedule_items || 0;
        totalSchedulePaid += financial.schedule_paid || 0;
      });
    });

    // Calculate PAID amount from actual payments (using payment.exchange_rate) - SAME AS ClientPaymentsTab
    let totalPaid = 0;
    const allPayments = paymentsData || [];
    
    allPayments.forEach(payment => {
      if (!payment.currency || payment.status !== 'confirmed') return;

      const currencySymbol = payment.currency.symbol;
      
      // If payment is already in commitment currency, add as-is
      if (payment.currency.id === commitmentCurrency.id) {
        totalPaid += payment.amount;
        paidByCurrency.set(currencySymbol, (paidByCurrency.get(currencySymbol) || 0) + payment.amount);
      } else {
        // Convert using payment's exchange_rate (not commitment's!)
        if (payment.exchange_rate && payment.exchange_rate > 0) {
          totalPaid += payment.amount / payment.exchange_rate;
          paidByCurrency.set(currencySymbol, (paidByCurrency.get(currencySymbol) || 0) + payment.amount);
        }
      }
    });

    // Calculate SALDO (balance) = Committed - Paid
    const totalBalance = totalCommitted - totalPaid;

    // Balance by currency = Committed by currency - Paid by currency
    const balanceByCurrency = new Map<string, number>();
    committedByCurrency.forEach((committedAmount, symbol) => {
      const paidAmount = paidByCurrency.get(symbol) || 0;
      balanceByCurrency.set(symbol, committedAmount - paidAmount);
    });

    const paidPercentage = totalCommitted > 0 ? (totalPaid / totalCommitted) * 100 : 0;
    const balancePercentage = totalCommitted > 0 ? (totalBalance / totalCommitted) * 100 : 0;
    const schedulePercentage = totalScheduleItems > 0 ? (totalSchedulePaid / totalScheduleItems) * 100 : 0;

    return {
      totalCommittedAmount: totalCommitted,
      totalPaidAmount: totalPaid,
      totalBalanceDue: totalBalance,
      paidPercentage,
      balancePercentage,
      totalScheduleItems,
      totalSchedulePaid,
      schedulePercentage,
      committedByOriginalCurrency: Array.from(committedByCurrency.entries()).map(([symbol, amount]) => ({ symbol, amount })),
      paidByOriginalCurrency: Array.from(paidByCurrency.entries()).map(([symbol, amount]) => ({ symbol, amount })),
      balanceByOriginalCurrency: Array.from(balanceByCurrency.entries()).map(([symbol, amount]) => ({ symbol, amount })),
    };
  }, [projectClients, dashboardData, commitmentCurrency, commitmentsData, paymentsData]);

  // Enrich projectClients with computed clientName field for sorting
  const enrichedClients = useMemo<EnrichedClient[]>(() => {
    return projectClients.map(client => ({
      ...client,
      clientName: client.contacts?.company_name || 
                  client.contacts?.full_name || 
                  `${client.contacts?.first_name || ''} ${client.contacts?.last_name || ''}`.trim() || '-'
    }));
  }, [projectClients]);

  return (
    <div className="space-y-6">
      {/* KPIs Grid - 4 columnas, 2 por fila en mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Compromiso Total */}
        <StatCard data-testid="stat-card-compromiso-total">
          <StatCardTitle showArrow={false}>
            <DollarSign className="w-4 h-4 inline mr-1" />
            Compromiso Total
          </StatCardTitle>
          <StatCardValue>
            {commitmentCurrency ? formatCurrencyKPI(kpis.totalCommittedAmount) : <span>-</span>}
          </StatCardValue>
          <StatCardMeta>
            {commitmentCurrency ? formatCurrencyBreakdown(kpis.committedByOriginalCurrency) : 'Sin compromisos registrados'}
          </StatCardMeta>
        </StatCard>

        {/* 2. Pagado */}
        <StatCard data-testid="stat-card-pagado">
          <StatCardTitle showArrow={false}>
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Pagado
          </StatCardTitle>
          <StatCardValue>
            {commitmentCurrency ? formatCurrencyKPI(kpis.totalPaidAmount) : <span>-</span>}
          </StatCardValue>
          <StatCardMeta>
            {commitmentCurrency ? formatCurrencyBreakdown(kpis.paidByOriginalCurrency) : 'Sin compromisos registrados'}
          </StatCardMeta>
        </StatCard>

        {/* 3. Saldo */}
        <StatCard data-testid="stat-card-saldo">
          <StatCardTitle showArrow={false}>
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Saldo
          </StatCardTitle>
          <StatCardValue>
            {commitmentCurrency ? formatCurrencyKPI(kpis.totalBalanceDue) : <span>-</span>}
          </StatCardValue>
          <StatCardMeta>
            {commitmentCurrency ? formatCurrencyBreakdown(kpis.balanceByOriginalCurrency) : 'Sin compromisos registrados'}
          </StatCardMeta>
        </StatCard>

        {/* 4. Items de Pago */}
        <StatCard data-testid="stat-card-items-pago">
          <StatCardTitle showArrow={false}>
            <ListChecks className="w-4 h-4 inline mr-1" />
            Items de Pago
          </StatCardTitle>
          <StatCardValue>
            {kpis.totalSchedulePaid}/{kpis.totalScheduleItems}
          </StatCardValue>
          <StatCardMeta>{kpis.schedulePercentage.toFixed(1)}% completado</StatCardMeta>
        </StatCard>
      </div>

      <Table
        columns={columns}
        data={enrichedClients}
        isLoading={isLoading}
        defaultSort={{ key: 'clientName', direction: 'asc' }}
        showDoubleHeader={false}
        emptyStateConfig={{
          icon: <Users className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay clientes en este proyecto',
          description: (
            <>
              Agrega clientes para gestionar la información del proyecto. Recuerda que un cliente, antes debe ser un{' '}
              <button
                onClick={() => {
                  setSidebarLevel('organization');
                  navigate('/contacts');
                }}
                className="hover:underline font-bold cursor-pointer"
                style={{ color: 'var(--accent)' }}
              >
                contacto
              </button>
              .
            </>
          ),
          action: (
            <Button
              onClick={handleAddClient}
              size="sm"
              data-testid="button-add-client-empty"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Cliente
            </Button>
          ),
        }}
        rowActions={(client: EnrichedClient) => {
          // Buscar el compromiso del cliente
          const clientCommitment = commitmentsData?.find(
            (commitment) => commitment.client_id === client.id
          );
          
          return [
            {
              label: 'Editar',
              icon: Edit,
              onClick: () => {
                if (clientCommitment) {
                  // Si existe compromiso, abrir modal en modo edición
                  openModal('client-commitment', {
                    projectId: activeProjectId,
                    organizationId,
                    commitmentId: clientCommitment.id,
                    mode: 'edit',
                  });
                } else {
                  // Si no existe compromiso, crear uno nuevo
                  openModal('client-commitment', {
                    projectId: activeProjectId,
                    organizationId,
                    mode: 'create',
                  });
                }
              },
            },
            {
              label: 'Eliminar',
              icon: Trash2,
              onClick: () => {
                if (clientCommitment) {
                  // Eliminar el compromiso, no el cliente
                  handleDeleteCommitment(clientCommitment.id, client.clientName);
                } else {
                  // Si no hay compromiso, no hay nada que eliminar
                  toast({
                    title: 'No hay compromiso',
                    description: 'Este cliente no tiene un compromiso de pago asignado',
                    variant: 'destructive',
                  });
                }
              },
              variant: 'destructive',
            },
          ];
        }}
      />
    </div>
  )
}
