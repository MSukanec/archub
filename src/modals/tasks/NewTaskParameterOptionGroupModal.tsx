import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

const taskParameterOptionGroupSchema = z.object({
  parameter_id: z.string().min(1, 'Parameter ID es requerido'),
  name: z.string().min(1, 'El nombre del grupo es requerido'),
  label: z.string().min(1, 'La etiqueta del grupo es requerida'),
  position: z.number().optional(),
});

type TaskParameterOptionGroupFormData = z.infer<typeof taskParameterOptionGroupSchema>;

interface TaskParameterOptionGroup {
  id: string;
  parameter_id: string;
  name: string;
  label: string;
  position?: number;
  created_at: string;
}

interface NewTaskParameterOptionGroupModalProps {
  open: boolean;
  onClose: () => void;
  group?: TaskParameterOptionGroup;
  parameterId: string;
  parameterLabel: string;
  onGroupCreated?: (groupId: string) => void;
}

export function NewTaskParameterOptionGroupModal({ 
  open, 
  onClose, 
  group,
  parameterId,
  parameterLabel,
  onGroupCreated
}: NewTaskParameterOptionGroupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaskParameterOptionGroupFormData>({
    resolver: zodResolver(taskParameterOptionGroupSchema),
    defaultValues: {
      parameter_id: parameterId,
      name: '',
      label: '',
      position: 0
    },
  });

  // Reset form when modal opens/closes or group changes
  useEffect(() => {
    if (open) {
      if (group) {
        form.reset({
          parameter_id: group.parameter_id,
          name: group.name,
          label: group.label,
          position: group.position || 0
        });
      } else {
        form.reset({
          parameter_id: parameterId,
          name: '',
          label: '',
          position: 0
        });
      }
    }
  }, [open, group, parameterId, form]);

  const onSubmit = async (data: TaskParameterOptionGroupFormData) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Mock implementation - would need actual backend hooks
      console.log('Creating/updating option group:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (onGroupCreated && !group) {
        onGroupCreated('mock-group-id');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving option group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomModalLayout open={open} onOpenChange={onClose}>
      <CustomModalHeader 
        title={group ? 'Editar Grupo de Opciones' : 'Nuevo Grupo de Opciones'}
        subtitle={`Parámetro: ${parameterLabel}`}
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CustomModalBody columns={1}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre (código) *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ej: acabados_principales" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiqueta (visible) *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ej: Acabados Principales" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CustomModalBody>

          <CustomModalFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : (group ? 'Actualizar' : 'Crear')} Grupo
            </Button>
          </CustomModalFooter>
        </form>
      </Form>
    </CustomModalLayout>
  );
}