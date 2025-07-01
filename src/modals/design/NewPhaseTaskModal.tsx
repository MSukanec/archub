import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useToast } from '@/hooks/use-toast';

const phaseTaskSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  created_by: z.string().min(1, 'El creador es requerido'),
});

type PhaseTaskFormData = z.infer<typeof phaseTaskSchema>;

interface NewPhaseTaskModalProps {
  open: boolean;
  onClose: () => void;
  projectPhaseId: string;
}

export function NewPhaseTaskModal({ open, onClose, projectPhaseId }: NewPhaseTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId || '');

  // Find current user member ID
  const currentUserMember = organizationMembers.find(member => member.user_id === userData?.user?.id);

  const form = useForm<PhaseTaskFormData>({
    resolver: zodResolver(phaseTaskSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      assigned_to: '',
      status: 'pendiente',
      priority: 'media',
      created_by: currentUserMember?.id || '',
    },
  });

  // Update created_by when currentUserMember is available
  if (currentUserMember?.id && form.getValues('created_by') !== currentUserMember.id) {
    form.setValue('created_by', currentUserMember.id);
  }

  const onSubmit = async (data: PhaseTaskFormData) => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      const taskData = {
        project_phase_id: projectPhaseId,
        name: data.name,
        description: data.description || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        assigned_to: data.assigned_to || null,
        status: data.status || 'pendiente',
        priority: data.priority || 'media',
        position: 0, // Will be handled by backend
        is_active: true,
        created_by: data.created_by,
      };

      const response = await fetch('/api/design-phase-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Error al crear la tarea');
      }

      toast({
        title: 'Tarea creada',
        description: 'La tarea ha sido creada exitosamente.',
      });

      form.reset();
      onClose();
    } catch (error) {
      console.error('Error creating phase task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la tarea. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CustomModalHeader 
          title="Nueva Tarea de Fase"
          description="Crear una nueva tarea dentro de la fase de diseño"
          onClose={onClose}
        />
        
        <CustomModalBody padding="md">
          <div className="space-y-4">
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
                  {organizationMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs">
                          {member.users?.full_name?.charAt(0) || member.users?.email?.charAt(0) || '?'}
                        </div>
                        {member.users?.full_name || member.users?.email || 'Sin nombre'}
                      </div>
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
                  {organizationMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs">
                          {member.users?.full_name?.charAt(0) || member.users?.email?.charAt(0) || '?'}
                        </div>
                        {member.users?.full_name || member.users?.email || 'Sin nombre'}
                      </div>
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
                placeholder="Descripción opcional de la tarea"
                rows={3}
              />
            </div>

            {/* Date Range */}
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
                <Label htmlFor="status">
                  Estado
                </Label>
                <Select 
                  value={form.watch('status')} 
                  onValueChange={(value) => form.setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">
                  Prioridad
                </Label>
                <Select 
                  value={form.watch('priority')} 
                  onValueChange={(value) => form.setValue('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CustomModalBody>

        <CustomModalFooter 
          onClose={onClose}
          onSubmit={form.handleSubmit(onSubmit)}
          isLoading={isLoading}
          submitText="Crear Tarea"
        />
      </form>
    </CustomModalLayout>
  );
}