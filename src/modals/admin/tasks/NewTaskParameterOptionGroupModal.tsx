import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { useCreateTaskParameterOptionGroup } from '@/hooks/use-task-parameters-admin';

const optionGroupSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
});

type OptionGroupFormData = z.infer<typeof optionGroupSchema>;

interface NewTaskParameterOptionGroupModalProps {
  open: boolean;
  onClose: () => void;
  parameterId: string;
  parameterLabel: string;
}

export function NewTaskParameterOptionGroupModal({ 
  open, 
  onClose, 
  parameterId,
  parameterLabel
}: NewTaskParameterOptionGroupModalProps) {
  const createMutation = useCreateTaskParameterOptionGroup();
  
  const form = useForm<OptionGroupFormData>({
    resolver: zodResolver(optionGroupSchema),
    defaultValues: {
      name: '',
      label: '',
    },
  });

  const onSubmit = async (data: OptionGroupFormData) => {
    try {
      await createMutation.mutateAsync({
        parameter_id: parameterId,
        name: data.name,
        label: data.label,
      });
      
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error creating option group:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModalLayout
      open={open}
      onOpenChange={handleClose}
      content={{
        header: (
          <CustomModalHeader 
            title="Nuevo Grupo de Opciones"
            subtitle={`Para el parámetro: ${parameterLabel}`}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormLabel>Etiqueta (mostrar) *</FormLabel>
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
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Grupo'}
            </Button>
          </CustomModalFooter>
        ),
      }}
    />
  );
}