import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal/state/globalModalStore';
import { 
  useCreateGeneralCostCategory, 
  useUpdateGeneralCostCategory, 
  useDeleteGeneralCostCategory,
  useGeneralCostCategories 
} from '../hooks/use-general-cost-categories';
import { useReplaceGeneralCostCategory } from '../hooks/use-replace-general-cost-category';
import { getGeneralCostCategoryUsageCount } from '../services/generalCostCategories';
import type { GeneralCostCategory } from '../types';

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es requerido').max(100),
  description: z.string().max(500).nullable().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

function FormPanel({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<CategoryFormData>>;
  onSubmit: (data: CategoryFormData) => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Servicios, Equipamiento, etc." 
                  {...field}
                  data-testid="input-category-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descripción opcional de la categoría" 
                  {...field}
                  value={field.value ?? ''}
                  data-testid="input-category-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

function ViewPanel({
  category,
  onEdit,
  onDelete,
}: {
  category: GeneralCostCategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Nombre</h4>
        <p className="text-base font-semibold" data-testid="text-category-name">
          {category.name}
        </p>
      </div>

      {category.description && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Descripción</h4>
          <p className="text-sm text-foreground" data-testid="text-category-description">
            {category.description}
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div data-testid="text-category-created-at">
            <span className="font-medium">Creado:</span> {new Date(category.created_at).toLocaleDateString('es-AR')}
          </div>
          {category.updated_at && (
            <div data-testid="text-category-updated-at">
              <span className="font-medium">Actualizado:</span> {new Date(category.updated_at).toLocaleDateString('es-AR')}
            </div>
          )}
        </div>
      </div>

      {category.is_system ? (
        <div className="pt-4 border-t border-border">
          <Badge variant="neutral" data-testid="badge-system-category">
            Categoría del Sistema - No se puede modificar
          </Badge>
        </div>
      ) : (
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onEdit}
            data-testid="button-edit-category"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onDelete}
            data-testid="button-delete-category"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      )}
    </div>
  );
}

interface GeneralCostCategoryModalProps {
  modalData?: {
    category?: GeneralCostCategory;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export default function GeneralCostCategoryModal({ modalData, onClose, mode = 'create' }: GeneralCostCategoryModalProps) {
  const { category } = modalData || {};
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { pushModal } = useGlobalModalStore();
  const organizationId = userData?.organization?.id ?? null;
  
  const createMutation = useCreateGeneralCostCategory(organizationId);
  const updateMutation = useUpdateGeneralCostCategory(organizationId);
  const deleteMutation = useDeleteGeneralCostCategory(organizationId);
  const replaceMutation = useReplaceGeneralCostCategory(organizationId);
  const { data: allCategories = [] } = useGeneralCostCategories(organizationId ?? undefined);
  
  const [currentMode, setCurrentMode] = useState<'create' | 'edit' | 'view'>(mode);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: null,
    }
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name || '',
        description: category.description || null,
      });
    } else {
      form.reset({
        name: '',
        description: null,
      });
    }
  }, [category, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleEditClick = () => {
    setCurrentMode('edit');
  };

  const handleDeleteClick = async () => {
    if (!category || !organizationId) return;

    try {
      const count = await getGeneralCostCategoryUsageCount(category.id);

      if (count === 0) {
        pushModal('delete-confirmation', {
          title: '¿Eliminar categoría?',
          description: 'Esta acción no se puede deshacer',
          itemName: category.name,
          mode: 'delete' as const,
          consequences: ['La categoría será eliminada permanentemente'],
          onDelete: async () => {
            await deleteMutation.mutateAsync({ categoryId: category.id, organizationId });
            handleClose();
          },
        });
      } else {
        const otherCategories = allCategories.filter((c) => c.id !== category.id && !c.is_system);

        if (otherCategories.length === 0) {
          toast({
            title: 'No se puede eliminar',
            description:
              'Esta categoría tiene gastos asociados pero no hay otras categorías disponibles para reemplazarla',
            variant: 'destructive',
          });
          return;
        }

        pushModal('delete-confirmation', {
          title: '¿Eliminar categoría?',
          description: 'Esta categoría tiene gastos asociados',
          itemName: category.name,
          mode: 'replace' as const,
          consequences: [
            `${count} gasto${count === 1 ? '' : 's'} será${count === 1 ? '' : 'n'} afectado${count === 1 ? '' : 's'}`,
            'Puedes reemplazarlos con otra categoría o eliminarlos sin referencia',
          ],
          replacementOptions: otherCategories
            .sort((a, b) =>
              a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
            )
            .map((c) => ({
              label: c.name + (c.is_system ? ' (Sistema)' : ''),
              value: c.id,
            })),
          onDelete: async () => {
            await deleteMutation.mutateAsync({ categoryId: category.id, organizationId });
            handleClose();
          },
          onReplace: async (newCategoryId: string) => {
            await replaceMutation.mutateAsync({
              oldCategoryId: category.id,
              newCategoryId,
            });
            handleClose();
          },
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo preparar la eliminación',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = (data: CategoryFormData) => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener la información de la organización',
        variant: 'destructive'
      });
      return;
    }

    if (currentMode === 'edit' && category) {
      updateMutation.mutate({
        categoryId: category.id,
        updates: {
          name: data.name,
          description: data.description ?? null,
        },
        organizationId,
      });
      handleClose();
    } else {
      createMutation.mutate({
        category: {
          name: data.name,
          description: data.description ?? null,
        },
        organizationId,
      });
      handleClose();
    }
  };

  const getHeader = () => {
    switch (currentMode) {
      case 'view':
        return {
          title: 'Ver Categoría',
          description: 'Información de la categoría',
        };
      case 'edit':
        return {
          title: 'Editar Categoría',
          description: 'Modifica los datos de la categoría',
        };
      case 'create':
      default:
        return {
          title: 'Nueva Categoría',
          description: 'Crea una nueva categoría para clasificar los gastos generales',
        };
    }
  };

  const header = getHeader();

  return (
    <ModalLayout onClose={handleClose} size="sm">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={FolderOpen}
      />

      <ModalBody>
        {currentMode === 'view' ? (
          category && (
            <ViewPanel
              category={category}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          )
        ) : (
          <FormPanel
            form={form}
            onSubmit={onSubmit}
          />
        )}
      </ModalBody>

      {currentMode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={handleClose}
          rightLabel={currentMode === 'edit' ? 'Guardar Cambios' : 'Crear Categoría'}
          onRightClick={form.handleSubmit(onSubmit)}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
      
      {currentMode === 'view' && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={handleClose}
        />
      )}
    </ModalLayout>
  );
}
