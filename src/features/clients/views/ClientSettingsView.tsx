import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useClientRoles, useDeleteClientRole } from '@/features/clients/hooks/use-client-roles';
import { useReplaceClientRole } from '@/features/clients/hooks/use-replace-client-role';
import { useGlobalModalStore } from '@/components/modal';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { getClientRoleUsageCount } from '@/features/clients/services/clientRoles';
import type { ClientRole } from '@/features/clients/types';
export function ClientSettingsView() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id ?? null;
  const { openModal } = useGlobalModalStore();
  
  const { data: clientRoles = [], isLoading } = useClientRoles(organizationId ?? undefined);
  const deleteMutation = useDeleteClientRole();
  const replaceMutation = useReplaceClientRole(organizationId);
  const sortedRoles = [...clientRoles].sort((a, b) => 
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
  const handleAddRole = () => {
    openModal('clientRole', { isEditing: false });
  };
  const handleEditRole = (role: ClientRole) => {
    openModal('clientRole', { 
      clientRole: role,
      isEditing: true 
    });
  };
  const handleDeleteRole = async (role: ClientRole) => {
    if (!organizationId) return;
    try {
      const usageCount = await getClientRoleUsageCount(role.id);
      
      const otherRoles = clientRoles.filter(r => r.id !== role.id);
      const canReplace = usageCount > 0 && otherRoles.length > 0;
      const consequences: string[] = [];
      if (usageCount > 0) {
        consequences.push(
          `${usageCount} cliente${usageCount === 1 ? '': 's'} tiene${usageCount === 1 ? '': 'n'} este rol asignado`
        );
        if (canReplace) {
          consequences.push('Podés reemplazarlos con otro rol o dejarlos sin rol asignado');
        } else {
          consequences.push('Los clientes quedarán sin rol asignado');
        }
      }
      const replacementOptions = otherRoles
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base'}))
        .map(r => ({
          label: r.name + (r.is_default ? '(Sistema)': ''),
          value: r.id
        }));
      openModal('delete-confirmation', {
        mode: canReplace ? 'replace': 'delete',
        title: '¿Eliminar rol de cliente?',
        description: `¿Estás seguro de que querés eliminar el rol "${role.name}"?`,
        itemName: role.name,
        itemType: 'rol',
        consequences: consequences.length > 0 ? consequences : undefined,
        replacementOptions: canReplace ? replacementOptions : undefined,
        currentId: role.id,
        destructiveActionText: 'Eliminar Rol',
        onDelete: async () => {
          try {
            await deleteMutation.mutateAsync({ roleId: role.id, organizationId });
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
        },
        onReplace: async (newRoleId: string) => {
          try {
            await replaceMutation.mutateAsync({ oldRoleId: role.id, newRoleId });
          } catch (error) {
            console.error('Error replacing client role:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error checking role usage:', error);
      toast({
        title: 'Error',
        description: 'No se pudo verificar el uso del rol',
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
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Roles de Cliente</h2>
            </div>
            <Button
              onClick={handleAddRole}
              size="sm"
              disabled={!organizationId}
              data-testid="button-add-client-role"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Rol
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona los roles disponibles para clasificar a tus clientes. 
            Los roles del sistema son predefinidos y no se pueden modificar. 
            Puedes crear roles personalizados para adaptar la gestión de clientes a las necesidades de tu organización.
          </p>
        </div>
        <div className="space-y-3">
          {sortedRoles.map((role) => (
            <div 
              key={role.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
              data-testid={`card-client-role-${role.id}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{role.name}</p>
                  {role.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {role.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                {role.is_default ? (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Sistema
                  </span>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                      data-testid={`button-edit-role-${role.id}`}
                      disabled={!organizationId}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      data-testid={`button-delete-role-${role.id}`}
                      disabled={!organizationId}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {sortedRoles.length === 0 && (
            <div className="p-8 text-center rounded-lg border border-dashed border-border">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No hay roles personalizados. Crea uno para adaptar la gestión de clientes a tus necesidades.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ClientSettingsView;
