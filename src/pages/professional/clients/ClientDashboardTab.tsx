import React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'
import { Users, Plus, Edit, Trash2, User, FileText, Calendar, Receipt, DollarSign, AlertCircle } from 'lucide-react'
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
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/stat-card'

interface ClientListTabProps {
  projectId?: string;
}

interface CurrencyFinancial {
  currency: {
    id: string;
    code: string;
    symbol: string;
  } | null;
  total_committed_amount: number;
  total_paid_amount: number;
  balance_due: number;
  next_due_date: string | null;
  next_due_amount: number | null;
  last_payment_date: string | null;
  total_schedule_items: number;
  schedule_paid: number;
  schedule_overdue: number;
  payments_missing_rate?: number; // Warning flag for PRO/TEAMS conversion issues
}

interface ProjectClientSummary {
  id: string;
  client_id: string;
  unit: string | null;
  contacts: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone?: string;
    company_name?: string;
    linked_user?: {
      id: string;
      avatar_url?: string;
    } | null;
  } | null;
  role: {
    id: string;
    name: string;
    is_default: boolean;
  } | null;
  financialByCurrency: CurrencyFinancial[];
  // Derived fields for sorting (sum across all currencies)
  total_committed_amount: number;
  total_paid_amount: number;
  balance_due: number;
  next_due: number | null;
}

interface ClientSummaryResponse {
  plan: {
    slug: string;
    isMultiCurrency: boolean;
  };
  clients: ProjectClientSummary[];
}

export default function ClientDashboardTab({ projectId }: ClientListTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { setSidebarLevel } = useNavigationStore();
  const [, navigate] = useLocation();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  // Query to get project clients summary with financial data (plan-aware)
  // If activeProjectId is null, fetch ALL clients from the organization
  const { data: summaryResponse, isLoading } = useQuery<ClientSummaryResponse>({
    queryKey: activeProjectId
      ? [`/api/projects/${activeProjectId}/clients/summary?organization_id=${organizationId}`]
      : [`/api/organizations/${organizationId}/clients/summary`],
    enabled: !!organizationId,
    staleTime: 3 * 60 * 1000, // 3 minutes - data is prefetched and cached
  });

  const projectClients = summaryResponse?.clients || [];
  const planInfo = summaryResponse?.plan || { slug: 'FREE', isMultiCurrency: false };

  // Fetch client payments for the KPI
  const { data: clientPaymentsResponse } = useQuery<{ payments: any[] }>({
    queryKey: activeProjectId
      ? [`/api/projects/${activeProjectId}/client-payments?organization_id=${organizationId}`]
      : [`/api/organizations/${organizationId}/client-payments`],
    enabled: !!organizationId,
    staleTime: 3 * 60 * 1000,
  });

  const clientPayments = clientPaymentsResponse?.payments || [];

  // Calculate KPIs
  const totalClients = projectClients.length;
  const totalPayments = clientPayments.length;
  const totalCommittedAmount = projectClients.reduce((sum: number, client: any) => 
    sum + (parseFloat(client.total_committed_amount) || 0), 0
  );
  const totalBalanceDue = projectClients.reduce((sum: number, client: any) => 
    sum + (parseFloat(client.balance_due) || 0), 0
  );

  // Format currency
  const formatCurrencyKPI = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Delete mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!activeProjectId || !organizationId) return;

      await apiRequest('DELETE', `/api/projects/${activeProjectId}/clients/${clientId}?organization_id=${organizationId}`);
    },
    onSuccess: () => {
      // Invalidate both project and organization queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.includes('/clients/summary') || key?.includes('/clients');
        }
      });
      toast({
        title: 'Cliente eliminado',
        description: 'El cliente ha sido eliminado del proyecto correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error al eliminar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (client: ProjectClientSummary) => {
    // Prevent deletion when viewing organization-wide data
    if (!activeProjectId) {
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
      onConfirm: () => {
        deleteClientMutation.mutate(client.id);
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
  // Helper function to render amounts - plan-aware
  const renderMultiCurrency = (client: ProjectClientSummary, field: keyof Pick<CurrencyFinancial, 'total_committed_amount' | 'total_paid_amount' | 'balance_due'>) => {
    if (client.financialByCurrency.length === 0) return '-';
    
    // For PRO/TEAMS: Show single currency (commitment currency) with converted amount
    if (planInfo.isMultiCurrency) {
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
    }
    
    // For FREE: Show multiple currencies if present
    return (
      <div className="flex flex-wrap gap-1">
        {client.financialByCurrency.map((f, index) => (
          <span key={index} className="whitespace-nowrap">
            {formatCurrency(f[field], f.currency)}
            {index < client.financialByCurrency.length - 1 && <span className="mx-1">+</span>}
          </span>
        ))}
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
      render: (client: ProjectClientSummary) => {
        if (client.financialByCurrency.length === 0) return '-';
        
        // For PRO/TEAMS: Show single currency (commitment currency) with converted balance
        if (planInfo.isMultiCurrency) {
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
        }
        
        // For FREE: Show multiple currencies if present
        return (
          <div className="flex flex-wrap gap-1">
            {client.financialByCurrency.map((f, index) => {
              const className = f.balance_due > 0 
                ? 'text-orange-600 dark:text-orange-400 font-medium' 
                : f.balance_due < 0
                ? 'text-green-600 dark:text-green-400 font-medium'
                : '';
              return (
                <span key={index} className={className + ' whitespace-nowrap'}>
                  {formatCurrency(f.balance_due, f.currency)}
                  {index < client.financialByCurrency.length - 1 && <span className="mx-1 text-muted-foreground">+</span>}
                </span>
              );
            })}
          </div>
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
        <StatCard data-testid="stat-card-clientes">
          <StatCardTitle showArrow={false}>
            <Users className="w-4 h-4 inline mr-1" />
            Clientes
          </StatCardTitle>
          <StatCardValue>
            {totalClients}
          </StatCardValue>
          <StatCardMeta>Total {activeProjectId ? 'en el proyecto' : 'en la organización'}</StatCardMeta>
        </StatCard>

        {/* 2. Pagos */}
        <StatCard data-testid="stat-card-pagos">
          <StatCardTitle showArrow={false}>
            <Receipt className="w-4 h-4 inline mr-1" />
            Pagos
          </StatCardTitle>
          <StatCardValue>
            {totalPayments}
          </StatCardValue>
          <StatCardMeta>Registros de pago</StatCardMeta>
        </StatCard>

        {/* 3. Compromiso Total */}
        <StatCard data-testid="stat-card-compromiso-total">
          <StatCardTitle showArrow={false}>
            <DollarSign className="w-4 h-4 inline mr-1" />
            Compromiso Total
          </StatCardTitle>
          <StatCardValue className="text-2xl md:text-3xl">
            {formatCurrencyKPI(totalCommittedAmount)}
          </StatCardValue>
          <StatCardMeta>Monto comprometido</StatCardMeta>
        </StatCard>

        {/* 4. Balance Pendiente */}
        <StatCard data-testid="stat-card-balance-pendiente">
          <StatCardTitle showArrow={false}>
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Balance Pendiente
          </StatCardTitle>
          <StatCardValue className={`text-2xl md:text-3xl ${totalBalanceDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
            {formatCurrencyKPI(totalBalanceDue)}
          </StatCardValue>
          <StatCardMeta>Saldo por cobrar</StatCardMeta>
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
