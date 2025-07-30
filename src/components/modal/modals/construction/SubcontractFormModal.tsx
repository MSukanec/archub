import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

import { Package } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateSubcontract, useUpdateSubcontract, useSubcontract } from "@/hooks/use-subcontracts";
import { useContacts } from "@/hooks/use-contacts";
import UserSelector from "@/components/ui-custom/UserSelector";
import { useConstructionTasks } from "@/hooks/use-construction-tasks";
import { useOrganizationCurrencies } from "@/hooks/use-currencies";
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
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore';
import DatePicker from '@/components/ui-custom/DatePicker';

const subcontractSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  title: z.string().min(1, "El título es obligatorio"),
  contact_id: z.string().min(1, "Debe seleccionar un proveedor"),
  currency_id: z.string().min(1, "Debe seleccionar una moneda"),
  amount_total: z.number().min(0, "El monto debe ser mayor o igual a 0").optional(),
  exchange_rate: z.number().min(0, "La cotización debe ser mayor a 0"),
  status: z.string().min(1, "Debe seleccionar un estado"),
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
    subcontractId?: string;
    isEditing?: boolean;
  };
}

export function SubcontractFormModal({ modalData }: SubcontractFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const { closeModal } = useGlobalModalStore();
  const { currentSubform, setCurrentSubform, setPanel } = useModalPanelStore();

  const { data: userData } = useCurrentUser();
  const createSubcontract = useCreateSubcontract();
  const updateSubcontract = useUpdateSubcontract();
  
  // Datos del subcontrato existente si se está editando
  const { data: existingSubcontract } = useSubcontract(modalData.subcontractId || null);
  
  // Obtener contactos/proveedores
  const { data: contacts = [] } = useContacts();
  
  // Debug logging para contactos
  React.useEffect(() => {
    console.log('Subcontract Modal - Contacts data:', contacts);
    console.log('Subcontract Modal - Contacts length:', contacts.length);
  }, [contacts]);
  
  // Obtener todas las tareas del proyecto
  const { data: projectTasks = [] } = useConstructionTasks(modalData.projectId, modalData.organizationId);
  
  // Obtener monedas de la organización
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(modalData.organizationId);

  // Debug logging para monedas
  React.useEffect(() => {
    console.log('Organization currencies available:', organizationCurrencies);
    console.log('Organization currencies count:', organizationCurrencies.length);
    if (organizationCurrencies.length > 0) {
      console.log('First currency:', organizationCurrencies[0]);
      console.log('Default currency found:', organizationCurrencies.find(oc => oc.is_default));
    }
  }, [organizationCurrencies]);

  // Determinar moneda por defecto - usar el ID de organization_currencies, no currency.id
  const defaultCurrency = organizationCurrencies.find(oc => oc.is_default)?.id || organizationCurrencies[0]?.id || '';
  console.log('Default currency selected:', defaultCurrency);

  const form = useForm<SubcontractFormData>({
    resolver: zodResolver(subcontractSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      title: '',
      contact_id: '',
      currency_id: defaultCurrency,
      amount_total: 0,
      exchange_rate: 1,
      status: 'pendiente',
      notes: '',
    }
  });

  // Actualizar la moneda por defecto cuando se carga
  React.useEffect(() => {
    if (defaultCurrency && !form.watch('currency_id')) {
      form.setValue('currency_id', defaultCurrency);
    }
  }, [defaultCurrency, form]);

  // Cargar datos del subcontrato existente si se está editando
  React.useEffect(() => {
    if (existingSubcontract && modalData.isEditing) {
      form.reset({
        date: existingSubcontract.date,
        title: existingSubcontract.title,
        contact_id: existingSubcontract.contact_id,
        currency_id: existingSubcontract.currency_id,
        amount_total: existingSubcontract.amount_total || 0,
        exchange_rate: existingSubcontract.exchange_rate || 1,
        status: existingSubcontract.status,
        notes: existingSubcontract.notes || '',
      });
    }
  }, [existingSubcontract, modalData.isEditing, form]);

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
    console.log('Form submission attempt:', data);
    console.log('Form errors:', form.formState.errors);
    console.log('Form is valid:', form.formState.isValid);
    console.log('Selected tasks:', selectedTasks);
    console.log('Is editing mode:', modalData.isEditing);
    
    setIsSubmitting(true);

    try {
      const taskIds = selectedTasks.map(t => t.task_id);
      
      if (modalData.isEditing && modalData.subcontractId) {
        // Modo edición - actualizar subcontrato existente
        await updateSubcontract.mutateAsync({
          subcontractId: modalData.subcontractId,
          subcontract: {
            date: data.date,
            contact_id: data.contact_id,
            title: data.title,
            currency_id: data.currency_id,
            amount_total: data.amount_total || 0,
            exchange_rate: data.exchange_rate,
            status: data.status,
            notes: data.notes || null
          },
          taskIds
        });
      } else {
        // Modo creación - crear nuevo subcontrato
        await createSubcontract.mutateAsync({
          subcontract: {
            project_id: modalData.projectId,
            organization_id: modalData.organizationId,
            date: data.date,
            contact_id: data.contact_id,
            title: data.title,
            currency_id: data.currency_id,
            amount_total: data.amount_total || 0,
            exchange_rate: data.exchange_rate,
            status: data.status,
            notes: data.notes || null
          },
          taskIds
        });
      }
      
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
      {/* Fecha - Campo individual arriba */}
      <div className="space-y-1">
        <Label htmlFor="date" className="text-xs font-medium">
          Fecha *
        </Label>
        <DatePicker
          value={form.watch('date') ? new Date(form.watch('date')) : undefined}
          onChange={(date) => {
            if (date) {
              form.setValue('date', date.toISOString().split('T')[0]);
            }
          }}
          placeholder="Seleccionar fecha..."
        />
        {form.formState.errors.date && (
          <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
        )}
      </div>

      {/* Título - Proveedor */}
      <div className="grid grid-cols-2 gap-4">
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

        <div className="space-y-1">
          <Label htmlFor="contact_id" className="text-xs font-medium">
            Proveedor *
          </Label>
          <UserSelector
            users={contacts.map(contact => ({
              id: contact.id,
              full_name: contact.full_name || `${contact.first_name} ${contact.last_name}`.trim() || 'Sin nombre',
              avatar_url: undefined
            }))}
            value={form.watch('contact_id') || ''}
            onChange={(value) => form.setValue('contact_id', value)}
            placeholder="Seleccionar proveedor..."
            className="w-full"
          />
          {form.formState.errors.contact_id && (
            <p className="text-xs text-destructive">{form.formState.errors.contact_id.message}</p>
          )}
        </div>
      </div>

      {/* Moneda - Monto Total */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="currency_id" className="text-xs font-medium">
            Moneda *
          </Label>
          <Select
            value={form.watch('currency_id') || ''}
            onValueChange={(value) => form.setValue('currency_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar moneda..." />
            </SelectTrigger>
            <SelectContent>
              {organizationCurrencies.map((orgCurrency) => (
                <SelectItem key={orgCurrency.id} value={orgCurrency.id}>
                  {orgCurrency.currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.currency_id && (
            <p className="text-xs text-destructive">{form.formState.errors.currency_id.message}</p>
          )}
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
      </div>

      {/* Cotización - Estado */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="exchange_rate" className="text-xs font-medium">
            Cotización *
          </Label>
          <Input
            id="exchange_rate"
            type="number"
            step="0.0001"
            placeholder="1.0000"
            {...form.register('exchange_rate', { valueAsNumber: true })}
          />
          {form.formState.errors.exchange_rate && (
            <p className="text-xs text-destructive">{form.formState.errors.exchange_rate.message}</p>
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
              <SelectItem value="en_progreso">En Progreso</SelectItem>
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
      title={modalData.isEditing ? "Editar Subcontrato" : "Crear Pedido de Subcontrato"}
      description="Vincula tareas del proyecto con un subcontratista"
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
      rightLabel={modalData.isEditing ? "Actualizar Subcontrato" : "Crear Subcontrato"}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={isSubmitting}
      submitDisabled={!form.formState.isValid || isSubmitting}
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
                            {task.task?.display_name || 'Tarea sin nombre'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span className="font-bold">{task.task?.category_name || 'Sin rubro'}</span>
                            <span>•</span>
                            <span>{task.task?.unit_name || 'UN'}</span>
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
      onClose={closeModal}
    />
  );
}