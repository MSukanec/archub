import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useSiteLogTypes, useDeleteSiteLogType } from '@/features/sitelog/hooks/use-sitelog-types';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import type { SiteLogType } from '@/features/sitelog/services/getSiteLogTypes';

export default function SitelogSettings() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { openModal } = useGlobalModalStore();
  
  const { data: siteLogTypes = [], isLoading } = useSiteLogTypes(organizationId);
  const deleteMutation = useDeleteSiteLogType();

  // Separar tipos del sistema y de la organización
  const systemTypes = siteLogTypes.filter(type => type.organization_id === null);
  const customTypes = siteLogTypes.filter(type => type.organization_id !== null);

  const handleAddType = () => {
    openModal('siteLogType', { isEditing: false });
  };

  const handleEditType = (type: SiteLogType) => {
    openModal('siteLogType', { 
      siteLogType: type,
      isEditing: true 
    });
  };

  const handleDeleteType = (type: SiteLogType) => {
    if (!organizationId) return;

    openModal('delete-confirmation', {
      mode: 'simple',
      title: '¿Eliminar tipo de bitácora?',
      description: `Se eliminará el tipo "${type.name}". Las bitácoras existentes con este tipo no se verán afectadas.`,
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync({
            typeId: type.id,
            organizationId
          });

          toast({
            title: 'Tipo eliminado',
            description: 'El tipo de bitácora se eliminó correctamente'
          });
        } catch (error) {
          console.error('Error deleting site log type:', error);
          toast({
            title: 'Error',
            description: 'No se pudo eliminar el tipo de bitácora',
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
      {/* Sección: Tipos de Bitácora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Descripción */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Tipos de Bitácora</h2>
            </div>
            <Button
              onClick={handleAddType}
              size="sm"
              disabled={!organizationId}
              data-testid="button-add-sitelog-type"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Tipo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona los tipos de bitácora disponibles para clasificar tus entradas. 
            Los tipos del sistema son predefinidos y no se pueden modificar. 
            Puedes crear tipos personalizados para adaptar la bitácora a las necesidades de tu organización.
          </p>
        </div>

        {/* Right Column - Contenido */}
        <div className="space-y-3">

          {/* Tipos del Sistema */}
          {systemTypes.length > 0 && (
            <>
              {systemTypes.map((type) => (
                <div 
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  data-testid={`card-sitelog-type-${type.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{type.name}</p>
                      {type.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {type.description}
                        </p>
                      )}
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

          {/* Tipos Personalizados */}
          {customTypes.length > 0 && (
            <>
              {customTypes.map((type) => (
                <div 
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  data-testid={`card-sitelog-type-${type.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{type.name}</p>
                      {type.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {type.description}
                        </p>
                      )}
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

          {/* Estado vacío para tipos personalizados */}
          {customTypes.length === 0 && systemTypes.length === 0 && (
            <div className="p-8 text-center rounded-lg border border-dashed border-border">
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No hay tipos personalizados. Crea uno para adaptar la bitácora a tus necesidades.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
