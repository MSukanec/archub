import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { useCreateDesignPhase, useUpdateDesignPhase, type DesignPhase, type CreateDesignPhaseData } from '@/hooks/use-design-phases';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const designPhaseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
});

type DesignPhaseFormData = z.infer<typeof designPhaseSchema>;

interface DesignPhaseModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  editingPhase?: DesignPhase;
}

export function DesignPhaseModal({ open, onClose, projectId, editingPhase }: DesignPhaseModalProps) {
  const createMutation = useCreateDesignPhase();
  const updateMutation = useUpdateDesignPhase();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<DesignPhaseFormData>({
    resolver: zodResolver(designPhaseSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  // Reset form when modal opens/closes or when editing item changes
  useEffect(() => {
    if (open && editingPhase) {
      reset({
        name: editingPhase.name,
        description: editingPhase.description || '',
      });
    } else if (open) {
      reset({
        name: '',
        description: '',
      });
    }
  }, [open, editingPhase, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: DesignPhaseFormData) => {
    try {
      if (editingPhase) {
        await updateMutation.mutateAsync({
          id: editingPhase.id,
          project_id: projectId,
          ...data,
        });
        toast({
          title: "Éxito",
          description: "Fase de diseño actualizada correctamente",
        });
      } else {
        await createMutation.mutateAsync({
          project_id: projectId,
          ...data,
        });
        toast({
          title: "Éxito",
          description: "Fase de diseño creada correctamente",
        });
      }
      handleClose();
    } catch (error) {
      console.error('Error saving design phase:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la fase de diseño",
        variant: "destructive",
      });
    }
  };

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingPhase ? "Editar Fase de Diseño" : "Nueva Fase de Diseño"}
            onClose={handleClose}
          />
        ),
        body: (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CustomModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name field - full width */}
                <div className="col-span-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Ej: Anteproyecto, Proyecto Ejecutivo..."
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Description field - full width */}
                <div className="col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Descripción de la fase de diseño..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </CustomModalBody>
            
            <CustomModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit(onSubmit)}
              saveLoading={isSubmitting}
              submitText={editingPhase ? "Actualizar" : "Crear"}
            />
          </form>
        ),
      }}
    </CustomModalLayout>
  );
}