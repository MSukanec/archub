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
  useDeleteProjectClient,
  mapToClientSummaries,
  type ProjectClientSummary,
  type CurrencyFinancial,
} from '@/features/clients'

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

  // Use feature hooks to get dashboard data and commitments
  const { data: dashboardData, isLoading } = useClientDashboard(activeProjectId || undefined, organizationId);
  const { data: commitmentsData } = useClientCommitments(activeProjectId || undefined, organizationId);

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

  // Delete mutation using feature hook
  const deleteClientMutation = useDeleteProjectClient();

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

  // Format currency for KPIs
  const formatCurrencyKPI = (amount: number) => {
    if (!commitmentCurrency) return '-';
    const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${commitmentCurrency.symbol} ${formattedAmount}`;
  };

  // Format currency breakdown by original currency
  const formatCurrencyBreakdown = (currencyData: Array<{ symbol: string; amount: number }>) => {
    if (!currencyData || currencyData.length === 0) return '-';
    
    return currencyData.map(({ symbol, amount }) => {
      const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${symbol} ${formattedAmount}`;
    }).join(' + ');
  };

  // Helper function to render multi-currency amounts with conversion
  const renderMultiCurrency = (client: ProjectClientSummary, field: keyof Pick<CurrencyFinancial, 'total_committed_amount' | 'total_paid_amount' | 'balance_due'>) => {
    if (client.financialByCurrency.length === 0 || !commitmentCurrency) return '-';
    
    // Build map of exchange rates from commitments
    const exchangeRateMap = new Map<string, number>();
    commitmentsData?.forEach(commitment => {
      if (commitment.currency && commitment.exchange_rate) {
        exchangeRateMap.set(commitment.currency.id, commitment.exchange_rate);
      }
    });

    // Convert all currency amounts to commitment currency
    let totalInCommitmentCurrency = 0;

    client.financialByCurrency.forEach(financial => {
      if (!financial.currency) return;
      
      const amount = financial[field];
      
      // If already in commitment currency, add as-is
      if (financial.currency.id === commitmentCurrency.id) {
        totalInCommitmentCurrency += amount;
      } else {
        // Convert using exchange_rate
        const exchangeRate = exchangeRateMap.get(financial.currency.id);
        if (exchangeRate && exchangeRate > 0) {
          totalInCommitmentCurrency += amount / exchangeRate;
        }
      }
    });
    
    return (
      <div className="flex flex-col">
        <span className="font-semibold" style={{ fontSize: '14px' }}>
          {formatCurrency(totalInCommitmentCurrency, commitmentCurrency)}
        </span>
      </div>
    );
  };

  // Table columns
  const columns = [
    {
      key: 'avatar',
      label: '',
      width: '60px',
      sortable: false,
      render: (client: ProjectClientSummary) => {
        const avatarUrl = client.contacts?.linked_user?.avatar_url;
        const initials = client.contacts?.first_name?.[0] && client.contacts?.last_name?.[0]
          ? `${client.contacts.first_name[0]}${client.contacts.last_name[0]}`
          : client.contacts?.first_name?.[0] || '?';
        
        return (
          <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
            <AvatarFallback>
              {initials}
            </AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      key: 'full_name',
      label: 'Cliente',
      sortable: true,
      cellClassName: 'font-semibold',
      render: (client: ProjectClientSummary) => {
        const displayName = client.contacts?.company_name || 
                           client.contacts?.full_name || 
                           `${client.contacts?.first_name || ''} ${client.contacts?.last_name || ''}`.trim();
        return displayName || '-';
      },
    },
    {
      key: 'total_committed_amount',
      label: 'Compromiso total',
      sortable: true,
      render: (client: ProjectClientSummary) => renderMultiCurrency(client, 'total_committed_amount'),
    },
    {
      key: 'total_paid_amount',
      label: 'Pagado',
      sortable: true,
      render: (client: ProjectClientSummary) => renderMultiCurrency(client, 'total_paid_amount'),
    },
    {
      key: 'balance_due',
      label: 'Saldo pendiente',
      sortable: true,
      render: (client: ProjectClientSummary) => renderMultiCurrency(client, 'balance_due'),
    },
    {
      key: 'next_due',
      label: 'Próximo vencimiento',
      sortable: true,
      render: (client: ProjectClientSummary) => {
        // Find the earliest next due date across all currencies
        const nextDues = client.financialByCurrency
          .filter(f => f.next_due_date)
          .sort((a, b) => new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime());
        
        if (nextDues.length === 0) {
          return <span className="text-muted-foreground">Sin vencimientos</span>;
        }
        
        const earliest = nextDues[0];
        const formattedDate = format(new Date(earliest.next_due_date!), 'dd/MM/yyyy', { locale: es });
        const formattedAmount = earliest.next_due_amount ? formatCurrency(earliest.next_due_amount, earliest.currency) : '';
        
        return (
          <div className="flex flex-col">
            <span className="font-medium">{formattedDate}</span>
            {formattedAmount && <span className="text-muted-foreground">{formattedAmount}</span>}
          </div>
        );
      },
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
    let totalPaid = 0;
    let totalBalance = 0;
    let totalScheduleItems = 0;
    let totalSchedulePaid = 0;

    const committedByCurrency = new Map<string, number>();
    const paidByCurrency = new Map<string, number>();
    const balanceByCurrency = new Map<string, number>();

    // Process commitments to get exchange rates
    const exchangeRateMap = new Map<string, number>();
    commitmentsData?.forEach(commitment => {
      if (commitment.currency && commitment.exchange_rate) {
        exchangeRateMap.set(commitment.currency.id, commitment.exchange_rate);
      }
    });

    // Sum up all financial data with conversion
    projectClients.forEach(client => {
      client.financialByCurrency.forEach(financial => {
        if (!financial.currency) return;

        const exchangeRate = exchangeRateMap.get(financial.currency.id) || null;
        const currencySymbol = financial.currency.symbol;

        // Track by original currency
        committedByCurrency.set(currencySymbol, (committedByCurrency.get(currencySymbol) || 0) + financial.total_committed_amount);
        paidByCurrency.set(currencySymbol, (paidByCurrency.get(currencySymbol) || 0) + financial.total_paid_amount);
        balanceByCurrency.set(currencySymbol, (balanceByCurrency.get(currencySymbol) || 0) + financial.balance_due);

        // Convert and sum
        totalCommitted += convertToCommitmentCurrency(financial.total_committed_amount, financial.currency, exchangeRate);
        totalPaid += convertToCommitmentCurrency(financial.total_paid_amount, financial.currency, exchangeRate);
        totalBalance += convertToCommitmentCurrency(financial.balance_due, financial.currency, exchangeRate);
        
        totalScheduleItems += financial.total_schedule_items || 0;
        totalSchedulePaid += financial.schedule_paid || 0;
      });
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
  }, [projectClients, dashboardData, commitmentCurrency, commitmentsData]);

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
          <StatCardValue className="text-2xl md:text-3xl">
            {commitmentCurrency ? formatCurrencyKPI(kpis.totalCommittedAmount) : '-'}
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
          <StatCardValue className="text-2xl md:text-3xl">
            {commitmentCurrency ? formatCurrencyKPI(kpis.totalPaidAmount) : '-'}
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
          <StatCardValue className="text-2xl md:text-3xl">
            {commitmentCurrency ? formatCurrencyKPI(kpis.totalBalanceDue) : '-'}
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
          <StatCardValue className="text-2xl md:text-3xl">
            {kpis.totalSchedulePaid}/{kpis.totalScheduleItems}
          </StatCardValue>
          <StatCardMeta>{kpis.schedulePercentage.toFixed(1)}% completado</StatCardMeta>
        </StatCard>
      </div>

      <Table
        columns={columns}
        data={projectClients}
        isLoading={isLoading}
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
        rowActions={(client: ProjectClientSummary) => [
          {
            label: 'Ver / editar compromiso',
            icon: FileText,
            onClick: () => {
              toast({
                title: 'Función en desarrollo',
                description: 'La gestión de compromisos estará disponible próximamente',
              });
            },
          },
          {
            label: 'Ver plan de pagos',
            icon: Calendar,
            onClick: () => {
              toast({
                title: 'Función en desarrollo',
                description: 'El plan de pagos estará disponible próximamente',
              });
            },
          },
          {
            label: 'Editar Cliente',
            icon: Edit,
            onClick: () => handleEdit(client),
          },
          {
            label: 'Editar Contacto',
            icon: User,
            onClick: () => handleEditContact(client),
          },
          {
            label: 'Eliminar',
            icon: Trash2,
            onClick: () => handleDelete(client),
            variant: 'destructive',
          },
        ]}
      />
    </div>
  )
}
