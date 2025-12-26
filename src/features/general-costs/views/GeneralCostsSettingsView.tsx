import { FolderOpen, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGeneralCostCategories, useDeleteGeneralCostCategory } from '@/features/general-costs/hooks/use-general-cost-categories';
import { useReplaceGeneralCostCategory } from '@/features/general-costs/hooks/use-replace-general-cost-category';
import { useGlobalModalStore } from '@/components/modal';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { getGeneralCostCategoryUsageCount } from '@/features/general-costs/services/generalCostCategories';
import type { GeneralCostCategory } from '@/features/general-costs/types';

export default function GeneralCostsSettingsView() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id ?? null;
  const { openModal } = useGlobalModalStore();
  
  const { data: categories = [], isLoading } = useGeneralCostCategories(organizationId ?? undefined);
  const deleteMutation = useDeleteGeneralCostCategory();
  const replaceMutation = useReplaceGeneralCostCategory(organizationId);

  const sortedCategories = [...categories].sort((a, b) => 
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  const handleAddCategory = () => {
    openModal('generalCostCategory', { isEditing: false });
  };

  const handleEditCategory = (category: GeneralCostCategory) => {
    openModal('generalCostCategory', { 
      category,
      isEditing: true 
    });
  };

  const handleDeleteCategory = async (category: GeneralCostCategory) => {
    if (!organizationId) return;

    try {
      const usageCount = await getGeneralCostCategoryUsageCount(category.id);
      
      const otherCategories = categories.filter(c => c.id !== category.id);
      const canReplace = usageCount > 0 && otherCategories.length > 0;

      const consequences: string[] = [];
      if (usageCount > 0) {
        consequences.push(
          `${usageCount} gasto${usageCount === 1 ? '' : 's'} tiene${usageCount === 1 ? '' : 'n'} esta categoría asignada`
        );
        if (canReplace) {
          consequences.push('Podés reemplazarlos con otra categoría o dejarlos sin categoría asignada');
        } else {
          consequences.push('Los gastos quedarán sin categoría asignada');
        }
      }

      const replacementOptions = otherCategories
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
        .map(c => ({
          label: c.name + (c.is_system ? ' (Sistema)' : ''),
          value: c.id
        }));

      openModal('delete-confirmation', {
        mode: canReplace ? 'replace' : 'delete',
        title: '¿Eliminar categoría?',
        description: `¿Estás seguro de que querés eliminar la categoría "${category.name}"?`,
        itemName: category.name,
        itemType: 'categoría',
        consequences: consequences.length > 0 ? consequences : undefined,
        replacementOptions: canReplace ? replacementOptions : undefined,
        currentId: category.id,
        destructiveActionText: 'Eliminar Categoría',
        onDelete: async () => {
          try {
            await deleteMutation.mutateAsync({ categoryId: category.id, organizationId });
            toast({
              title: 'Categoría eliminada',
              description: 'La categoría se eliminó correctamente'
            });
          } catch (error) {
            toast({
              title: 'Error',
              description: 'No se pudo eliminar la categoría',
              variant: 'destructive'
            });
          }
        },
        onReplace: async (newCategoryId: string) => {
          try {
            await replaceMutation.mutateAsync({ oldCategoryId: category.id, newCategoryId });
          } catch (error) {
            toast({
              title: 'Error',
              description: 'No se pudo reemplazar la categoría',
              variant: 'destructive'
            });
          }
        }
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo verificar el uso de la categoría',
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
              <FolderOpen className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Categorías de Gastos</h2>
            </div>
            <Button
              onClick={handleAddCategory}
              size="sm"
              disabled={!organizationId}
              data-testid="button-add-general-cost-category"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Categoría
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona las categorías disponibles para clasificar los gastos generales. 
            Las categorías del sistema son predefinidas y no se pueden modificar. 
            Puedes crear categorías personalizadas para adaptar la gestión de gastos a las necesidades de tu organización.
          </p>
        </div>

        <div className="space-y-3">
          {sortedCategories.map((category) => (
            <div 
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
              data-testid={`card-general-cost-category-${category.id}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{category.name}</p>
                  {category.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                {category.is_system ? (
                  <Badge variant="default" data-testid="badge-category-system">
                    Sistema
                  </Badge>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                      data-testid={`button-edit-category-${category.id}`}
                      disabled={!organizationId}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category)}
                      data-testid={`button-delete-category-${category.id}`}
                      disabled={!organizationId}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {sortedCategories.length === 0 && (
            <div className="p-8 text-center rounded-lg border border-dashed border-border">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No hay categorías personalizadas. Crea una para adaptar la gestión de gastos a tus necesidades.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
