import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useClientRoles } from '@/features/clients/hooks/use-client-roles';
import { useDeleteClientRole } from '@/features/clients/hooks/use-client-roles';
import { useGlobalModalStore } from '@/components/modal';
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

  // Sort all roles alphabetically by name (case-insensitive)
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

  const handleDeleteRole = (role: ClientRole) => {
    openModal('delete-confirmation', {
      mode: 'delete',
      title: '¿Eliminar rol de cliente?',
      description: `Esta acción eliminará permanentemente el rol "${role.name}". Los clientes existentes con este rol no se verán afectados.`,
      itemName: role.name,
      itemType: 'rol',
      destructiveActionText: 'Eliminar Rol',
      onDelete: async () => {
        if (!organizationId) return;

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
      {/* Sección: Roles de Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Descripción */}
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

        {/* Right Column - Contenido */}
        <div className="space-y-3">

          {/* All roles sorted alphabetically */}
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

          {/* Estado vacío */}
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
