import { Tag, Edit2, Trash2, Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/features/users/hooks';
import { useProjectTypes, useDeleteProjectType, useReplaceProjectType, useProjectModalities, useDeleteProjectModality, useReplaceProjectModality } from '@/features/projects';
import type { ProjectType, ProjectModality } from '@/features/projects';
import { useGlobalModalStore } from '@/components/modal';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

export function ProjectSettingsView() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { openModal } = useGlobalModalStore();
  
  const { data: projectTypes = [], isLoading: typesLoading } = useProjectTypes(organizationId);
  const { data: projectModalities = [], isLoading: modalitiesLoading } = useProjectModalities(organizationId);
  
  const deleteTypeMutation = useDeleteProjectType(organizationId);
  const replaceTypeMutation = useReplaceProjectType(organizationId);
  const deleteModalityMutation = useDeleteProjectModality(organizationId);
  const replaceModalityMutation = useReplaceProjectModality(organizationId);

  // Ordenar tipos alfabéticamente
  const sortedTypes = [...projectTypes].sort((a, b) => 
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  );

  // Ordenar modalidades alfabéticamente
  const sortedModalities = [...projectModalities].sort((a, b) => 
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  );

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

    const otherTypes = projectTypes.filter((t: ProjectType) => t.id !== type.id);
    const hasReplacements = otherTypes.length > 0;
    
    const mode = hasReplacements ? 'replace' : 'delete';
    
    const replacementOptions = otherTypes
      .sort((a: ProjectType, b: ProjectType) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
      .map((t: ProjectType) => ({
        label: t.name,
        value: t.id
      }));

    const consequences = [
      `Todos los proyectos con este tipo quedarán sin tipo de proyecto`,
      mode === 'replace' 
        ? 'Puedes reemplazarlos con otro tipo o dejarlos sin referencia'
        : ''
    ].filter(Boolean);

    openModal('delete-confirmation', {
      mode,
      title: 'Eliminar tipo de proyecto',
      description: `¿Estás seguro de que quieres eliminar "${type.name}"?`,
      itemName: type.name,
      itemType: 'tipo de proyecto',
      consequences: consequences.length > 0 ? consequences : undefined,
      replacementOptions: mode === 'replace' ? replacementOptions : undefined,
      currentId: type.id,
      onDelete: async () => {
        await deleteTypeMutation.mutateAsync({ typeId: type.id, organizationId });
      },
      onReplace: async (newId: string) => {
        await replaceTypeMutation.mutateAsync({ oldTypeId: type.id, newTypeId: newId, organizationId });
      }
    });
  };

  const handleDeleteModality = (modality: ProjectModality) => {
    if (!organizationId) return;

    if (modality.organization_id === null) {
      toast({
        title: 'Operación no permitida',
        description: 'No se pueden eliminar las modalidades del sistema',
        variant: 'destructive'
      });
      return;
    }

    const otherModalities = projectModalities.filter((m: ProjectModality) => m.id !== modality.id);
    const hasReplacements = otherModalities.length > 0;
    
    const mode = hasReplacements ? 'replace' : 'delete';
    
    const replacementOptions = otherModalities
      .sort((a: ProjectModality, b: ProjectModality) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
      .map((m: ProjectModality) => ({
        label: m.name,
        value: m.id
      }));

    const consequences = [
      `Todos los proyectos con esta modalidad quedarán sin modalidad de proyecto`,
      mode === 'replace' 
        ? 'Puedes reemplazarlos con otra modalidad o dejarlos sin referencia'
        : ''
    ].filter(Boolean);

    openModal('delete-confirmation', {
      mode,
      title: 'Eliminar modalidad de proyecto',
      description: `¿Estás seguro de que quieres eliminar "${modality.name}"?`,
      itemName: modality.name,
      itemType: 'modalidad de proyecto',
      consequences: consequences.length > 0 ? consequences : undefined,
      replacementOptions: mode === 'replace' ? replacementOptions : undefined,
      currentId: modality.id,
      onDelete: async () => {
        await deleteModalityMutation.mutateAsync({ modalityId: modality.id, organizationId });
      },
      onReplace: async (newId: string) => {
        await replaceModalityMutation.mutateAsync({ oldModalityId: modality.id, newModalityId: newId, organizationId });
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
          {/* Tipos ordenados alfabéticamente */}
          {sortedTypes.length > 0 ? (
            <>
              {sortedTypes.map((type) => {
                const isSystemType = type.organization_id === null;
                return (
                  <div 
                    key={type.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    data-testid={`card-project-type-${type.id}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{type.name}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {isSystemType ? (
                        <Badge variant="neutral">Sistema</Badge>
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
                No hay tipos de proyecto. Crea uno para adaptar la clasificación a tus necesidades.
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
          {/* Modalidades ordenadas alfabéticamente */}
          {sortedModalities.length > 0 ? (
            <>
              {sortedModalities.map((modality) => {
                const isSystemModality = modality.organization_id === null;
                return (
                  <div 
                    key={modality.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    data-testid={`card-project-modality-${modality.id}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{modality.name}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {isSystemModality ? (
                        <Badge variant="neutral">Sistema</Badge>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="p-8 text-center rounded-lg border border-dashed border-border">
              <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No hay modalidades de proyecto. Crea una para categorizar tus proyectos de manera única.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
