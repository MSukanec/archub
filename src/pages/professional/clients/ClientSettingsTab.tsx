import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Settings, Plus, Edit, Trash2, Shield } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ClientRole {
  id: string;
  name: string;
  is_default: boolean;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function ClientSettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ClientRole | null>(null);
  const [roleName, setRoleName] = useState('');

  // Fetch client roles
  const { data: clientRoles, isLoading } = useQuery<ClientRole[]>({
    queryKey: [`/api/client-roles?organization_id=${organizationId}`],
    enabled: !!organizationId
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!organizationId) throw new Error('Organization ID is required');
      return await apiRequest('POST', '/api/client-roles', {
        name,
        organization_id: organizationId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client-roles?organization_id=${organizationId}`] });
      toast({
        title: 'Rol creado',
        description: 'El rol de cliente ha sido creado correctamente',
      });
      setIsDialogOpen(false);
      setRoleName('');
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
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!organizationId) throw new Error('Organization ID is required');
      return await apiRequest('PATCH', `/api/client-roles/${id}`, {
        name,
        organization_id: organizationId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client-roles?organization_id=${organizationId}`] });
      toast({
        title: 'Rol actualizado',
        description: 'El rol de cliente ha sido actualizado correctamente',
      });
      setIsDialogOpen(false);
      setEditingRole(null);
      setRoleName('');
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
      if (!organizationId) throw new Error('Organization ID is required');
      return await apiRequest('DELETE', `/api/client-roles/${id}?organization_id=${organizationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client-roles?organization_id=${organizationId}`] });
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

  const handleOpenDialog = (role?: ClientRole) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
    } else {
      setEditingRole(null);
      setRoleName('');
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
    setRoleName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del rol es requerido',
        variant: 'destructive',
      });
      return;
    }

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, name: roleName.trim() });
    } else {
      createRoleMutation.mutate(roleName.trim());
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
      label: 'Acciones',
      align: 'right' as const,
      render: (role: ClientRole) => (
        <div className="flex items-center justify-end gap-2">
          {!role.is_default && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenDialog(role)}
                data-testid={`button-edit-role-${role.id}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(role)}
                data-testid={`button-delete-role-${role.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Roles de Cliente
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los roles que pueden asignarse a los clientes del proyecto
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
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
          emptyMessage="No hay roles de cliente configurados"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Editar Rol de Cliente' : 'Nuevo Rol de Cliente'}
              </DialogTitle>
              <DialogDescription>
                {editingRole
                  ? 'Modifica el nombre del rol de cliente'
                  : 'Crea un nuevo rol personalizado para asignar a los clientes'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="role-name">Nombre del Rol</Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Ej: Inversor, Copropietario, etc."
                className="mt-1"
                autoFocus
                data-testid="input-role-name"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                data-testid="button-cancel-role"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                data-testid="button-submit-role"
              >
                {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
