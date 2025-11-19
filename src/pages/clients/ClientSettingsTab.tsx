import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useClientRoles, useDeleteClientRole } from '@/features/clients';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import type { ClientRole } from '@/features/clients/types';

export default function ClientSettingsTab() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { openModal } = useGlobalModalStore();
  
  const { data: clientRoles = [], isLoading } = useClientRoles(organizationId);
  const deleteMutation = useDeleteClientRole();

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

  const handleDeleteRole = (role: ClientRole) => {
    openModal('delete-confirmation', {
      mode: 'simple',
      title: '¿Eliminar rol de cliente?',
      description: `Esta acción eliminará permanentemente el rol "${role.name}". Los clientes existentes con este rol no se verán afectados.`,
      itemName: role.name,
      itemType: 'rol',
      destructiveActionText: 'Eliminar Rol',
      onConfirm: async () => {
        if (!organizationId) return;

        try {
          await deleteMutation.mutateAsync({
            roleId: role.id,
            organizationId
          });

          toast({
            title: 'Rol eliminado',
            description: 'El rol de cliente se eliminó correctamente'
          });
        } catch (error) {
          console.error('Error deleting client role:', error);
          toast({
            title: 'Error',
            description: 'No se pudo eliminar el rol de cliente',
            variant: 'destructive'
          });
        }
      }
    });
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold">Roles de Cliente</h2>
        </div>
        <Button 
          onClick={handleAddRole}
          data-testid="button-add-client-role"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Rol
        </Button>
      </div>

      <p className="text-sm text-muted-foreground max-w-3xl">
        Gestiona los roles disponibles para clasificar a tus clientes. 
        Los roles del sistema son predefinidos y no se pueden modificar. 
        Puedes crear roles personalizados para adaptar la gestión de clientes a las necesidades de tu organización.
      </p>

      <div className="space-y-6">

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
                      onClick={() => handleDeleteRole(role)}
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
  );
}
