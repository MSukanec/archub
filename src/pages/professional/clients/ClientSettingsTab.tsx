import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Settings, Plus, Edit, Trash2, Shield, MoreVertical } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface ClientRole {
  id: string;
  name: string;
  is_default: boolean;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

const roleSchema = z.object({
  name: z.string().min(1, 'El nombre del rol es requerido').max(100, 'El nombre es demasiado largo'),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function ClientSettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ClientRole | null>(null);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
    },
  });

  // Fetch client roles (organization_id is derived server-side)
  const { data: clientRoles, isLoading } = useQuery<ClientRole[]>({
    queryKey: [`/api/client-roles`],
    enabled: !!organizationId
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      return await apiRequest('POST', '/api/client-roles', { name: data.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client-roles`] });
      toast({
        title: 'Rol creado',
        description: 'El rol de cliente ha sido creado correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al crear rol',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      if (!editingRole) throw new Error('No role selected');
      return await apiRequest('PATCH', `/api/client-roles/${editingRole.id}`, { name: data.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client-roles`] });
      toast({
        title: 'Rol actualizado',
        description: 'El rol de cliente ha sido actualizado correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al actualizar rol',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/client-roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client-roles`] });
      toast({
        title: 'Rol eliminado',
        description: 'El rol de cliente ha sido eliminado correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error al eliminar rol',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleOpenModal = (role?: ClientRole) => {
    if (role) {
      setEditingRole(role);
      form.reset({ name: role.name });
    } else {
      setEditingRole(null);
      form.reset({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    form.reset({ name: '' });
  };

  const onSubmit = async (data: RoleFormData) => {
    if (editingRole) {
      await updateRoleMutation.mutateAsync(data);
    } else {
      await createRoleMutation.mutateAsync(data);
    }
  };

  const handleDelete = (role: ClientRole) => {
    if (role.is_default) {
      toast({
        title: 'No permitido',
        description: 'No se pueden eliminar roles del sistema',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar el rol "${role.name}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const tableColumns = [
    {
      key: 'name',
      label: 'Nombre',
      render: (role: ClientRole) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{role.name}</span>
          {role.is_default && (
            <Badge variant="secondary" className="gap-1">
              <Shield className="w-3 h-3" />
              Sistema
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (role: ClientRole) => (
        <span className="text-sm text-muted-foreground">
          {role.is_default ? 'Rol del sistema' : 'Rol personalizado'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right' as const,
      render: (role: ClientRole) => {
        if (role.is_default) return null;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                data-testid={`button-actions-role-${role.id}`}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleOpenModal(role)}
                data-testid={`menu-edit-role-${role.id}`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(role)}
                className="text-destructive"
                data-testid={`menu-delete-role-${role.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Modal panels
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Rol</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Inversor, Copropietario, etc."
                  data-testid="input-role-name"
                  {...field}
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
      title={editingRole ? 'Editar Rol de Cliente' : 'Nuevo Rol de Cliente'}
      description={
        editingRole
          ? 'Modifica el nombre del rol personalizado de cliente'
          : 'Crea un nuevo rol personalizado para asignar a los clientes del proyecto'
      }
      icon={Settings}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingRole ? 'Guardar Cambios' : 'Crear Rol'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={createRoleMutation.isPending || updateRoleMutation.isPending}
    />
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Roles de Cliente
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona los roles que pueden asignarse a los clientes. Los roles del sistema no pueden modificarse.
            </p>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            data-testid="button-add-client-role"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Rol
          </Button>
        </div>

        <div className="rounded-lg border">
          <Table
            data={clientRoles || []}
            columns={tableColumns}
            isLoading={isLoading}
            emptyStateConfig={{
              icon: <Settings className="w-12 h-12 text-muted-foreground" />,
              title: 'No hay roles de cliente',
              description: 'Agrega roles personalizados para asignar a los clientes del proyecto',
            }}
          />
        </div>
      </div>

      {isModalOpen && (
        <FormModalLayout
          columns={1}
          viewPanel={<div></div>}
          editPanel={editPanel}
          headerContent={headerContent}
          footerContent={footerContent}
          onClose={handleClose}
          isEditing={true}
        />
      )}
    </>
  );
}
