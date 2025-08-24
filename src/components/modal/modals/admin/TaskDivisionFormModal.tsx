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
import { Textarea } from "@/components/ui/textarea";

import { useCreateTaskDivision, useUpdateTaskDivision, TaskDivisionAdmin } from "@/hooks/use-task-divisions-admin";

const taskDivisionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  name_en: z.string().optional(),
  description: z.string().optional(),
});

type TaskDivisionFormData = z.infer<typeof taskDivisionSchema>;

interface TaskDivisionFormModalProps {
  modalData?: {
    editingDivision?: TaskDivisionAdmin;
    isEditing?: boolean;
    divisionId?: string;
  };
  onClose: () => void;
}

export function TaskDivisionFormModal({ modalData, onClose }: TaskDivisionFormModalProps) {
  const { editingDivision, isEditing = false, divisionId } = modalData || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createMutation = useCreateTaskDivision();
  const updateMutation = useUpdateTaskDivision();

  const form = useForm<TaskDivisionFormData>({
    resolver: zodResolver(taskDivisionSchema),
    defaultValues: {
      name: editingDivision?.name || '',
      name_en: editingDivision?.name_en || '',
      description: editingDivision?.description || '',
    },
  });

  // Reset form when modal opens/closes or division changes
  useEffect(() => {
    if (editingDivision) {
      form.reset({
        name: editingDivision.name,
        name_en: editingDivision.name_en || '',
        description: editingDivision.description || '',
      });
    } else {
      form.reset({
        name: '',
        name_en: '',
        description: '',
      });
    }
  }, [editingDivision, form]);

  const onSubmit = async (data: TaskDivisionFormData) => {
    setIsSubmitting(true);
    
    try {
      const submitData = {
        name: data.name,
        name_en: data.name_en || undefined,
        description: data.description || undefined,
        is_system: true, // Always system divisions
        organization_id: null, // Always null for system divisions
      };

      if (editingDivision) {
        await updateMutation.mutateAsync({ 
          id: editingDivision.id, 
          ...submitData 
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving division:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = null; // No view mode needed for this modal

  const editPanel = (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Name field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ingresa el nombre de la división" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* English Name field */}
          <FormField
            control={form.control}
            name="name_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre en inglés (opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ingresa el nombre en inglés" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción (opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ingresa una descripción de la división" 
                    rows={3}
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

  return (
    <FormModalLayout
      isEditing={isEditing}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={
        <FormModalHeader
          title={editingDivision ? "Editar División" : "Nueva División"}
          description={editingDivision ? "Modifica los datos de la división" : "Crea una nueva división de tareas"}
          icon={Package2}
        />
      }
      footerContent={
        <FormModalFooter
          leftLabel="Cancelar"
          rightLabel={editingDivision ? "Actualizar" : "Crear"}
          onLeftClick={onClose}
          onRightClick={form.handleSubmit(onSubmit)}
          submitDisabled={isSubmitting}
          showLoadingSpinner={isSubmitting}
        />
      }
      onClose={onClose}
      columns={1}
    />
  );
}