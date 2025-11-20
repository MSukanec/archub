import { Tag, Edit2, Trash2, Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectTypes, useDeleteProjectType } from '@/features/project-types/hooks/use-project-types';
import { useProjectModalities, useDeleteProjectModality } from '@/features/project-modalities/hooks/use-project-modalities';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import type { ProjectType } from '@/features/project-types/services/getProjectTypes';
import type { ProjectModality } from '@/features/project-modalities/services/getProjectModalities';

export default function ProjectSettingsTab() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { openModal } = useGlobalModalStore();
  
  const { data: projectTypes = [], isLoading: typesLoading } = useProjectTypes(organizationId);
  const { data: projectModalities = [], isLoading: modalitiesLoading } = useProjectModalities(organizationId);
  const deleteTypeMutation = useDeleteProjectType();
  const deleteModalityMutation = useDeleteProjectModality();

  // Separar tipos del sistema y de la organización
  const systemTypes = projectTypes.filter(type => type.organization_id === null);
  const customTypes = projectTypes.filter(type => type.organization_id !== null);

  // Separar modalidades del sistema y de la organización
  const systemModalities = projectModalities.filter(modality => modality.organization_id === null);
  const customModalities = projectModalities.filter(modality => modality.organization_id !== null);

  const handleEditType = (type: ProjectType) => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener la información de la organización',
        variant: 'destructive'
      });
      return;
    }
    openModal('projectType', { 
      projectType: type,
      isEditing: true 
    });
  };

  const handleEditModality = (modality: ProjectModality) => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener la información de la organización',
        variant: 'destructive'
      });
      return;
    }

    // Validar que no se intente editar una modalidad del sistema
    if (modality.organization_id === null) {
      toast({
        title: 'Operación no permitida',
        description: 'No se pueden modificar las modalidades del sistema',
        variant: 'destructive'
      });
      return;
    }

    openModal('projectModality', { 
      projectModality: modality,
      isEditing: true 
    });
  };

  const handleDeleteType = (type: ProjectType) => {
    if (!organizationId) return;

    openModal('delete-confirmation', {
      mode: 'simple',
      title: '¿Eliminar tipo de proyecto?',
      description: `Se eliminará el tipo "${type.name}". Los proyectos existentes con este tipo no se verán afectados.`,
      onConfirm: async () => {
        try {
          await deleteTypeMutation.mutateAsync({
            typeId: type.id,
            organizationId
          });

          toast({
            title: 'Tipo eliminado',
            description: 'El tipo de proyecto se eliminó correctamente'
          });
        } catch (error) {
          console.error('Error deleting project type:', error);
          toast({
            title: 'Error',
            description: 'No se pudo eliminar el tipo de proyecto',
            variant: 'destructive'
          });
        }
      }
    });
  };

  const handleDeleteModality = (modality: ProjectModality) => {
    if (!organizationId) return;

    // Validar que no se intente eliminar una modalidad del sistema
    if (modality.organization_id === null) {
      toast({
        title: 'Operación no permitida',
        description: 'No se pueden eliminar las modalidades del sistema',
        variant: 'destructive'
      });
      return;
    }

    openModal('delete-confirmation', {
      mode: 'simple',
      title: '¿Eliminar modalidad de proyecto?',
      description: `Se eliminará la modalidad "${modality.name}". Los proyectos existentes con esta modalidad no se verán afectados.`,
      onConfirm: async () => {
        try {
          await deleteModalityMutation.mutateAsync({
            modalityId: modality.id,
            organizationId
          });

          toast({
            title: 'Modalidad eliminada',
            description: 'La modalidad de proyecto se eliminó correctamente'
          });
        } catch (error) {
          console.error('Error deleting project modality:', error);
          toast({
            title: 'Error',
            description: 'No se pudo eliminar la modalidad de proyecto',
            variant: 'destructive'
          });
        }
      }
    });
  };

  if (typesLoading || modalitiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Sección: Tipos de Proyecto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Descripción */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Tipos de Proyecto</h2>
            </div>
            <Button
              onClick={() => openModal('projectType', { isEditing: false })}
              size="sm"
              disabled={!organizationId}
              data-testid="button-add-project-type"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Tipo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona los tipos de proyecto disponibles para clasificar tus proyectos. 
            Los tipos del sistema son predefinidos y no se pueden modificar. 
            Puedes crear tipos personalizados para adaptar la clasificación a las necesidades de tu organización.
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
                  data-testid={`card-project-type-${type.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{type.name}</p>
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
                  data-testid={`card-project-type-${type.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{type.name}</p>
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
                No hay tipos personalizados. Crea uno para adaptar la clasificación a tus necesidades.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sección: Modalidades de Proyecto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Descripción */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Modalidades de Proyecto</h2>
            </div>
            <Button
              onClick={() => openModal('projectModality', { isEditing: false })}
              size="sm"
              disabled={!organizationId}
              data-testid="button-add-project-modality"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Modalidad
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona las modalidades de proyecto disponibles. 
            Las modalidades del sistema son predefinidas y no se pueden modificar. 
            Puedes crear modalidades personalizadas para categorizar tus proyectos según su fase o enfoque.
          </p>
        </div>

        {/* Right Column - Contenido */}
        <div className="space-y-3">
          {/* Modalidades del Sistema */}
          {systemModalities.length > 0 && (
            <>
              {systemModalities.map((modality) => (
                <div 
                  key={modality.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  data-testid={`card-project-modality-${modality.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{modality.name}</p>
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

          {/* Modalidades Personalizadas */}
          {customModalities.length > 0 && (
            <>
              {customModalities.map((modality) => (
                <div 
                  key={modality.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  data-testid={`card-project-modality-${modality.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{modality.name}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditModality(modality)}
                      data-testid={`button-edit-modality-${modality.id}`}
                      disabled={!organizationId}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteModality(modality)}
                      data-testid={`button-delete-modality-${modality.id}`}
                      disabled={!organizationId}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Estado vacío para modalidades personalizadas */}
          {customModalities.length === 0 && systemModalities.length === 0 && (
            <div className="p-8 text-center rounded-lg border border-dashed border-border">
              <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No hay modalidades personalizadas. Crea una para categorizar tus proyectos de manera única.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
