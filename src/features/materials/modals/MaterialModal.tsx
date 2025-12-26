/**
 * Material Modal
 * 
 * Modal presentacional 100% para crear/editar materiales.
 * Refactorizado desde MaterialFormModal para seguir Feature-Sliced Design.
 * 
 * IMPORTANT: This modal is 100% presentational and receives all data via props.
 * It does NOT use global hooks like useUnits, useCurrentUser, or useProjectContext.
 */
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package } from 'lucide-react';
import { FormModalLayout } from '@/components/modal';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { useModalPanelStore } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CascadingSelect } from '@/components/shared/fields/CascadingSelectField';
import { useCreateMaterial } from '../hooks/use-create-material';
import { useUpdateMaterial } from '../hooks/use-update-material';
import { useMaterialCategories } from '../material-categories';
import { materialSchema, type MaterialFormData } from '../schemas';
import type { Material, NewMaterialData } from '../types';
import { convertToCascadingOptions, findCategoryPath, findCategoryIdByName } from '../mappers/materialMapper';
interface Unit {
  id: string;
  name: string;
}
interface MaterialModalProps {
  modalData: {
    editingMaterial?: Material | null;
    isDuplicating?: boolean;
  };
  onClose: () => void;
  organizationId: string;
  units: Unit[];
}
export function MaterialModal({ modalData, onClose, organizationId, units }: MaterialModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>([]);
  const { editingMaterial, isDuplicating = false } = modalData;
  const isEditing = !!editingMaterial && !isDuplicating;
  // Feature hooks only (100% presentational)
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const { data: categories = [] } = useMaterialCategories(organizationId);
  const { setPanel } = useModalPanelStore();
  // Convert categories to cascading format - memoize to prevent recreation
  const cascadingOptions = useMemo(() => {
    return convertToCascadingOptions(categories);
  }, [categories]);
  // Force edit mode when modal opens
  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);
  // Form setup
  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      material_type: 'material',
      category_id: '',
      unit_id: '',
      is_completed: false,
    },
  });
  // Load editing data
  useEffect(() => {
    if ((isEditing || isDuplicating) && editingMaterial && categories.length > 0) {
      // For materials from materials_view, use category_id directly
      const categoryId =
        (editingMaterial as any).category_id ||
        findCategoryIdByName(categories, (editingMaterial as any).category_name) ||
        '';
      form.reset({
        name: isDuplicating ? `${editingMaterial.name} - Copia` : editingMaterial.name,
        material_type: (editingMaterial.material_type as 'material'| 'consumable') || 'material',
        category_id: categoryId,
        unit_id: editingMaterial.unit_id,
        is_completed: editingMaterial.is_completed || false,
      });
      // Set the category path for CascadingSelect
      const path = findCategoryPath(categories, categoryId);
      setSelectedCategoryPath(path);
    } else if (!isEditing && !isDuplicating) {
      form.reset({
        name: '',
        material_type: 'material',
        category_id: '',
        unit_id: '',
        is_completed: false,
      });
      setSelectedCategoryPath([]);
    }
  }, [editingMaterial?.id, isEditing, isDuplicating, categories.length, form]);
  // Submit handler
  const onSubmit = async (values: MaterialFormData) => {
    setIsLoading(true);
    try {
      if (isEditing && editingMaterial) {
        // Update material
        await updateMutation.mutateAsync({
          id: editingMaterial.id,
          data: {
            name: values.name,
            material_type: values.material_type,
            unit_id: values.unit_id,
            category_id: values.category_id,
            is_completed: values.is_completed,
            organization_id: organizationId,
          },
        });
      } else {
        // Create material
        const materialData: NewMaterialData = {
          name: values.name,
          material_type: values.material_type,
          category_id: values.category_id,
          unit_id: values.unit_id,
          is_completed: values.is_completed,
          organization_id: organizationId,
          is_system: false,
        };
        await createMutation.mutateAsync(materialData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving material:', error);
    } finally {
      setIsLoading(false);
    }
  };
  // Edit panel
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Material Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Material *</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Cemento Portland" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Material Type */}
        <FormField
          control={form.control}
          name="material_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Material *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de material" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="consumable">Insumo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Category */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría *</FormLabel>
              <FormControl>
                <CascadingSelect
                  options={cascadingOptions}
                  value={selectedCategoryPath}
                  onValueChange={(newPath: string[]) => {
                    setSelectedCategoryPath(newPath);
                    const selectedId = newPath[newPath.length - 1];
                    field.onChange(selectedId);
                  }}
                  placeholder="Selecciona una categoría"
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Unit */}
        <FormField
          control={form.control}
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad de Medida *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una unidad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Is Completed */}
        <FormField
          control={form.control}
          name="is_completed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Material Completo</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Marcar si el material está completamente configurado
                </div>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
  const headerContent = (
    <FormModalHeader
      title={isEditing ? 'Editar Material': isDuplicating ? 'Duplicar Material': 'Nuevo Material'}
      icon={Package}
    />
  );
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? 'Actualizar': 'Crear'}
      onRightClick={form.handleSubmit(onSubmit)}
      submitDisabled={isLoading}
      showLoadingSpinner={isLoading}
    />
  );
  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  );
}
