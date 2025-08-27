import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package2 } from "lucide-react";

import { FormModalLayout } from "../../form/FormModalLayout";
import { FormModalHeader } from "../../form/FormModalHeader";
import { FormModalFooter } from "../../form/FormModalFooter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ComboBox } from "@/components/ui-custom/fields/ComboBoxWriteField";

import { useCreateTaskCategory, useUpdateTaskCategory, TaskCategoryAdmin } from "@/hooks/use-task-categories-admin";
import { useAllTaskCategories } from "@/hooks/use-task-categories-admin";

const taskCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  parent_id: z.string().nullable().optional(),
});

type TaskCategoryFormData = z.infer<typeof taskCategorySchema>;

interface TaskCategoryFormModalProps {
  modalData?: {
    editingCategory?: TaskCategoryAdmin;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function TaskCategoryFormModal({ modalData, onClose }: TaskCategoryFormModalProps) {
  const { editingCategory, isEditing = false } = modalData || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createMutation = useCreateTaskCategory();
  const updateMutation = useUpdateTaskCategory();
  const { data: allCategories = [] } = useAllTaskCategories();

  const form = useForm<TaskCategoryFormData>({
    resolver: zodResolver(taskCategorySchema),
    defaultValues: {
      name: editingCategory?.name || '',
      code: editingCategory?.code || '',
      parent_id: editingCategory?.parent_id || null,
    },
  });

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        code: editingCategory.code || '',
        parent_id: editingCategory.parent_id,
      });
    } else {
      form.reset({
        name: '',
        code: '',
        parent_id: null,
      });
    }
  }, [editingCategory, form]);

  const onSubmit = async (data: TaskCategoryFormData) => {
    setIsSubmitting(true);
    
    try {
      const submitData = {
        name: data.name,
        code: data.code || undefined,
        parent_id: data.parent_id,
      };

      if (editingCategory) {
        await updateMutation.mutateAsync({ 
          id: editingCategory.id, 
          ...submitData 
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = null; // No view mode needed for this modal

  const editPanel = (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Single parent selector for both create and edit */}
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Categoría Padre</FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value || ""}
                    onValueChange={(value) => field.onChange(value || null)}
                    options={(allCategories || []).map(category => ({ value: category.id, label: category.name }))}
                    placeholder="Seleccionar categoría padre (opcional)"
                    searchPlaceholder="Buscar categoría..."
                    emptyMessage="No se encontraron categorías."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Prefijo de Código - Always editable */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prefijo de Código</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Código de la categoría (ej: ABC)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nombre - Always editable */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre de la categoría"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      icon={Package2}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
      onRightClick={form.handleSubmit(onSubmit)}
      isLoading={isSubmitting}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true} // Siempre abrir en modo edición
    />
  );
}