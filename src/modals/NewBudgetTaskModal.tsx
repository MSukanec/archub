import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Calculator, X } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";

interface NewBudgetTaskModalProps {
  open: boolean;
  onClose: () => void;
  budgetId: string;
  editingTask?: any;
}

interface TaskFormData {
  task_id: string;
  quantity: number;
  start_date: Date;
  end_date: Date;
  planned_days: number;
  priority: string;
  dependencies: string[];
  budget_id: string;
  organization_id: string;
  created_at: Date;
}

export function NewBudgetTaskModal({ open, onClose, budgetId, editingTask }: NewBudgetTaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    task_id: '',
    quantity: 1,
    start_date: new Date(),
    end_date: new Date(),
    planned_days: 1,
    priority: 'medium',
    dependencies: [],
    budget_id: budgetId,
    organization_id: '',
    created_at: new Date()
  });
  
  const [calendarOpen, setCalendarOpen] = useState({ start: false, end: false });
  const [isLoading, setIsLoading] = useState(false);

  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set organization_id when userData is available
  useEffect(() => {
    if (userData?.organization?.id && !formData.organization_id) {
      setFormData(prev => ({
        ...prev,
        organization_id: userData.organization.id
      }));
    }
  }, [userData, formData.organization_id]);

  // Pre-populate form when editing
  useEffect(() => {
    if (editingTask) {
      setFormData({
        task_id: editingTask.task_id || '',
        quantity: editingTask.quantity || 1,
        start_date: editingTask.start_date ? new Date(editingTask.start_date) : new Date(),
        end_date: editingTask.end_date ? new Date(editingTask.end_date) : new Date(),
        planned_days: editingTask.planned_days || 1,
        priority: editingTask.priority || 'medium',
        dependencies: editingTask.dependencies || [],
        budget_id: editingTask.budget_id || budgetId,
        organization_id: editingTask.organization_id || userData?.organization?.id || '',
        created_at: editingTask.created_at ? new Date(editingTask.created_at) : new Date()
      });
    } else {
      // Reset form for new task
      setFormData({
        task_id: '',
        quantity: 1,
        start_date: new Date(),
        end_date: new Date(),
        planned_days: 1,
        priority: 'medium',
        dependencies: [],
        budget_id: budgetId,
        organization_id: userData?.organization?.id || '',
        created_at: new Date()
      });
    }
  }, [editingTask, budgetId, userData?.organization?.id, open]);

  const mutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (!supabase) throw new Error('Supabase client not available');

      if (editingTask) {
        // Update existing task
        const { error } = await supabase
          .from('budget_tasks')
          .update({
            task_id: data.task_id,
            quantity: data.quantity,
            start_date: data.start_date.toISOString(),
            end_date: data.end_date.toISOString(),
            planned_days: data.planned_days,
            priority: data.priority,
            dependencies: data.dependencies,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTask.id);

        if (error) throw error;
      } else {
        // Create new task
        const { error } = await supabase
          .from('budget_tasks')
          .insert({
            task_id: data.task_id,
            quantity: data.quantity,
            start_date: data.start_date.toISOString(),
            end_date: data.end_date.toISOString(),
            planned_days: data.planned_days,
            priority: data.priority,
            dependencies: data.dependencies,
            budget_id: data.budget_id,
            organization_id: data.organization_id,
            created_at: data.created_at.toISOString()
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: editingTask ? "Tarea actualizada" : "Tarea creada",
        description: editingTask 
          ? "La tarea del presupuesto ha sido actualizada correctamente"
          : "La nueva tarea ha sido agregada al presupuesto correctamente",
      });
      
      // Invalidate cache to refresh the budget tasks
      queryClient.invalidateQueries({ queryKey: ['budget-tasks', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      
      onClose();
    },
    onError: (error) => {
      console.error('Error saving budget task:', error);
      toast({
        title: "Error",
        description: editingTask 
          ? "No se pudo actualizar la tarea del presupuesto" 
          : "No se pudo crear la tarea del presupuesto",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await mutation.mutateAsync(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const updateFormData = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!open) return null;

  const modalContent = {
    header: (
      <CustomModalHeader
        icon={Calculator}
        title={editingTask ? "Editar Tarea del Presupuesto" : "Nueva Tarea del Presupuesto"}
        description={editingTask ? "Modifica los detalles de la tarea seleccionada" : "Agrega una nueva tarea a este presupuesto"}
        onClose={onClose}
      />
    ),
    body: (
      <CustomModalBody padding="md">
        <form id="budget-task-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha de creación */}
          <div className="space-y-2">
            <Label htmlFor="created_at" className="required-asterisk">
              Fecha de creación
            </Label>
            <Popover open={calendarOpen.start} onOpenChange={(open) => setCalendarOpen(prev => ({ ...prev, start: open }))}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.created_at && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.created_at ? format(formData.created_at, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.created_at}
                  onSelect={(date) => {
                    if (date) {
                      updateFormData('created_at', date);
                      setCalendarOpen(prev => ({ ...prev, start: false }));
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tarea */}
          <div className="space-y-2">
            <Label htmlFor="task_id" className="required-asterisk">
              Tarea
            </Label>
            <Select 
              value={formData.task_id} 
              onValueChange={(value) => updateFormData('task_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tarea" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task1">Excavación</SelectItem>
                <SelectItem value="task2">Cimentación</SelectItem>
                <SelectItem value="task3">Estructura</SelectItem>
                <SelectItem value="task4">Mampostería</SelectItem>
                <SelectItem value="task5">Instalaciones</SelectItem>
                <SelectItem value="task6">Acabados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="required-asterisk">
              Cantidad
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => updateFormData('quantity', parseInt(e.target.value) || 1)}
              placeholder="Ingresa la cantidad"
            />
          </div>

          {/* Fechas de inicio y fin */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="required-asterisk">
                Fecha de inicio
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => date && updateFormData('start_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date" className="required-asterisk">
                Fecha de fin
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => date && updateFormData('end_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Días planificados */}
          <div className="space-y-2">
            <Label htmlFor="planned_days" className="required-asterisk">
              Días planificados
            </Label>
            <Input
              id="planned_days"
              type="number"
              min="1"
              value={formData.planned_days}
              onChange={(e) => updateFormData('planned_days', parseInt(e.target.value) || 1)}
              placeholder="Días estimados para completar"
            />
          </div>

          {/* Prioridad */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="required-asterisk">
              Prioridad
            </Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => updateFormData('priority', value)}
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
          </div>
        </form>
      </CustomModalBody>
    ),
    footer: (
      <CustomModalFooter
        onCancel={handleCancel}
        onSave={handleSubmit}
        saveText={editingTask ? "Actualizar Tarea" : "Crear Tarea"}
        isLoading={isLoading}
      />
    )
  };

  return <CustomModalLayout>{modalContent}</CustomModalLayout>;
}