import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { CustomModalLayout } from '@/components/modal/legacy/CustomModalLayout';
import { CustomModalHeader } from '@/components/modal/legacy/CustomModalHeader';
import { CustomModalBody } from '@/components/modal/legacy/CustomModalBody';
import { CustomModalFooter } from '@/components/modal/legacy/CustomModalFooter';

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
      console.error('Error creating group:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModalLayout
      open={open}
      onClose={handleClose}
      content={{
        header: (
          <CustomModalHeader
            title="Crear Grupo de Opciones"
            description={`Crear un nuevo grupo para el parámetro "${parameterLabel}"`}
            onClose={handleClose}
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
                      <FormLabel>Nombre del Grupo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: marcas-premium" {...field} />
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
                      <FormLabel>Etiqueta del Grupo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Marcas Premium" {...field} />
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
          <CustomModalFooter
            onCancel={handleClose}
            onSubmit={form.handleSubmit(onSubmit)}
            saveText={createMutation.isPending ? "Creando..." : "Crear Grupo"}
            disabled={createMutation.isPending}
          />
        ),
      }}
    />
  );
}