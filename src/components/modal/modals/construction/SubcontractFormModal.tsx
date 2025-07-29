import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

import { Package } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateSubcontract } from "@/hooks/use-subcontracts";
import { useContacts } from "@/hooks/use-contacts";
import { useConstructionTasks } from "@/hooks/use-construction-tasks";
import { useOrganizationCurrencies } from "@/hooks/use-organization-currencies";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormSubsectionButton } from '@/components/modal/form/FormSubsectionButton';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

const subcontractSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  contact_id: z.string().min(1, "Debe seleccionar un proveedor"),
  status: z.string().min(1, "Debe seleccionar un estado"),
  currency_id: z.string().min(1, "Debe seleccionar una moneda"),
  amount_total: z.number().min(0, "El monto debe ser mayor o igual a 0").optional(),
  notes: z.string().optional(),
});

type SubcontractFormData = z.infer<typeof subcontractSchema>;

interface SelectedTask {
  task_id: string;
  quantity: number;
}

interface SubcontractFormModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
  };
}

export function SubcontractFormModal({ modalData }: SubcontractFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const { closeModal } = useGlobalModalStore();
  const { currentSubform, setCurrentSubform, setPanel } = useModalPanelStore();

  const { data: userData } = useCurrentUser();
  const createSubcontract = useCreateSubcontract();
  
  // Obtener contactos/proveedores
  const { data: contacts = [] } = useContacts(modalData.organizationId || '');
  
  // Obtener todas las tareas del proyecto
  const { data: projectTasks = [] } = useConstructionTasks(modalData.projectId || '');
  
  // Obtener monedas de la organización
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(modalData.organizationId || '');

  const form = useForm<SubcontractFormData>({
    resolver: zodResolver(subcontractSchema),
    defaultValues: {
      title: '',
      contact_id: '',
      status: 'pendiente',
      currency_id: '',
      amount_total: 0,
      notes: '',
    }
  });

  // Función para manejar selección/deselección de tareas
  const handleTaskSelection = (taskId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTasks(prev => [...prev, { task_id: taskId, quantity: 1 }]);
    } else {
      setSelectedTasks(prev => prev.filter(t => t.task_id !== taskId));
    }
  };

  // Función para actualizar cantidad de una tarea seleccionada
  const handleQuantityChange = (taskId: string, quantity: number) => {
    setSelectedTasks(prev => 
      prev.map(t => t.task_id === taskId ? { ...t, quantity } : t)
    );
  };

  // Verificar si una tarea está seleccionada
  const isTaskSelected = (taskId: string) => {
    return selectedTasks.some(t => t.task_id === taskId);
  };

  // Obtener cantidad seleccionada de una tarea
  const getSelectedQuantity = (taskId: string) => {
    const selectedTask = selectedTasks.find(t => t.task_id === taskId);
    return selectedTask?.quantity || 1;
  };

  const onSubmit = async (data: SubcontractFormData) => {
    if (selectedTasks.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos una tarea",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createSubcontract.mutateAsync({
        project_id: modalData.projectId,
        organization_id: modalData.organizationId,
        contact_id: data.contact_id,
        title: data.title,
        amount_total: data.amount_total || 0,
        notes: data.notes || null,
        status: data.status,
        task_ids: selectedTasks.map(t => t.task_id)
      });

      toast({
        title: "Subcontrato creado",
        description: "El pedido de subcontrato se creó correctamente",
      });
      
      closeModal();

    } catch (error) {
      console.error('Error creando subcontrato:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el subcontrato",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Panel de vista (no se usa, pero requerido por la arquitectura)
  const viewPanel = (
    <div className="space-y-4">
      <p>Vista no implementada</p>
    </div>
  );

  // Panel principal para edición
  const editPanel = (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title" className="text-xs font-medium">
          Título *
        </Label>
        <Input
          id="title"
          placeholder="Ej: Trabajos de albañilería"
          {...form.register('title')}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="contact_id" className="text-xs font-medium">
            Proveedor *
          </Label>
          <Select
            value={form.watch('contact_id') || ''}
            onValueChange={(value) => form.setValue('contact_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proveedor..." />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.contact_id && (
            <p className="text-xs text-destructive">{form.formState.errors.contact_id.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="status" className="text-xs font-medium">
            Estado *
          </Label>
          <Select
            value={form.watch('status') || 'pendiente'}
            onValueChange={(value) => form.setValue('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="en_proceso">En Proceso</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.status && (
            <p className="text-xs text-destructive">{form.formState.errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="amount_total" className="text-xs font-medium">
          Monto Total
        </Label>
        <Input
          id="amount_total"
          type="number"
          step="0.01"
          placeholder="0"
          {...form.register('amount_total', { valueAsNumber: true })}
        />
        {form.formState.errors.amount_total && (
          <p className="text-xs text-destructive">{form.formState.errors.amount_total.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes" className="text-xs font-medium">
          Notas
        </Label>
        <Textarea
          id="notes"
          placeholder="Notas adicionales del subcontrato..."
          {...form.register('notes')}
          className="min-h-[120px] resize-none"
        />
      </div>

      {/* Sección de Tareas del Subcontrato */}
      <FormSubsectionButton
        icon={<Package />}
        title="Tareas del Subcontrato"
        description={selectedTasks.length > 0 ? `${selectedTasks.length} tarea${selectedTasks.length !== 1 ? 's' : ''} seleccionada${selectedTasks.length !== 1 ? 's' : ''}` : "Selecciona las tareas que incluirá este subcontrato"}
        onClick={() => {
          setCurrentSubform('tasks');
          setPanel('subform');
        }}
      />
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title="Crear Pedido de Subcontrato"
      subtitle="Vincula tareas del proyecto con un subcontratista"
      icon={Package}
    />
  );

  const footerContent = currentSubform === 'tasks' ? (
    <FormModalFooter
      leftLabel="Volver"
      onLeftClick={() => {
        setCurrentSubform(null);
        setPanel('edit');
      }}
      rightLabel={`Agregar ${selectedTasks.length} Tarea${selectedTasks.length !== 1 ? 's' : ''}`}
      onRightClick={() => {
        setCurrentSubform(null);
        setPanel('edit');
      }}
      showLoadingSpinner={false}
      submitDisabled={selectedTasks.length === 0}
    />
  ) : (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={closeModal}
      rightLabel="Crear Subcontrato"
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={isSubmitting}
      submitDisabled={!form.formState.isValid || selectedTasks.length === 0 || isSubmitting}
    />
  );

  // Subform para selección de tareas
  const getSubform = () => {
    if (currentSubform === 'tasks') {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
              <Package className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Seleccionar Tareas del Proyecto</h3>
              <p className="text-xs text-muted-foreground">Elige las tareas que incluirá este subcontrato</p>
            </div>
          </div>

          {/* Header de la tabla */}
          <div className="grid grid-cols-12 gap-2 py-3 px-4 bg-muted/50 font-medium text-xs border-b rounded-t-lg border">
            <div className="col-span-1 text-xs font-medium"></div>
            <div className="col-span-8 text-xs font-medium">Tarea</div>
            <div className="col-span-3 text-xs font-medium">Cantidad</div>
          </div>

          {/* Lista de tareas */}
          <div className="border border-t-0 rounded-b-lg">
            <ScrollArea className="h-[400px]">
              <div className="divide-y">
                {projectTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay tareas disponibles en este proyecto
                  </div>
                ) : (
                  projectTasks.map((task) => {
                    const isSelected = isTaskSelected(task.task_id || '');
                    const selectedQuantity = getSelectedQuantity(task.task_id || '');
                    
                    return (
                      <div key={task.id} className="grid grid-cols-12 gap-2 py-3 px-4 hover:bg-muted/30">
                        {/* Checkbox */}
                        <div className="col-span-1 flex items-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleTaskSelection(task.task_id || '', checked === true)
                            }
                          />
                        </div>

                        {/* Información de la tarea */}
                        <div className="col-span-8">
                          <div className="text-sm leading-tight line-clamp-2">
                            {task.name_rendered || 'Tarea sin nombre'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span className="font-bold">{task.category_name || 'Sin rubro'}</span>
                            <span>•</span>
                            <span>{task.unit_name || 'UN'}</span>
                            <span>•</span>
                            <span className="text-accent font-medium">
                              Total: {task.quantity || 0}
                            </span>
                          </div>
                        </div>

                        {/* Input de cantidad */}
                        <div className="col-span-3">
                          {isSelected && (
                            <Input
                              type="number"
                              value={selectedQuantity}
                              onChange={(e) => {
                                const newQuantity = parseFloat(e.target.value) || 1;
                                handleQuantityChange(task.task_id || '', newQuantity);
                              }}
                              className="h-8 text-xs"
                              min="0.01"
                              max={task.quantity || 999999}
                              step="0.01"
                              placeholder="Cantidad"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      subformPanel={getSubform()}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true}
    />
  );
}