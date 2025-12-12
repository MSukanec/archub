import React, { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast'
import { Users, Plus, Edit, Trash2, User, FileText, Calendar, Receipt, DollarSign, AlertCircle } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal'
import { Link, useLocation } from 'wouter'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard'
import { calculateMonetaryKPI, calculateCountKPI, formatBreakdown } from '@/lib/kpis'
import { format as formatMoney, formatKPI } from '@/lib/money'
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies'
import {
  useClientDashboard,
  useDeleteProjectClient,
  mapToClientSummaries,
  type ProjectClientSummary,
  type CurrencyFinancial,
} from '@/features/clients'

interface ClientListTabProps {
  projectId?: string;
  onTabChange?: (tab: string) => void;
}

export default function ClientDashboardTab({ projectId, onTabChange }: ClientListTabProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { setSidebarLevel } = useNavigationStore();
  const [, navigate] = useLocation();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  // Use feature hook to get dashboard data with financial summaries
  const { data: dashboardData, isLoading } = useClientDashboard(activeProjectId || undefined, organizationId);

  // Transform dashboard data using mappers (no inline calculations)
  const projectClients = useMemo(() => {
    if (!dashboardData) return [];
    return mapToClientSummaries(dashboardData.clients, dashboardData.financialSummaries);
  }, [dashboardData]);

  // Get default currency for auto-update
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);

  // Calculate KPIs using headless KPI system
  const kpis = useMemo(() => {
    const allPayments = dashboardData?.payments || [];
    
    // KPI 1: Total Clientes (count)
    const totalClientsKPI = calculateCountKPI({
      count: projectClients.length,
      label: 'Clientes'
    });

    // KPI 2: Total Pagos (count)
    const totalPaymentsKPI = calculateCountKPI({
      count: allPayments.length,
      label: 'Pagos'
    });

    // KPI 3: Compromiso Total (monetary)
    const committedItems = projectClients.flatMap(client => 
      client.financialByCurrency.map(financial => ({
        amount: financial.total_committed_amount,
        currency_id: financial.currency?.id || '',
        currency: financial.currency,
        exchange_rate: financial.exchange_rate || null
      }))
    );
    const totalCommittedKPI = calculateMonetaryKPI({
      items: committedItems,
      baseCurrencyId: defaultCurrency?.code || defaultCurrency?.id
    });

    // KPI 4: Balance Pendiente (monetary)
    const balanceItems = projectClients.flatMap(client => 
      client.financialByCurrency.map(financial => ({
        amount: financial.balance_due,
        currency_id: financial.currency?.id || '',
        currency: financial.currency,
        exchange_rate: financial.exchange_rate || null
      }))
    );
    const totalBalanceKPI = calculateMonetaryKPI({
      items: balanceItems,
      baseCurrencyId: defaultCurrency?.code || defaultCurrency?.id
    });

    return {
      totalClientsKPI,
      totalPaymentsKPI,
      totalCommittedKPI,
      totalBalanceKPI,
      totalClients: totalClientsKPI.value,
      totalPayments: totalPaymentsKPI.value,
      totalCommittedAmount: totalCommittedKPI.value,
      totalBalanceDue: totalBalanceKPI.value
    };
  }, [projectClients, dashboardData?.payments, defaultCurrency]);

  // Delete mutation using feature hook
  const deleteClientMutation = useDeleteProjectClient();

  const handleDelete = async (client: ProjectClientSummary) => {
    // Prevent deletion when viewing organization-wide data
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

  if (!activeProjectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay proyecto activo seleccionado</p>
      </div>
    )
  }

  // Helper function to format currency
  const formatCurrency = (amount: number, currency: CurrencyFinancial['currency']) => {
    if (!currency) return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${currency.symbol}${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to render multi-currency amounts
  const renderMultiCurrency = (client: ProjectClientSummary, field: keyof Pick<CurrencyFinancial, 'total_committed_amount' | 'total_paid_amount' | 'balance_due'>) => {
    if (client.financialByCurrency.length === 0) return '-';
    
    // Show primary currency data
    const currencyData = client.financialByCurrency[0];
    if (!currencyData) return '-';
    
    const amount = currencyData[field];
    const hasConversionWarning = field === 'total_paid_amount' && (currencyData.payments_missing_rate || 0) > 0;
    
    return (
      <div className="flex flex-col">
        <span className="font-semibold" style={{ fontSize: '14px' }}>
          {formatCurrency(amount, currencyData.currency)}
        </span>
        {hasConversionWarning && (
          <span className="text-xs text-orange-500">
            {currencyData.payments_missing_rate} pago(s) sin tasa de cambio
          </span>
        )}
      </div>
    );
  };

  // Table columns
  const columns = [
    {
      key: 'full_name',
      label: 'Cliente',
      sortable: true,
      render: (client: ProjectClientSummary) => {
        const avatarUrl = client.contacts?.linked_user?.avatar_url;
        const initials = client.contacts?.first_name?.[0] && client.contacts?.last_name?.[0]
          ? `${client.contacts.first_name[0]}${client.contacts.last_name[0]}`
          : client.contacts?.first_name?.[0] || '?';
        
        const displayName = client.contacts?.company_name || 
                           client.contacts?.full_name || 
                           `${client.contacts?.first_name || ''} ${client.contacts?.last_name || ''}`.trim();
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
              <AvatarFallback>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold">{displayName || '-'}</span>
          </div>
        );
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
      render: (client: ProjectClientSummary) => {
        if (client.financialByCurrency.length === 0) return '-';
        
        // Show primary currency balance
        const currencyData = client.financialByCurrency[0];
        if (!currencyData) return '-';
        
        const balance = currencyData.balance_due;
        const className = balance > 0 
          ? 'text-orange-600 dark:text-orange-400 font-semibold' 
          : balance < 0
          ? 'text-green-600 dark:text-green-400 font-semibold'
          : 'font-semibold';
        
        return (
          <span className={className} style={{ fontSize: '14px' }}>
            {formatCurrency(balance, currencyData.currency)}
          </span>
        );
      },
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

  return (
    <div className="space-y-6">
      {/* KPIs Grid - 4 columnas, 2 por fila en mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Clientes */}
        <StatCard 
          onClick={() => onTabChange?.('list')}
          data-testid="stat-card-clientes"
        >
          <StatCardTitle>
            <Users className="w-4 h-4 inline mr-1" />
            Clientes
          </StatCardTitle>
          <StatCardValue>
            {kpis.totalClients}
          </StatCardValue>
          <StatCardMeta>Total {activeProjectId ? 'en el proyecto' : 'en la organización'}</StatCardMeta>
        </StatCard>

        {/* 2. Pagos */}
        <StatCard 
          onClick={() => onTabChange?.('details')}
          data-testid="stat-card-pagos"
        >
          <StatCardTitle>
            <Receipt className="w-4 h-4 inline mr-1" />
            Pagos
          </StatCardTitle>
          <StatCardValue>
            {kpis.totalPayments}
          </StatCardValue>
          <StatCardMeta>Registros de pago</StatCardMeta>
        </StatCard>

        {/* 3. Compromiso Total */}
        <StatCard 
          onClick={() => onTabChange?.('obligations')}
          data-testid="stat-card-compromiso-total"
        >
          <StatCardTitle>
            <DollarSign className="w-4 h-4 inline mr-1" />
            Compromiso Total
          </StatCardTitle>
          <StatCardValue className="text-2xl md:text-3xl">
            {kpis.totalCommittedKPI?.breakdown && kpis.totalCommittedKPI.breakdown.length > 0
              ? formatMoney(kpis.totalCommittedAmount, kpis.totalCommittedKPI.breakdown[0].currencySymbol)
              : formatKPI(kpis.totalCommittedAmount)
            }
          </StatCardValue>
          <StatCardMeta>
            {kpis.totalCommittedKPI?.breakdown && kpis.totalCommittedKPI.breakdown.length > 0
              ? formatBreakdown(kpis.totalCommittedKPI)
              : 'Monto comprometido'
            }
          </StatCardMeta>
        </StatCard>

        {/* 4. Balance Pendiente */}
        <StatCard 
          onClick={() => onTabChange?.('obligations')}
          data-testid="stat-card-balance-pendiente"
        >
          <StatCardTitle>
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Balance Pendiente
          </StatCardTitle>
          <StatCardValue className={`text-2xl md:text-3xl ${kpis.totalBalanceDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
            {kpis.totalBalanceKPI?.breakdown && kpis.totalBalanceKPI.breakdown.length > 0
              ? formatMoney(kpis.totalBalanceDue, kpis.totalBalanceKPI.breakdown[0].currencySymbol)
              : formatKPI(kpis.totalBalanceDue)
            }
          </StatCardValue>
          <StatCardMeta>
            {kpis.totalBalanceKPI?.breakdown && kpis.totalBalanceKPI.breakdown.length > 0
              ? formatBreakdown(kpis.totalBalanceKPI)
              : 'Saldo por cobrar'
            }
          </StatCardMeta>
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
        }}
      />
    </div>
  )
}
