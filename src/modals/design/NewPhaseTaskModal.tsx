import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganizationMembers, type OrganizationMember } from '@/hooks/use-organization-members';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const newPhaseTaskSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  created_by: z.string().min(1, 'Selecciona el creador'),
  assigned_to: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().min(1, 'Selecciona el estado'),
  priority: z.string().min(1, 'Selecciona la prioridad'),
});

type NewPhaseTaskFormData = z.infer<typeof newPhaseTaskSchema>;

interface NewPhaseTaskModalProps {
  open: boolean;
  onClose: () => void;
  projectPhaseId: string;
}

export function NewPhaseTaskModal({ open, onClose, projectPhaseId }: NewPhaseTaskModalProps) {
  const { data: userData } = useCurrentUser();
  const { data: organizationMembers = [] } = useOrganizationMembers(userData?.organization?.id || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NewPhaseTaskFormData>({
    resolver: zodResolver(newPhaseTaskSchema),
    defaultValues: {
      name: '',
      description: '',
      created_by: '',
      assigned_to: '',
      start_date: '',
      end_date: '',
      status: 'pending',
      priority: 'medium',
    },
  });

  // Set default creator when user data loads
  useEffect(() => {
    if (userData?.user?.id) {
      form.setValue('created_by', userData.user.id);
    }
  }, [userData, form]);

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: NewPhaseTaskFormData) => {
      const response = await fetch('/api/design-phase-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          project_phase_id: projectPhaseId,
          assigned_to: taskData.assigned_to || null,
          start_date: taskData.start_date || null,
          end_date: taskData.end_date || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear la tarea');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tarea creada",
        description: "La tarea ha sido creada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['design-project-phases'] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la tarea. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error creating task:', error);
    },
  });

  const onSubmit = (data: NewPhaseTaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader 
            title="Nueva Tarea de Fase"
            description="Crear una nueva tarea dentro de la fase de diseño"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Creator Field */}
              <div className="space-y-2">
                <Label htmlFor="created_by" className="required">
                  Creador
                </Label>
                <Select 
                  value={form.watch('created_by')} 
                  onValueChange={(value) => form.setValue('created_by', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar creador" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationMembers.map((member: OrganizationMember) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.user?.full_name || member.user?.email || 'Sin nombre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.created_by && (
                  <p className="text-sm text-destructive">{form.formState.errors.created_by.message}</p>
                )}
              </div>

              {/* Assigned To Field */}
              <div className="space-y-2">
                <Label htmlFor="assigned_to">
                  Asignada a
                </Label>
                <Select 
                  value={form.watch('assigned_to')} 
                  onValueChange={(value) => form.setValue('assigned_to', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar asignado (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {organizationMembers.map((member: OrganizationMember) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.user?.full_name || member.user?.email || 'Sin nombre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Task Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="required">
                  Nombre de la Tarea
                </Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ingresa el nombre de la tarea"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Descripción de la tarea (opcional)"
                  rows={3}
                />
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">
                    Fecha de Inicio
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...form.register('start_date')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">
                    Fecha de Fin
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    {...form.register('end_date')}
                  />
                </div>
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="required">
                    Estado
                  </Label>
                  <Select 
                    value={form.watch('status')} 
                    onValueChange={(value) => form.setValue('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="on_hold">En Pausa</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && (
                    <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="required">
                    Prioridad
                  </Label>
                  <Select 
                    value={form.watch('priority')} 
                    onValueChange={(value) => form.setValue('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.priority && (
                    <p className="text-sm text-destructive">{form.formState.errors.priority.message}</p>
                  )}
                </div>
              </div>
            </form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={form.handleSubmit(onSubmit)}
            isLoading={createTaskMutation.isPending}
            saveText="Crear Tarea"
          />
        ),
      }}
    </CustomModalLayout>
  );
}