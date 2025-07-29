import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  Search, 
  Filter, 
  X, 
  Plus, 
  Minus,
  CheckSquare,
  Square
} from "lucide-react";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateSubcontract, useContacts } from "@/hooks/use-subcontracts";
import { useConstructionTasks, type ConstructionTaskView } from "@/hooks/use-construction-tasks";
import { useTaskSearch, type TaskSearchResult } from "@/hooks/use-task-search";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Tipo para ambos tipos de tareas
type CombinedTask = TaskSearchResult | ConstructionTaskView;

const subcontractSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  contact_id: z.string().min(1, "Debe seleccionar un proveedor"),
  amount_total: z.number().min(0, "El monto debe ser mayor o igual a 0").default(0),
  notes: z.string().optional(),
  status: z.string().default("pendiente"),
  selectedTasks: z.array(z.string()).min(1, "Debe seleccionar al menos una tarea")
});

type SubcontractFormData = z.infer<typeof subcontractSchema>;

interface SubcontractFormModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
  };
  onClose: () => void;
}

export function SubcontractFormModal({ 
  modalData, 
  onClose 
}: SubcontractFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rubroFilter, setRubroFilter] = useState<string>('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  const { data: userData } = useCurrentUser();
  const createSubcontract = useCreateSubcontract();
  
  // Obtener contactos/proveedores
  const { data: contacts = [] } = useContacts(modalData.organizationId || '');
  
  // Obtener tareas para selección usando el hook de búsqueda
  const { data: availableTasks = [], isLoading: isLoadingTasks } = useTaskSearch(
    searchQuery, 
    modalData.organizationId, 
    { origin: 'all' },
    searchQuery.length >= 2
  );

  // Obtener tareas de construcción del proyecto para mostrar las seleccionadas
  const { data: constructionTasks = [] } = useConstructionTasks(modalData.projectId);

  const form = useForm<SubcontractFormData>({
    resolver: zodResolver(subcontractSchema),
    defaultValues: {
      title: '',
      contact_id: '',
      amount_total: 0,
      notes: '',
      status: 'pendiente',
      selectedTasks: []
    }
  });

  // Filtrar tareas por rubro si está seleccionado
  const filteredTasks = useMemo(() => {
    if (!rubroFilter) return availableTasks;
    return availableTasks.filter(task => task.category_name === rubroFilter);
  }, [availableTasks, rubroFilter]);

  // Obtener rubros únicos para el filtro
  const uniqueRubros = useMemo(() => {
    const rubros = availableTasks.map(task => task.category_name).filter(Boolean);
    return Array.from(new Set(rubros));
  }, [availableTasks]);

  // Manejar selección/deselección de tareas
  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => {
      const isSelected = prev.includes(taskId);
      if (isSelected) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchQuery('');
    setRubroFilter('');
  };

  // Obtener información de las tareas seleccionadas
  const selectedTasksInfo = useMemo(() => {
    const allTasks = [...availableTasks, ...constructionTasks];
    return selectedTasks.map(taskId => {
      const task = allTasks.find(t => 
        ('id' in t && t.id === taskId) || 
        ('task_id' in t && t.task_id === taskId)
      );
      return task;
    }).filter(Boolean);
  }, [selectedTasks, availableTasks, constructionTasks]);

  const onSubmit = async (data: SubcontractFormData) => {
    try {
      setIsSubmitting(true);
      
      const subcontractData = {
        project_id: modalData.projectId,
        organization_id: modalData.organizationId,
        contact_id: data.contact_id,
        title: data.title,
        amount_total: data.amount_total,
        status: data.status,
        notes: data.notes || null,
      };

      await createSubcontract.mutateAsync({
        subcontract: subcontractData,
        taskIds: selectedTasks
      });

      onClose();
    } catch (error) {
      console.error('Error creating subcontract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Crear Pedido de Subcontrato</h3>
        <p className="text-muted-foreground">
          Selecciona las tareas y configura los detalles del subcontrato
        </p>
      </div>
    </div>
  );

  const editPanel = (
    <div className="space-y-6">
      {/* Información básica del subcontrato */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-xs font-medium">TÍTULO DEL SUBCONTRATO *</Label>
          <Input
            id="title"
            {...form.register('title')}
            placeholder="Ej: Trabajos de albañilería"
            className="mt-1"
          />
          {form.formState.errors.title && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact_id" className="text-xs font-medium">PROVEEDOR *</Label>
            <Select onValueChange={(value) => form.setValue('contact_id', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar proveedor" />
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
              <p className="text-xs text-destructive mt-1">{form.formState.errors.contact_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="amount_total" className="text-xs font-medium">MONTO TOTAL</Label>
            <Input
              id="amount_total"
              type="number"
              step="0.01"
              {...form.register('amount_total', { valueAsNumber: true })}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes" className="text-xs font-medium">NOTAS</Label>
          <Textarea
            id="notes"
            {...form.register('notes')}
            placeholder="Notas adicionales..."
            rows={3}
            className="mt-1"
          />
        </div>
      </div>

      <Separator />

      {/* Selección de tareas */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">SELECCIÓN DE TAREAS</h4>
        
        {/* Filtros */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium">FILTRAR POR RUBRO</Label>
            <Select value={rubroFilter} onValueChange={setRubroFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Todos los rubros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los rubros</SelectItem>
                {uniqueRubros.map((rubro) => (
                  <SelectItem key={rubro} value={rubro}>
                    {rubro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium">BÚSQUEDA DE TEXTO</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de tareas disponibles */}
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted/20">
            <h5 className="text-xs font-medium text-muted-foreground">TAREAS DISPONIBLES</h5>
          </div>
          <ScrollArea className="h-64">
            <div className="p-3 space-y-2">
              {isLoadingTasks ? (
                <div className="text-center py-4 text-muted-foreground">
                  Buscando tareas...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {searchQuery.length < 2 ? 'Escribe al menos 2 caracteres para buscar' : 'No se encontraron tareas'}
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded border cursor-pointer transition-colors",
                      selectedTasks.includes(task.id)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleTaskToggle(task.id)}
                  >
                    <div className="flex items-center gap-3">
                      {selectedTasks.includes(task.id) ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {'display_name' in task ? task.display_name : 'Tarea sin nombre'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {task.category_name || 'Sin categoría'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {'units' in task ? task.units?.name || 'UN' : 'UN'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Tareas seleccionadas */}
        {selectedTasks.length > 0 && (
          <div className="border rounded-lg">
            <div className="p-3 border-b bg-muted/20">
              <h5 className="text-xs font-medium text-muted-foreground">
                TAREAS SELECCIONADAS ({selectedTasks.length})
              </h5>
            </div>
            <ScrollArea className="max-h-32">
              <div className="p-3 space-y-2">
                {selectedTasksInfo.map((task) => (
                  <div
                    key={task?.id}
                    className="flex items-center justify-between p-2 rounded bg-primary/5"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {task && 'display_name' in task ? task.display_name : 
                         task && 'name_rendered' in task ? task.name_rendered : 'Tarea sin nombre'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task?.category_name || 'Sin categoría'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTaskToggle(
                        (task && 'id' in task ? task.id : 
                         task && 'task_id' in task ? task.task_id : '') || ''
                      )}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {selectedTasks.length === 0 && (
          <p className="text-xs text-destructive">Debe seleccionar al menos una tarea</p>
        )}
      </div>
    </div>
  );

  const headerContent = {
    title: "Crear Pedido de Subcontrato",
    subtitle: "Vincula tareas del proyecto con un subcontratista",
    icon: Package,
  };

  const footerContent = {
    cancelLabel: "Cancelar",
    submitLabel: isSubmitting ? "Creando..." : "Crear Subcontrato",
    isSubmitting,
    onSubmit: form.handleSubmit(onSubmit),
    isValid: form.formState.isValid && selectedTasks.length > 0,
  };

  return (
    <FormModalLayout
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={<FormModalHeader {...headerContent} />}
      footerContent={<FormModalFooter {...footerContent} />}
      isEditing={true}
    />
  );
}