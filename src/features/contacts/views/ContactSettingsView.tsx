import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useContactTypes, useDeleteContactType, useReplaceContactType } from '@/features/contacts';
import { useGlobalModalStore } from '@/components/modal';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import type { ContactType } from '@/features/contacts';

export function ContactSettingsView() {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { openModal } = useGlobalModalStore();
  
  const { data: contactTypes = [], isLoading } = useContactTypes(organizationId);
  const deleteMutation = useDeleteContactType(organizationId || '');
  const replaceMutation = useReplaceContactType(organizationId || '');

  const sortedTypes = [...contactTypes].sort((a: ContactType, b: ContactType) => 
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  );

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

    const otherTypes = contactTypes.filter((t: ContactType) => t.id !== type.id);
    const hasReplacements = otherTypes.length > 0;
    const mode = hasReplacements ? 'replace' : 'delete';
    
    const replacementOptions = otherTypes
      .sort((a: ContactType, b: ContactType) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
      .map((t: ContactType) => ({
        label: t.name,
        value: t.id
      }));

    const consequences = [
      `Todos los contactos con este tipo quedarán sin esta categoría`,
      mode === 'replace' 
        ? 'Puedes reemplazarlos con otro tipo o dejarlos sin referencia'
        : ''
    ].filter(Boolean);

    openModal('delete-confirmation', {
      mode,
      title: 'Eliminar tipo de contacto',
      description: `¿Estás seguro de que quieres eliminar "${type.name}"?`,
      itemName: type.name,
      itemType: 'tipo de contacto',
      consequences: consequences.length > 0 ? consequences : undefined,
      replacementOptions: mode === 'replace' ? replacementOptions : undefined,
      currentId: type.id,
      onDelete: async () => {
        await deleteMutation.mutateAsync(type.id);
      },
      onReplace: async (newId: string) => {
        await replaceMutation.mutateAsync({ oldTypeId: type.id, newTypeId: newId, organizationId });
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
    <div className="space-y-8">
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
          {sortedTypes.length > 0 ? (
            <>
              {sortedTypes.map((type: ContactType) => {
                const isSystemType = type.organization_id === null;
                return (
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
                      {isSystemType ? (
                        <Badge variant="info">
                          Sistema
                        </Badge>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="p-8 text-center rounded-lg border border-dashed border-border">
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No hay tipos de contacto. Crea uno para adaptar la clasificación de contactos a tus necesidades.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
