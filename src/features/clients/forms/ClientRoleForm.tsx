import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { createClientRole, updateClientRole, getClientRoleUsageCount, getClientRoles } from '@/features/clients/services/clientRoles';
import { CLIENT_QUERY_KEYS } from '@/features/clients/constants';
import { useDeleteClientRole } from '@/features/clients/hooks/use-client-roles';
import { useReplaceClientRole } from '@/features/clients/hooks/use-replace-client-role';
import { useGlobalModalStore } from '@/components/modal/state/globalModalStore';
import type { ClientRole } from '@/features/clients/types';

const clientRoleSchema = z.object({
  name: z.string().min(1, 'El nombre del rol es requerido').max(100),
});

type ClientRoleFormData = z.infer<typeof clientRoleSchema>;

// Subcomponente: Formulario para create/edit
function FormPanel({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ClientRoleFormData>>;
  onSubmit: (data: ClientRoleFormData) => void;
}) {
  return (
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
}

// Subcomponente: Vista de lectura
function ViewPanel({
  clientRole,
  onEdit,
  onDelete,
}: {
  clientRole: ClientRole;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Nombre del Rol</h4>
        <p className="text-base font-semibold" data-testid="text-role-name">
          {clientRole.name}
        </p>
      </div>

      {clientRole.description && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Descripción</h4>
          <p className="text-sm text-foreground" data-testid="text-role-description">
            {clientRole.description}
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div data-testid="text-role-created-at">
            <span className="font-medium">Creado:</span> {new Date(clientRole.created_at).toLocaleDateString('es-AR')}
          </div>
          {clientRole.updated_at && (
            <div data-testid="text-role-updated-at">
              <span className="font-medium">Actualizado:</span> {new Date(clientRole.updated_at).toLocaleDateString('es-AR')}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-border">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onEdit}
          data-testid="button-edit-role"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Editar
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onDelete}
          data-testid="button-delete-role"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Eliminar
        </Button>
      </div>
    </div>
  );
}

interface ClientRoleFormProps {
  modalData?: {
    clientRole?: ClientRole;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function ClientRoleForm({ modalData, onClose, mode = 'create' }: ClientRoleFormProps) {
  const { clientRole } = modalData || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const { pushModal, popModal } = useGlobalModalStore();
  const deleteRoleMutation = useDeleteClientRole();
  const replaceRoleMutation = useReplaceClientRole(userData?.organization?.id || null);
  const [currentMode, setCurrentMode] = useState<'create' | 'edit' | 'view'>(mode);

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

  const handleEditClick = () => {
    setCurrentMode('edit');
  };

  const handleDeleteClick = async () => {
    if (!clientRole) return;

    try {
      const count = await getClientRoleUsageCount(clientRole.id);
      const organizationId = userData?.organization?.id;

      if (!organizationId) {
        toast({
          title: 'Error',
          description: 'No se pudo obtener la información de la organización',
          variant: 'destructive',
        });
        return;
      }

      if (count === 0) {
        // No hay clientes asociados, mostrar delete directo
        pushModal('delete-confirmation', {
          title: '¿Eliminar rol de cliente?',
          description: 'Esta acción no se puede deshacer',
          itemName: clientRole.name,
          mode: 'delete' as const,
          consequences: ['El rol será eliminado permanentemente'],
          onDelete: async () => {
            await deleteRoleMutation.mutateAsync({ roleId: clientRole.id, organizationId });
            handleClose();
          },
        });
      } else {
        // Hay clientes asociados, mostrar replace
        const rolesData = await queryClient.fetchQuery({
          queryKey: CLIENT_QUERY_KEYS.roles(organizationId),
          queryFn: () => getClientRoles(organizationId),
        });

        const otherRoles = rolesData.filter((r) => r.id !== clientRole.id);

        if (otherRoles.length === 0) {
          toast({
            title: 'No se puede eliminar',
            description:
              'Este rol tiene clientes asociados pero no hay otros roles disponibles para reemplazarlo',
            variant: 'destructive',
          });
          return;
        }

        pushModal('delete-confirmation', {
          title: '¿Eliminar rol de cliente?',
          description: 'Este rol tiene clientes asociados',
          itemName: clientRole.name,
          mode: 'replace' as const,
          consequences: [
            `${count} cliente${count === 1 ? '' : 's'} será${count === 1 ? 'á' : 'n'} afectado${count === 1 ? '' : 's'}`,
            'Puedes reemplazarlos con otro rol o eliminarlos sin referencia',
          ],
          replacementOptions: otherRoles
            .sort((a, b) =>
              a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
            )
            .map((r) => ({
              label: r.name,
              value: r.id,
            })),
          onDelete: async () => {
            await deleteRoleMutation.mutateAsync({ roleId: clientRole.id, organizationId });
            handleClose();
          },
          onReplace: async (newRoleId: string) => {
            await replaceRoleMutation.mutateAsync({
              oldRoleId: clientRole.id,
              newRoleId,
            });
            handleClose();
          },
        });
      }
    } catch (error) {
      console.error('Error preparing delete:', error);
      toast({
        title: 'Error',
        description: 'No se pudo preparar la eliminación',
        variant: 'destructive',
      });
    }
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

    if (currentMode === 'edit' && clientRole) {
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
          is_deleted: false,
          deleted_at: null,
        },
        organizationId: userData.organization.id,
      });
    }
  };

  const getHeader = () => {
    switch (currentMode) {
      case 'view':
        return {
          title: 'Ver Rol de Cliente',
          description: 'Información del rol personalizado',
        };
      case 'edit':
        return {
          title: 'Editar Rol de Cliente',
          description: 'Modifica el nombre del rol personalizado de cliente',
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Rol de Cliente',
          description: 'Crea un nuevo rol personalizado para asignar a los clientes del proyecto',
        };
    }
  };

  const header = getHeader();

  return (
    <ModalLayout onClose={handleClose} size="sm">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={Users}
      />

      <ModalBody>
        {currentMode === 'view' ? (
          clientRole && (
            <ViewPanel
              clientRole={clientRole}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          )
        ) : (
          <FormPanel
            form={form}
            onSubmit={onSubmit}
          />
        )}
      </ModalBody>

      {currentMode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={handleClose}
          rightLabel={currentMode === 'edit' ? 'Guardar Cambios' : 'Crear Rol'}
          onRightClick={form.handleSubmit(onSubmit)}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
      
      {currentMode === 'view' && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={handleClose}
        />
      )}
    </ModalLayout>
  );
}

export default ClientRoleForm;
