import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { useCreateDesignTask, useUpdateDesignTask, type DesignTask, type CreateDesignTaskData } from '@/hooks/use-design-tasks';
import { useContacts } from '@/hooks/use-contacts';
import { useCurrentUser } from '@/hooks/use-current-user';
import { CustomModal } from '@/components/ui-custom/layout/CustomModal';
import { CustomModalBody } from '@/components/ui-custom/layout/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/layout/CustomModalFooter';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type DesignPhase } from '@/hooks/use-design-phases';

const designTaskSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  design_phase_id: z.string().min(1, 'La fase es requerida'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  assigned_to: z.string().optional(),
});

type DesignTaskFormData = z.infer<typeof designTaskSchema>;

interface DesignTaskModalProps {
  open: boolean;
  onClose: () => void;
  phases: DesignPhase[];
  editingTask?: DesignTask;
}

export function DesignTaskModal({ open, onClose, phases, editingTask }: DesignTaskModalProps) {
  const { data: userData } = useCurrentUser();
  const { data: contacts } = useContacts(userData?.organization?.id);
  const createMutation = useCreateDesignTask();
  const updateMutation = useUpdateDesignTask();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<DesignTaskFormData>({
    resolver: zodResolver(designTaskSchema),
    defaultValues: {
      name: '',
      description: '',
      design_phase_id: '',
      start_date: '',
      end_date: '',
      status: 'pending',
      assigned_to: '',
    }
  });

  // Reset form when modal opens/closes or when editing item changes
  useEffect(() => {
    if (open && editingTask) {
      reset({
        name: editingTask.name,
        description: editingTask.description || '',
        design_phase_id: editingTask.design_phase_id,
        start_date: editingTask.start_date || '',
        end_date: editingTask.end_date || '',
        status: editingTask.status,
        assigned_to: editingTask.assigned_to || '',
      });
    } else if (open) {
      reset({
        name: '',
        description: '',
        design_phase_id: phases.length > 0 ? phases[0].id : '',
        start_date: '',
        end_date: '',
        status: 'pending',
        assigned_to: '',
      });
    }
  }, [open, editingTask, phases, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: DesignTaskFormData) => {
    try {
      const taskData = {
        ...data,
        assigned_to: data.assigned_to || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      };

      if (editingTask) {
        await updateMutation.mutateAsync({
          id: editingTask.id,
          ...taskData,
        });
        toast({
          title: "Éxito",
          description: "Tarea de diseño actualizada correctamente",
        });
      } else {
        await createMutation.mutateAsync(taskData);
        toast({
          title: "Éxito",
          description: "Tarea de diseño creada correctamente",
        });
      }
      handleClose();
    } catch (error) {
      console.error('Error saving design task:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea de diseño",
        variant: "destructive",
      });
    }
  };

  return (
    <CustomModal
      title={editingTask ? "Editar Tarea de Diseño" : "Nueva Tarea de Diseño"}
      open={open}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <CustomModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name field - full width */}
            <div className="col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ej: Relevamiento del terreno, Diseño conceptual..."
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Phase selection - half width */}
            <div className="col-span-1">
              <Label htmlFor="design_phase_id">Fase *</Label>
              <Select
                value={watch('design_phase_id')}
                onValueChange={(value) => setValue('design_phase_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar fase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.design_phase_id && (
                <p className="text-sm text-destructive mt-1">{errors.design_phase_id.message}</p>
              )}
            </div>

            {/* Status selection - half width */}
            <div className="col-span-1">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as 'pending' | 'in_progress' | 'completed')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive mt-1">{errors.status.message}</p>
              )}
            </div>

            {/* Start date - half width */}
            <div className="col-span-1">
              <Label htmlFor="start_date">Fecha de Inicio</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive mt-1">{errors.start_date.message}</p>
              )}
            </div>

            {/* End date - half width */}
            <div className="col-span-1">
              <Label htmlFor="end_date">Fecha de Fin</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive mt-1">{errors.end_date.message}</p>
              )}
            </div>

            {/* Assigned to - full width */}
            <div className="col-span-2">
              <Label htmlFor="assigned_to">Asignado a</Label>
              <Select
                value={watch('assigned_to')}
                onValueChange={(value) => setValue('assigned_to', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar contacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assigned_to && (
                <p className="text-sm text-destructive mt-1">{errors.assigned_to.message}</p>
              )}
            </div>

            {/* Description field - full width */}
            <div className="col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Descripción de la tarea de diseño..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>
        </CustomModalBody>

        <CustomModalFooter
          onClose={handleClose}
          isSubmitting={isSubmitting}
        />
      </form>
    </CustomModal>
  );
}