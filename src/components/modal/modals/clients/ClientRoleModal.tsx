import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { createClientRole, updateClientRole } from '@/features/clients/services/clientRoles';
import { CLIENT_QUERY_KEYS } from '@/features/clients/constants';
import type { ClientRole } from '@/features/clients/types';

const clientRoleSchema = z.object({
  name: z.string().min(1, 'El nombre del rol es requerido').max(100),
});

type ClientRoleFormData = z.infer<typeof clientRoleSchema>;

interface ClientRoleModalProps {
  modalData?: {
    clientRole?: ClientRole;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ClientRoleModal({ modalData, onClose }: ClientRoleModalProps) {
  const { clientRole, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();

  const form = useForm<ClientRoleFormData>({
    resolver: zodResolver(clientRoleSchema),
    defaultValues: {
      name: '',
    }
  });

  useEffect(() => {
    if (clientRole) {
      form.reset({
        name: clientRole.name || '',
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [clientRole, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: ({ role, organizationId }: {
      role: Omit<ClientRole, 'id' | 'created_at' | 'updated_at' | 'organization_id'>;
      organizationId: string;
    }) => createClientRole(role, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.roles(data.organization_id),
      });
      toast({
        title: 'Rol creado',
        description: 'El rol de cliente se creó correctamente'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating client role:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el rol de cliente',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ roleId, updates, organizationId }: {
      roleId: string;
      updates: Partial<Omit<ClientRole, 'id' | 'created_at' | 'updated_at' | 'organization_id'>>;
      organizationId: string;
    }) => updateClientRole(roleId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.roles(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.role(data.id),
      });
      toast({
        title: 'Rol actualizado',
        description: 'El rol de cliente se actualizó correctamente'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating client role:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el rol de cliente',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: ClientRoleFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener la información de la organización',
        variant: 'destructive'
      });
      return;
    }

    if (isEditing && clientRole) {
      updateMutation.mutate({
        roleId: clientRole.id,
        updates: {
          name: data.name,
        },
        organizationId: userData.organization.id,
      });
    } else {
      createMutation.mutate({
        role: {
          name: data.name,
          description: null,
          is_default: false,
        },
        organizationId: userData.organization.id,
      });
    }
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre del Rol <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Inversor, Copropietario, etc." 
                  {...field}
                  data-testid="input-client-role-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader
      title={isEditing ? 'Editar Rol de Cliente' : 'Nuevo Rol de Cliente'}
      description={
        isEditing
          ? 'Modifica el nombre del rol personalizado de cliente'
          : 'Crea un nuevo rol personalizado para asignar a los clientes del proyecto'
      }
      icon={Users}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Guardar Cambios' : 'Crear Rol'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
    />
  );

  return (
    <FormModalLayout
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
      columns={1}
    />
  );
}
