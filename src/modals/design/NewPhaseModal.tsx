import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import { useDesignPhases, useCreateDesignProjectPhase } from '@/hooks/use-design-phases';

const newPhaseSchema = z.object({
  design_phase_id: z.string().min(1, 'Selecciona una fase de diseño'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type NewPhaseFormData = z.infer<typeof newPhaseSchema>;

interface NewPhaseModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  organizationId: string;
  nextPosition: number;
}

export function NewPhaseModal({
  open,
  onClose,
  projectId,
  organizationId,
  nextPosition
}: NewPhaseModalProps) {
  const { data: designPhases = [] } = useDesignPhases();
  const createPhaseMutation = useCreateDesignProjectPhase();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<NewPhaseFormData>({
    resolver: zodResolver(newPhaseSchema),
  });

  const selectedPhaseId = watch('design_phase_id');
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  useEffect(() => {
    if (open) {
      reset({
        design_phase_id: '',
        start_date: '',
        end_date: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: NewPhaseFormData) => {
    if (!projectId || !organizationId) return;

    try {
      await createPhaseMutation.mutateAsync({
        organization_id: organizationId,
        project_id: projectId,
        design_phase_id: data.design_phase_id,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      });
      
      handleClose();
    } catch (error) {
      console.error('Error creating phase:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <CustomModalLayout
      open={open}
      onClose={handleClose}
      children={{
        header: (
          <CustomModalHeader
            title="Nueva Fase de Diseño"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody>
            <form id="phase-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fase de diseño */}
                <div className="col-span-2">
                  <Label className="text-xs font-medium mb-1 block">
                    Fase de Diseño *
                  </Label>
                  <Select
                    value={selectedPhaseId || ''}
                    onValueChange={(value) => setValue('design_phase_id', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar fase de diseño" />
                    </SelectTrigger>
                    <SelectContent>
                      {designPhases.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.design_phase_id && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.design_phase_id.message}
                    </p>
                  )}
                </div>

                {/* Fecha de inicio */}
                <div className="col-span-1">
                  <Label className="text-xs font-medium mb-1 block">
                    Fecha de Inicio
                  </Label>
                  <Input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => setValue('start_date', e.target.value)}
                    placeholder="Seleccionar fecha"
                  />
                </div>

                {/* Fecha de fin */}
                <div className="col-span-1">
                  <Label className="text-xs font-medium mb-1 block">
                    Fecha de Fin
                  </Label>
                  <Input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => setValue('end_date', e.target.value)}
                    placeholder="Seleccionar fecha"
                  />
                </div>
              </div>
            </form>
          </CustomModalBody>
        ),
        footer: (
          <div className="p-2 border-t border-[var(--card-border)] mt-auto">
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                className="w-1/4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="phase-form"
                className="w-3/4"
                disabled={isSubmitting || createPhaseMutation.isPending}
              >
                {(isSubmitting || createPhaseMutation.isPending) ? 'Guardando...' : "Agregar Fase"}
              </Button>
            </div>
          </div>
        )
      }}
    />
  );
}