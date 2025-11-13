import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'
import { Users, Plus, Edit, Trash2, User } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Link, useLocation } from 'wouter'

interface ClientListTabProps {
  projectId?: string;
}

interface ProjectClient {
  id: string;
  client_id: string;
  unit: string | null;
  contacts: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  } | null;
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

  // Query to get project clients
  const { data: projectClients = [], isLoading } = useQuery<ProjectClient[]>({
    queryKey: [`/api/projects/${activeProjectId}/clients?organization_id=${organizationId}`],
    enabled: !!activeProjectId && !!organizationId
  });

  // Delete mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!activeProjectId || !organizationId) return;

      await apiRequest('DELETE', `/api/projects/${activeProjectId}/clients/${clientId}?organization_id=${organizationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${activeProjectId}/clients?organization_id=${organizationId}`] });
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

  const handleDelete = (client: ProjectClient) => {
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

  const handleEdit = (client: ProjectClient) => {
    openModal('project-client', {
      projectId: activeProjectId,
      clientId: client.id,
    });
  };

  const handleEditContact = (client: ProjectClient) => {
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

  // Table columns
  const columns = [
    {
      key: 'avatar',
      label: '',
      width: '60px',
      sortable: false,
      render: (client: ProjectClient) => (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {client.contacts?.first_name?.[0]}{client.contacts?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: 'first_name',
      label: 'Nombre',
      sortable: true,
      render: (client: ProjectClient) => client.contacts?.first_name || '-',
    },
    {
      key: 'last_name',
      label: 'Apellido',
      sortable: true,
      render: (client: ProjectClient) => client.contacts?.last_name || '-',
    },
    {
      key: 'unit',
      label: 'Unidad Funcional',
      sortable: true,
      render: (client: ProjectClient) => client.unit || '-',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (client: ProjectClient) => client.contacts?.email || '-',
    },
    {
      key: 'phone',
      label: 'Teléfono',
      sortable: true,
      render: (client: ProjectClient) => client.contacts?.phone || '-',
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
        rowActions={(client: ProjectClient) => [
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
