import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useSiteLogTypes, useDeleteSiteLogType } from '@/features/sitelog/hooks/use-sitelog-types';
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
import { useState } from 'react';
import type { SiteLogType } from '@/features/sitelog/services/getSiteLogTypes';

export default function SitelogSettings() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { openModal } = useGlobalModalStore();
  
  const { data: siteLogTypes = [], isLoading } = useSiteLogTypes(organizationId);
  const deleteMutation = useDeleteSiteLogType();

  const [typeToDelete, setTypeToDelete] = useState<SiteLogType | null>(null);

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

  const handleDeleteType = async () => {
    if (!typeToDelete || !organizationId) return;

    try {
      await deleteMutation.mutateAsync({
        typeId: typeToDelete.id,
        organizationId
      });

      toast({
        title: 'Tipo eliminado',
        description: 'El tipo de bitácora se eliminó correctamente'
      });
      setTypeToDelete(null);
    } catch (error) {
      console.error('Error deleting site log type:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el tipo de bitácora',
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
      {/* Sección: Tipos de Bitácora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Descripción */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Tag className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Tipos de Bitácora</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona los tipos de bitácora disponibles para clasificar tus entradas. 
            Los tipos del sistema son predefinidos y no se pueden modificar. 
            Puedes crear tipos personalizados para adaptar la bitácora a las necesidades de tu organización.
          </p>
        </div>

        {/* Right Column - Contenido */}
        <div className="space-y-6">
          {/* Botón para agregar nuevo tipo */}
          <Button 
            onClick={handleAddType}
            className="w-full sm:w-auto"
            data-testid="button-add-sitelog-type"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Tipo
          </Button>

          {/* Tipos del Sistema */}
          {systemTypes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Tipos del Sistema</h3>
              {systemTypes.map((type) => (
                <div 
                  key={type.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  data-testid={`card-sitelog-type-${type.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {type.color && (
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{type.name}</p>
                      {type.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {type.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">
                        {type.code}
                      </p>
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

          {/* Tipos Personalizados */}
          {customTypes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Tipos Personalizados</h3>
              {customTypes.map((type) => (
                <div 
                  key={type.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  data-testid={`card-sitelog-type-${type.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {type.color && (
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{type.name}</p>
                      {type.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {type.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">
                        {type.code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditType(type)}
                      data-testid={`button-edit-type-${type.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTypeToDelete(type)}
                      data-testid={`button-delete-type-${type.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estado vacío para tipos personalizados */}
          {customTypes.length === 0 && (
            <div className="p-8 text-center rounded-lg border border-dashed border-border">
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No hay tipos personalizados. Crea uno para adaptar la bitácora a tus necesidades.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Alert Dialog para confirmar eliminación */}
      <AlertDialog open={!!typeToDelete} onOpenChange={() => setTypeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de bitácora?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el tipo "{typeToDelete?.name}".
              Las bitácoras existentes con este tipo no se verán afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteType}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
