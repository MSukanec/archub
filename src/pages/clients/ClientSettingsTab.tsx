import { useState } from 'react';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useClientRoles, useDeleteClientRole } from '@/features/clients';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ClientRole } from '@/features/clients/types';

export default function ClientSettingsTab() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { openModal } = useGlobalModalStore();
  
  const { data: clientRoles = [], isLoading } = useClientRoles(organizationId);
  const deleteMutation = useDeleteClientRole();

  const [roleToDelete, setRoleToDelete] = useState<ClientRole | null>(null);

  const systemRoles = clientRoles.filter(role => role.is_default === true);
  const customRoles = clientRoles.filter(role => role.is_default === false);

  const handleAddRole = () => {
    openModal('clientRole', { isEditing: false });
  };

  const handleEditRole = (role: ClientRole) => {
    openModal('clientRole', { 
      clientRole: role,
      isEditing: true 
    });
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete || !organizationId) return;

    try {
      await deleteMutation.mutateAsync({
        roleId: roleToDelete.id,
        organizationId
      });

      toast({
        title: 'Rol eliminado',
        description: 'El rol de cliente se eliminó correctamente'
      });
      setRoleToDelete(null);
    } catch (error) {
      console.error('Error deleting client role:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el rol de cliente',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Roles de Cliente</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona los roles disponibles para clasificar a tus clientes. 
            Los roles del sistema son predefinidos y no se pueden modificar. 
            Puedes crear roles personalizados para adaptar la gestión de clientes a las necesidades de tu organización.
          </p>
        </div>

        <div className="space-y-6">
          <Button 
            onClick={handleAddRole}
            className="w-full sm:w-auto"
            data-testid="button-add-client-role"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Rol
          </Button>

          {systemRoles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Roles del Sistema</h3>
              {systemRoles.map((role) => (
                <div 
                  key={role.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  data-testid={`card-client-role-${role.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{role.name}</p>
                      {role.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      Sistema
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {customRoles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Roles Personalizados</h3>
              {customRoles.map((role) => (
                <div 
                  key={role.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  data-testid={`card-client-role-${role.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{role.name}</p>
                      {role.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                      data-testid={`button-edit-role-${role.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRoleToDelete(role)}
                      data-testid={`button-delete-role-${role.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {customRoles.length === 0 && (
            <div className="p-8 text-center rounded-lg border border-dashed border-border">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No hay roles personalizados. Crea uno para adaptar la gestión de clientes a tus necesidades.
              </p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol de cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el rol "{roleToDelete?.name}".
              Los clientes existentes con este rol no se verán afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
