import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Calendar, User, FileText, MessageSquare, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { useCreateDesignTask } from '@/hooks/use-design-tasks';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useContacts } from '@/hooks/use-contacts';
import { useToast } from '@/hooks/use-toast';

interface DesignPhase {
  id: string;
  name: string;
  description: string | null;
}

interface NewDesignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  phases: DesignPhase[];
}

const taskFormSchema = z.object({
  design_phase_id: z.string().min(1, 'Selecciona una fase'),
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  assigned_to: z.string().optional()
});

type TaskFormData = z.infer<typeof taskFormSchema>;

export function NewDesignTaskModal({ isOpen, onClose, phases }: NewDesignTaskModalProps) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;
  const { data: contacts = [] } = useContacts(organizationId);
  
  const createTaskMutation = useCreateDesignTask();
  const { toast } = useToast();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      design_phase_id: '',
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'pending',
      assigned_to: ''
    }
  });

  const handleSave = async (data: TaskFormData) => {
    try {
      const taskData = {
        design_phase_id: data.design_phase_id,
        name: data.name,
        description: data.description || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        status: data.status,
        assigned_to: data.assigned_to || undefined
      };

      await createTaskMutation.mutateAsync(taskData);
      
      toast({
        title: 'Tarea creada',
        description: 'La tarea de diseño se creó correctamente.',
      });
      
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error creating design task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la tarea. Intenta nuevamente.',
        variant: 'destructive'
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <CustomModalLayout
      open={isOpen}
      onClose={handleClose}
    >
      {{
        header: (
          <CustomModalHeader
            title="Nueva Tarea de Diseño"
            description="Crea una nueva tarea dentro de una fase de diseño"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)}>
                <div className="space-y-6">
              {/* Phase Selection */}
              <FormField
                control={form.control}
                name="design_phase_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required-asterisk">Fase de Diseño</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una fase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {phases.map((phase) => (
                          <SelectItem key={phase.id} value={phase.id}>
                            {phase.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Task Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required-asterisk">Nombre de la Tarea</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Relevamiento del terreno"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe los detalles de la tarea..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Finalización</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Por hacer</SelectItem>
                        <SelectItem value="in_progress">En progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assigned To */}
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar a</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un responsable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin asignar</SelectItem>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.full_name || contact.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </div>
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={form.handleSubmit(handleSave)}
            disabled={createTaskMutation.isPending}
            saveText={createTaskMutation.isPending ? 'Creando...' : 'Crear Tarea'}
          />
        )
      }}
    </CustomModalLayout>
  );
}