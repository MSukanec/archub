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
        position: nextPosition,
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
    <CustomModal
      title="Nueva Fase de Diseño"
      open={open}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <CustomModalBody>
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
              <DatePicker
                value={startDate}
                onChange={(date) => setValue('start_date', date || '')}
                placeholder="Seleccionar fecha"
              />
            </div>

            {/* Fecha de fin */}
            <div className="col-span-1">
              <Label className="text-xs font-medium mb-1 block">
                Fecha de Fin
              </Label>
              <DatePicker
                value={endDate}
                onChange={(date) => setValue('end_date', date || '')}
                placeholder="Seleccionar fecha"
              />
            </div>
          </div>
        </CustomModalBody>

        <CustomModalFooter
          onClose={handleClose}
          isSubmitting={isSubmitting || createPhaseMutation.isPending}
        />
      </form>
    </CustomModal>
  );
}