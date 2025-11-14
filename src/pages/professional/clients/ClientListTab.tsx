import React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'
import { Users, Plus, Edit, Trash2, User, FileText, Calendar } from 'lucide-react'
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

  // Query to get project clients summary with financial data
  const { data: projectClients = [], isLoading } = useQuery<ProjectClientSummary[]>({
    queryKey: [`/api/projects/${activeProjectId}/clients/summary?organization_id=${organizationId}`],
    enabled: !!activeProjectId && !!organizationId
  });

  // Delete mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!activeProjectId || !organizationId) return;

      await apiRequest('DELETE', `/api/projects/${activeProjectId}/clients/${clientId}?organization_id=${organizationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${activeProjectId}/clients/summary?organization_id=${organizationId}`] });
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
  const renderMultiCurrency = (client: ProjectClientSummary, field: keyof Pick<CurrencyFinancial, 'total_committed_amount' | 'total_paid_amount' | 'balance_due'>) => {
    if (client.financialByCurrency.length === 0) return '-';
    
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
