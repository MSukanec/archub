import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface ProjectClientModalProps {
  projectId?: string;
  onClose: () => void;
}

export function ProjectClientModal({ projectId, onClose }: ProjectClientModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);

  const organizationId = userData?.organization?.id;

  // Query to get available contacts
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: [`/api/contacts?organization_id=${organizationId}`],
    enabled: !!organizationId,
  });

  const addClientMutation = useMutation({
    mutationFn: async (contactId: string) => {
      if (!organizationId || !projectId) throw new Error('Missing organization or project ID');

      return await apiRequest('POST', `/api/projects/${projectId}/clients`, {
        client_id: contactId,
        organization_id: organizationId,
        unit: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/clients?organization_id=${organizationId}`] });
      toast({
        title: 'Cliente agregado',
        description: 'El cliente ha sido agregado al proyecto correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al agregar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    closeModal();
    onClose();
  };

  const handleContactClick = async (contact: any) => {
    setIsLoading(true);
    try {
      await addClientMutation.mutateAsync(contact.id);
    } catch (error) {
      // Error handling is done in mutation onError
    } finally {
      setIsLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: 'avatar',
      label: '',
      width: '60px',
      sortable: false,
      render: (contact: any) => (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {contact.first_name?.[0]}{contact.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: 'first_name',
      label: 'Nombre',
      sortable: true,
    },
    {
      key: 'last_name',
      label: 'Apellido',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
  ];

  const editPanel = (
    <div className="space-y-4">
      <Table
        columns={columns}
        data={contacts}
        isLoading={isLoadingContacts || isLoading}
        onRowClick={handleContactClick}
        emptyStateConfig={{
          icon: <Users className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay contactos disponibles',
          description: 'Crea contactos en tu organización para agregarlos como clientes',
        }}
        className="cursor-pointer"
      />
    </div>
  );

  const headerContent = (
    <FormModalHeader
      title="Seleccionar Cliente"
      description="Selecciona un contacto para agregarlo como cliente del proyecto"
      icon={Users}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      showLoadingSpinner={isLoading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}
