import React, { useState, useEffect } from 'react';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField';
import DatePickerField from '@/components/ui-custom/fields/DatePickerField';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, FileText, CheckSquare, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { useContacts } from '@/hooks/use-contacts';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrencies } from '@/hooks/use-currencies';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useSubcontractTasks } from '@/hooks/use-subcontract-tasks';
import { FormSubsectionButton } from '@/components/modal/form/FormSubsectionButton';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';



const bidFormSchema = z.object({
  contact_id: z.string().min(1, 'El proveedor es requerido'),
  amount: z.string().min(1, 'El monto es requerido'),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  exchange_rate: z.string().optional(),
  submitted_at: z.date().optional(),
  notes: z.string().optional()
});

type BidFormData = z.infer<typeof bidFormSchema>;

interface SubcontractBidFormModalProps {
  modalData?: any;
  onClose: () => void;
}

export function SubcontractBidFormModal({
  modalData,
  onClose
}: SubcontractBidFormModalProps) {
  // Extraer datos de modalData
  const subcontract_id = modalData?.subcontractId;
  const bid_id = modalData?.bidId;
  const mode = modalData?.isEditing ? 'edit' : 'create';
  const initialData = modalData?.initialData;
  const onSuccess = modalData?.onSuccess;
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  // Estado local para manejar paneles del modal
  const [currentPanel, setCurrentPanel] = useState<'edit' | 'subform'>('edit');
  const [currentSubform, setCurrentSubform] = useState<string | null>(null);
  
  // Obtener miembros de la organización para el created_by
  const { data: members } = useOrganizationMembers(userData?.organization?.id);
  const { data: contacts, isLoading: isContactsLoading } = useContacts();
  const { data: currencies, isLoading: isCurrenciesLoading } = useCurrencies();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Obtener tareas del subcontrato
  const { subcontractTasks } = useSubcontractTasks(subcontract_id || '');
  
  // Estado para las tareas seleccionadas y precios
  const [selectedTasks, setSelectedTasks] = useState<{[key: string]: boolean}>({});
  const [taskPrices, setTaskPrices] = useState<{[key: string]: number}>({});

  const form = useForm<BidFormData>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      contact_id: initialData?.contact_id || '',
      amount: initialData?.amount?.toString() || '',
      currency_id: initialData?.currency_id || userData?.organization_preferences?.default_currency || '',
      exchange_rate: initialData?.exchange_rate?.toString() || '',
      submitted_at: initialData?.submitted_at ? new Date(initialData.submitted_at) : (mode === 'create' ? new Date() : undefined),
      notes: initialData?.notes || ''
    }
  });

  // Efecto para establecer valores por defecto cuando los datos estén disponibles (modo crear)
  useEffect(() => {
    if (mode === 'create' && !initialData && userData?.organization_preferences?.default_currency) {
      // Solo establecer si no hay un valor ya
      if (!form.watch('currency_id')) {
        form.setValue('currency_id', userData.organization_preferences.default_currency);
      }
      // Establecer fecha de hoy si no hay fecha
      if (!form.watch('submitted_at')) {
        form.setValue('submitted_at', new Date());
      }
    }
  }, [mode, initialData, userData?.organization_preferences?.default_currency, form]);

  // Inicializar tareas seleccionadas cuando se cargan las tareas
  useEffect(() => {

    
    if (subcontractTasks && subcontractTasks.length > 0 && Object.keys(selectedTasks).length === 0) {
      const initialSelected: {[key: string]: boolean} = {};
      const initialPrices: {[key: string]: number} = {};
      
      subcontractTasks.forEach((task: any) => {
        initialSelected[task.id] = true; // Por defecto todas seleccionadas
        initialPrices[task.id] = 0; // Precio inicial 0
      });
      

      setSelectedTasks(initialSelected);
      setTaskPrices(initialPrices);
    }
  }, [subcontractTasks]);

  // Función para alternar selección de tarea
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Función para actualizar precio de tarea
  const updateTaskPrice = (taskId: string, price: number) => {
    setTaskPrices(prev => ({
      ...prev,
      [taskId]: price
    }));
  };

  // Calcular importe total de las tareas seleccionadas
  const calculateTotalAmount = () => {
    return subcontractTasks.reduce((total: number, task: any) => {
      if (selectedTasks[task.id]) {
        const price = taskPrices[task.id] || 0;
        const quantity = task.amount || 0;
        return total + (price * quantity);
      }
      return total;
    }, 0);
  };

  const onSubmit = async (data: BidFormData) => {
    setIsLoading(true);

    try {
      const bidData = {
        subcontract_id: subcontract_id,
        contact_id: data.contact_id,
        amount: parseFloat(data.amount),
        currency_id: data.currency_id,
        exchange_rate: data.exchange_rate ? parseFloat(data.exchange_rate) : 1,
        submitted_at: data.submitted_at ? data.submitted_at.toISOString().split('T')[0] : null,
        notes: data.notes || null,
        status: 'pending',
        ...(mode === 'create' && { 
          created_by: members?.find((m: any) => m.user_id === userData?.user?.id)?.id || null 
        })
      };


      const response = await fetch('/api/subcontract-bids', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mode === 'edit' ? { ...bidData, id: bid_id } : bidData),
      });

      if (!response.ok) {
        throw new Error('Failed to save bid');
      }

      toast({
        title: mode === 'create' ? 'Oferta creada' : 'Oferta actualizada',
        description: 'Los cambios se han guardado correctamente'
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la oferta',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Preparar opciones de contactos
  const contactOptions = contacts?.map(contact => ({
    value: contact.id,
    label: contact.company_name || contact.full_name || `${contact.first_name} ${contact.last_name}`.trim()
  })) || [];

  // Preparar opciones de monedas
  const currencyOptions = currencies?.map(currency => ({
    value: currency.id,
    label: `${currency.name} (${currency.code})`
  })) || [];

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Fecha de Cotización - Proveedor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="submitted_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Recepción</FormLabel>
                <FormControl>
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcontratista *</FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={contactOptions}
                    placeholder="Seleccionar proveedor..."
                    searchPlaceholder="Buscar proveedor..."
                    emptyMessage="No se encontraron proveedores."
                    disabled={isContactsLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Moneda - Monto Total */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda *</FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={currencyOptions}
                    placeholder="Seleccionar moneda..."
                    searchPlaceholder="Buscar moneda..."
                    emptyMessage="No se encontraron monedas."
                    disabled={isCurrenciesLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Total *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Cotización */}
        <FormField
          control={form.control}
          name="exchange_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cotización (Opcional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="Ej: 1.0000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notas */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Comentarios adicionales sobre la oferta..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botón para agregar tareas */}
        <FormSubsectionButton
          icon={<CheckSquare />}
          title="Detallar Tareas"
          description="Seleccionar tareas y definir precios unitarios"
          onClick={() => {
            setCurrentSubform('tasks');
            setCurrentPanel('subform');
          }}
        />

      </form>
    </Form>
  );

  // Header dinámico según el panel
  const headerContent = currentPanel === 'subform' && currentSubform === 'tasks' ? (
    <FormModalHeader 
      title="Tareas del Subcontrato"
      description="Seleccionar tareas y definir precios unitarios"
      icon={CheckSquare}
      showBackButton={true}
      onBackClick={() => setCurrentPanel('edit')}
    />
  ) : (
    <FormModalHeader 
      title={mode === 'create' ? 'Nueva Oferta' : 'Editar Oferta'}
      icon={FileText}
    />
  );

  // Función para guardar tareas seleccionadas
  const saveBidTasks = async () => {
    if (!modalData?.initialData?.id) {
      toast({
        title: "Error",
        description: "No se encontró el ID de la oferta",
        variant: "destructive"
      });
      return;
    }

    try {
      // Preparar datos de tareas seleccionadas
      const bidTasksData = subcontractTasks
        .filter((task: any) => selectedTasks[task.id])
        .map((task: any) => ({
          subcontract_bid_id: modalData.initialData.id,
          subcontract_task_id: task.id,
          quantity: task.amount || 0,
          unit: task.unit || task.unit_symbol || '',
          unit_price: taskPrices[task.id] || 0,
          amount: (task.amount || 0) * (taskPrices[task.id] || 0),
          notes: ''
        }));

      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      // Enviar al backend
      const response = await fetch('/api/subcontract-bid-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          bidId: modalData.initialData.id,
          tasks: bidTasksData
        })
      });

      if (!response.ok) {
        throw new Error('Error al guardar las tareas');
      }

      toast({
        title: "Tareas guardadas",
        description: "Las tareas de la oferta se guardaron correctamente"
      });

      setCurrentPanel('edit');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las tareas",
        variant: "destructive"
      });
    }
  };

  // Footer dinámico según el panel
  const footerContent = currentPanel === 'subform' && currentSubform === 'tasks' ? (
    <FormModalFooter
      leftLabel="Volver"
      onLeftClick={() => setCurrentPanel('edit')}
      rightLabel="Confirmar Tareas"
      onRightClick={saveBidTasks}
    />
  ) : (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={mode === 'create' ? 'Crear Oferta' : 'Actualizar Oferta'}
      onRightClick={form.handleSubmit(onSubmit)}
    />
  );

  // Panel de tareas (subform)
  const tasksSubform = (
    <div className="space-y-4">

      
      {(!subcontractTasks || subcontractTasks.length === 0) ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay tareas definidas en el alcance del subcontrato.</p>
          <p className="text-sm mt-1">Ve a la pestaña "Alcance" para agregar tareas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header de la tabla - distribuido uniformemente */}
          <div className="grid grid-cols-10 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
            <div className="col-span-1">
              <Checkbox
                checked={subcontractTasks.length > 0 && subcontractTasks.every((task: any) => selectedTasks[task.id])}
                onCheckedChange={(checked) => {
                  const newSelected: {[key: string]: boolean} = {};
                  subcontractTasks.forEach((task: any) => {
                    newSelected[task.id] = !!checked;
                  });
                  setSelectedTasks(newSelected);
                }}
                className="h-4 w-4"
              />
            </div>
            <div className="col-span-4">Tarea</div>
            <div className="col-span-1">Cant.</div>
            <div className="col-span-2">Precio Unit.</div>
            <div className="col-span-2">Importe</div>
          </div>
          
          {/* Lista de tareas - más compacta */}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {subcontractTasks.map((task: any) => {
              const quantity = task.amount || 0;
              const unitPrice = taskPrices[task.id] || 0;
              const total = quantity * unitPrice;
              const isSelected = selectedTasks[task.id];
              
              return (
                <div 
                  key={task.id} 
                  className="grid grid-cols-10 gap-2 items-start py-1.5 border-b border-muted/20"
                >
                  {/* Checkbox */}
                  <div className="col-span-1 pt-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTaskSelection(task.id)}
                      className="h-4 w-4"
                    />
                  </div>
                  
                  {/* Tarea */}
                  <div className="col-span-4">
                    <div className={isSelected ? 'text-foreground' : 'text-muted-foreground'}>
                      <p className="text-xs font-medium leading-tight">
                        {task.task_name || 'Sin nombre'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Cantidad */}
                  <div className="col-span-1 pt-1">
                    <span className={`text-xs ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {quantity}
                    </span>
                  </div>
                  
                  {/* Precio Unitario */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={unitPrice || ''}
                      onChange={(e) => updateTaskPrice(task.id, parseFloat(e.target.value) || 0)}
                      disabled={!isSelected}
                      className="h-7 text-xs"
                    />
                  </div>
                  
                  {/* Importe */}
                  <div className="col-span-2 pt-1">
                    <span className={`text-xs font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Determinar qué panel mostrar
  const currentEditPanel = currentPanel === 'subform' && currentSubform === 'tasks' ? tasksSubform : editPanel;

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={currentEditPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true}
      onClose={onClose}
    />
  );
}
