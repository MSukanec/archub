import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useContactTypes, useDeleteContactType } from '@/features/contacts';
import { useGlobalModalStore } from '@/components/modal';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import type { ContactType } from '@/features/contacts';

export default function ContactSettings() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { openModal } = useGlobalModalStore();
  
  const { data: contactTypes = [], isLoading } = useContactTypes(organizationId);
  const deleteMutation = useDeleteContactType(organizationId || '');

  const systemTypes = contactTypes.filter((type: ContactType) => type.organization_id === null);
  const customTypes = contactTypes.filter((type: ContactType) => type.organization_id !== null);

  const handleAddType = () => {
    openModal('contactType', { isEditing: false });
  };

  const handleEditType = (type: ContactType) => {
    openModal('contactType', { 
      contactType: type,
      isEditing: true 
    });
  };

  const handleDeleteType = (type: ContactType) => {
    if (!organizationId) return;

    openModal('delete-confirmation', {
      mode: 'simple',
      title: '¿Eliminar tipo de contacto?',
      description: `Se eliminará el tipo "${type.name}". Los contactos existentes con este tipo mantendrán su información, pero ya no mostrarán esta categoría.`,
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(type.id);

          toast({
            title: 'Tipo eliminado',
            description: 'El tipo de contacto se eliminó correctamente'
          });
        } catch (error) {
          console.error('Error deleting contact type:', error);
          toast({
            title: 'Error',
            description: 'No se pudo eliminar el tipo de contacto',
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Tipos de Contacto</h2>
            </div>
            <Button
              onClick={handleAddType}
              size="sm"
              disabled={!organizationId}
              data-testid="button-add-contact-type"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Tipo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona los tipos de contacto disponibles para clasificar a las personas y empresas con las que trabajas. 
            Los tipos del sistema son predefinidos y no se pueden modificar. 
            Puedes crear tipos personalizados para adaptar la clasificación a las necesidades de tu organización.
          </p>
        </div>

        <div className="space-y-3">
          {systemTypes.length > 0 && (
            <>
              {systemTypes.map((type: ContactType) => (
                <div 
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  data-testid={`card-contact-type-${type.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{type.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Sistema
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}

          {customTypes.length > 0 && (
            <>
              {customTypes.map((type: ContactType) => (
                <div 
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  data-testid={`card-contact-type-${type.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{type.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditType(type)}
                      data-testid={`button-edit-type-${type.id}`}
                      disabled={!organizationId}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteType(type)}
                      data-testid={`button-delete-type-${type.id}`}
                      disabled={!organizationId}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}

          {customTypes.length === 0 && systemTypes.length === 0 && (
            <div className="p-8 text-center rounded-lg border border-dashed border-border">
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No hay tipos personalizados. Crea uno para adaptar la clasificación de contactos a tus necesidades.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
