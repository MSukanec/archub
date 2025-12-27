import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package2 } from "lucide-react";

import { FormModalLayout } from "@/components/modal";
import { FormModalHeader } from "@/components/modal";
import { FormModalFooter } from "@/components/modal";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useCreateTaskDivision, useUpdateTaskDivision, TaskDivisionAdmin, useAllTaskDivisions } from "@/features/tasks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const taskDivisionSchema = z.object({
  parent_id: z.string().optional(),
  code: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
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
  
  console.log('🔧 TaskDivisionFormModal props:', { modalData, editingDivision, isEditing, divisionId });
  
  const createMutation = useCreateTaskDivision();
  const updateMutation = useUpdateTaskDivision();
  const { data: allDivisions = [] } = useAllTaskDivisions();

  const form = useForm<TaskDivisionFormData>({
    resolver: zodResolver(taskDivisionSchema),
    defaultValues: {
      parent_id: editingDivision?.parent_id || '',
      code: editingDivision?.code || '',
      name: editingDivision?.name || '',
      description: editingDivision?.description || '',
    },
  });

  useEffect(() => {
    if (editingDivision) {
      form.reset({
        parent_id: editingDivision.parent_id || '',
        code: editingDivision.code || '',
        name: editingDivision.name,
        description: editingDivision.description || '',
      });
    } else {
      form.reset({
        parent_id: '',
        code: '',
        name: '',
        description: '',
      });
    }
  }, [editingDivision, form]);

  const onSubmit = async (data: TaskDivisionFormData) => {
    setIsSubmitting(true);
    
    try {
      const parentId = data.parent_id && data.parent_id !== '' ? data.parent_id : null;
      
      const submitData = {
        parent_id: parentId,
        code: data.code || undefined,
        name: data.name,
        description: data.description || undefined,
        is_system: true,
        organization_id: undefined,
      };
      
      console.log('🔧 Submit data:', { originalData: data, submitData });

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

  const viewPanel = null;

  const editPanel = (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Padre (opcional)</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value === "no-parent" ? "" : value);
                  }} 
                  value={field.value || "no-parent"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar división padre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="no-parent">Sin padre</SelectItem>
                    {allDivisions
                      .filter(division => division.id !== editingDivision?.id)
                      .map((division) => (
                        <SelectItem key={division.id} value={division.id}>
                          {division.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código (opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ingresa el código de la división" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
