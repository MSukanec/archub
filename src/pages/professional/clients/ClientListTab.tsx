import React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'
import { Users, Plus, Edit, Trash2, User, Eye } from 'lucide-react'
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
  contact_id: string;
  unit: string | null;
  notes: string | null;
  is_primary: boolean;
  status: string;
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

export default function ClientListTab({ projectId }: ClientListTabProps) {
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

  const handleView = (client: ProjectClientSummary) => {
    openModal('project-client', {
      projectId: activeProjectId,
      clientId: client.id,
      mode: 'view',
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

  // Show message only if there's no organization (shouldn't happen)
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
      key: 'full_name',
      label: 'Cliente',
      width: '250px',
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
      key: 'email',
      label: 'Mail',
      width: '200px',
      sortable: true,
      render: (client: ProjectClientSummary) => {
        return client.contacts?.email || '-';
      },
    },
    {
      key: 'phone',
      label: 'Teléfono',
      width: '150px',
      sortable: true,
      render: (client: ProjectClientSummary) => {
        return client.contacts?.phone || '-';
      },
    },
    {
      key: 'role',
      label: 'Rol',
      sortable: true,
      render: (client: ProjectClientSummary) => {
        return client.role?.name || '-';
      },
    },
    {
      key: 'notes',
      label: 'Notas',
      sortable: false,
      render: (client: ProjectClientSummary) => {
        if (!client.notes) return '-';
        const truncated = client.notes.length > 50 
          ? client.notes.substring(0, 50) + '...' 
          : client.notes;
        return <span className="text-muted-foreground">{truncated}</span>;
      },
    },
    {
      key: 'is_primary',
      label: 'Primario',
      sortable: true,
      width: '100px',
      align: 'center' as const,
      render: (client: ProjectClientSummary) => {
        return client.is_primary ? (
          <span className="text-green-600 dark:text-green-400 font-medium">Sí</span>
        ) : (
          <span className="text-muted-foreground">No</span>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      width: '120px',
      render: (client: ProjectClientSummary) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          active: { label: 'Activo', color: 'text-green-600 dark:text-green-400' },
          inactive: { label: 'Inactivo', color: 'text-muted-foreground' },
          pending: { label: 'Pendiente', color: 'text-orange-600 dark:text-orange-400' },
        };
        
        const status = statusMap[client.status] || { label: client.status, color: 'text-muted-foreground' };
        return <span className={`font-medium ${status.color}`}>{status.label}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
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
        primaryRowAction={(client: ProjectClientSummary) => ({
          icon: Eye,
          onClick: () => handleView(client),
          label: 'Ver cliente',
        })}
        rowActions={(client: ProjectClientSummary) => [
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
