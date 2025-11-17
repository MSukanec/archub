import React, { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast'
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
import {
  useClientDashboard,
  useDeleteProjectClient,
  type ProjectClientWithRelations,
  type ClientFinancialSummary,
} from '@/features/clients'

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
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
    phone?: string | null;
    company_name?: string | null;
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
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { setSidebarLevel } = useNavigationStore();
  const [, navigate] = useLocation();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  // Use feature hook to get dashboard data with financial summaries
  const { data: dashboardData, isLoading } = useClientDashboard(activeProjectId || undefined, organizationId);

  // Transform dashboard data to match the current component's expected structure
  const projectClients = useMemo(() => {
    if (!dashboardData) return [];

    return dashboardData.clients.map((client: ProjectClientWithRelations) => {
      const financialSummaries = dashboardData.financialSummaries.get(client.id) || [];
      
      const financialByCurrency = financialSummaries.map((summary: ClientFinancialSummary) => ({
        currency: summary.currency_id ? {
          id: summary.currency_id,
          code: 'ARS',
          symbol: '$',
        } : null,
        total_committed_amount: summary.total_committed,
        total_paid_amount: summary.total_paid,
        balance_due: summary.balance_due,
        next_due_date: summary.next_due_date,
        next_due_amount: summary.next_due_amount,
        last_payment_date: summary.last_payment_date,
        total_schedule_items: summary.total_schedule_items,
        schedule_paid: summary.schedule_paid,
        schedule_overdue: summary.schedule_overdue,
      }));

      const total_committed_amount = financialSummaries.reduce((sum, s) => sum + s.total_committed, 0);
      const total_paid_amount = financialSummaries.reduce((sum, s) => sum + s.total_paid, 0);
      const balance_due = financialSummaries.reduce((sum, s) => sum + s.balance_due, 0);
      const next_due = financialSummaries.reduce((min, s) => {
        if (!s.next_due_amount) return min;
        return min === null ? s.next_due_amount : Math.min(min, s.next_due_amount);
      }, null as number | null);

      return {
        id: client.id,
        contact_id: client.contact_id,
        unit: client.unit,
        notes: client.notes,
        is_primary: client.is_primary,
        status: client.status,
        contacts: client.contact ? {
          id: client.contact.id,
          first_name: client.contact.first_name,
          last_name: client.contact.last_name,
          full_name: client.contact.full_name,
          email: client.contact.email,
          phone: client.contact.phone,
          company_name: client.contact.company_name,
          linked_user: client.contact.linked_user_id ? {
            id: client.contact.linked_user_id,
            avatar_url: undefined,
          } : null,
        } : null,
        role: client.role,
        financialByCurrency,
        total_committed_amount,
        total_paid_amount,
        balance_due,
        next_due,
      };
    });
  }, [dashboardData]);

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
  const renderMultiCurrency = (client: ProjectClientSummary, field: keyof Pick<CurrencyFinancial, 'total_committed_amount' | 'total_paid_amount' | 'balance_due'>) => {
    if (client.financialByCurrency.length === 0) return '-';
    
    // Always show first currency
    const currencyData = client.financialByCurrency[0];
    if (!currencyData) return '-';
    
    const amount = currencyData[field];
    
    return (
      <div className="flex flex-col">
        <span className="font-semibold" style={{ fontSize: '14px' }}>
          {formatCurrency(amount, currencyData.currency)}
        </span>
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
