import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

import { Package, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateSubcontract } from "@/hooks/use-subcontracts";
import { useContacts } from "@/hooks/use-contacts";
import { useTaskSearch } from "@/hooks/use-task-search";
import { useTopLevelCategories } from "@/hooks/use-task-categories";

import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const subcontractSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  contact_id: z.string().min(1, "Debe seleccionar un proveedor"),
  amount_total: z.number().min(0, "El monto debe ser mayor o igual a 0").optional(),
  notes: z.string().optional(),
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

export function SubcontractFormModal({ modalData, onClose }: SubcontractFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rubroFilter, setRubroFilter] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const { data: userData } = useCurrentUser();
  const createSubcontract = useCreateSubcontract();
  
  // Obtener contactos/proveedores
  const { data: contacts = [] } = useContacts(modalData.organizationId || '');
  
  // Obtener tareas para selección usando el hook de búsqueda
  const { data: availableTasks = [], isLoading: isLoadingTasks } = useTaskSearch(
    searchQuery, 
    modalData.organizationId || '',
    { enabled: searchQuery.length >= 2 }
  );

  // Obtener categorías de primer nivel para filtro
  const { data: topLevelCategories = [] } = useTopLevelCategories();

  const form = useForm<SubcontractFormData>({
    resolver: zodResolver(subcontractSchema),
    defaultValues: {
      title: '',
      contact_id: '',
      amount_total: 0,
      notes: '',
    }
  });

  // Filtrar tareas con ambos filtros
  const filteredTasks = useMemo(() => {
    let filtered = availableTasks;
    
    // Filtro por rubro
    if (rubroFilter) {
      filtered = filtered.filter(task => task.category_id === rubroFilter);
    }
    
    return filtered;
  }, [availableTasks, rubroFilter]);

  // Función para manejar selección/deselección de tareas
  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
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
    return selectedTasks.map(taskId => {
      const task = availableTasks.find(t => t.id === taskId);
      return task;
    }).filter(Boolean);
  }, [selectedTasks, availableTasks]);

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
        status: 'pendiente',
        task_ids: selectedTasks
      });

      toast({
        title: "Subcontrato creado",
        description: "El pedido de subcontrato se creó correctamente",
      });

      onClose();
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Campos básicos del subcontrato */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">
            TÍTULO DEL SUBCONTRATO *
          </Label>
          <Input
            id="title"
            placeholder="Ej: Trabajos de albañilería"
            {...form.register('title')}
            className="h-10"
          />
          {form.formState.errors.title && (
            <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_id" className="text-xs font-medium text-muted-foreground">
              PROVEEDOR *
            </Label>
            <Select
              value={form.watch('contact_id') || ''}
              onValueChange={(value) => form.setValue('contact_id', value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Seleccionar..." />
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

          <div className="space-y-2">
            <Label htmlFor="amount_total" className="text-xs font-medium text-muted-foreground">
              MONTO TOTAL
            </Label>
            <Input
              id="amount_total"
              type="number"
              step="0.01"
              placeholder="0"
              {...form.register('amount_total', { valueAsNumber: true })}
              className="h-10"
            />
            {form.formState.errors.amount_total && (
              <p className="text-xs text-destructive">{form.formState.errors.amount_total.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">
            NOTAS
          </Label>
          <Textarea
            id="notes"
            placeholder="Notas adicionales..."
            {...form.register('notes')}
            className="min-h-[80px] resize-none"
          />
        </div>
      </div>

      {/* Layout de dos columnas para selección de tareas */}
      <div className="grid grid-cols-2 gap-6 h-[400px]">
        {/* Columna Izquierda - Tareas Disponibles */}
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted">
            <h3 className="text-sm font-medium">Tareas Disponibles</h3>
          </div>
          
          {/* Filtros en la columna izquierda - inline */}
          <div className="p-3 border-b space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Filtro por Rubro */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Filtrar por Rubro
                </Label>
                <Select
                  value={rubroFilter}
                  onValueChange={setRubroFilter}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos los rubros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los rubros</SelectItem>
                    {topLevelCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campo de búsqueda */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Búsqueda de Texto
                </Label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex w-full text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 placeholder:text-[var(--input-placeholder)] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Table Header */}
          <div className="py-2 px-3 bg-muted/50 font-medium text-xs border-b">
            <div className="text-xs font-medium">TAREA</div>
          </div>

          {/* Table Body */}
          <ScrollArea className="h-[270px]">
            <div className="divide-y">
              {isLoadingTasks ? (
                <div className="text-center py-8 text-muted-foreground">
                  Buscando tareas...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery.length < 2 ? 'Escribe al menos 2 caracteres para buscar' : 'No se encontraron tareas'}
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isSelected = selectedTasks.includes(task.id);
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`p-3 hover:bg-muted/50 cursor-pointer border-b transition-all ${
                        isSelected ? 'border-l-4 border-l-accent bg-accent/10' : ''
                      }`}
                      onClick={() => handleTaskToggle(task.id)}
                    >
                      {/* Task Name */}
                      <div>
                        <div className="text-sm leading-tight line-clamp-2">
                          {task.display_name || 'Tarea sin nombre'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-bold">{task.category_name || 'Sin rubro'}</span> - {task.units?.name || 'UN'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Columna Derecha - Tareas Seleccionadas */}
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted">
            <h3 className="text-sm font-medium">Tareas Seleccionadas ({selectedTasks.length})</h3>
          </div>
          
          {/* Selected Tasks Header */}
          <div className="grid gap-2 py-2 px-3 bg-muted/50 font-medium text-xs border-b" style={{gridTemplateColumns: "1fr auto"}}>
            <div className="text-xs font-medium">TAREA</div>
            <div className="text-xs font-medium w-8"></div>
          </div>

          {/* Selected Tasks Body */}
          <ScrollArea className="h-[320px]">
            <div className="divide-y">
              {selectedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay tareas seleccionadas
                </div>
              ) : (
                selectedTasksInfo.map((task, index) => {
                  if (!task) return null;
                  
                  return (
                    <div key={`${task.id}-${index}`} className="grid gap-2 py-3 px-3" style={{gridTemplateColumns: "1fr auto"}}>
                      {/* Task Name */}
                      <div>
                        <div className="text-sm leading-tight line-clamp-2">
                          {task.display_name || 'Tarea sin nombre'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-bold">{task.category_name || 'Sin rubro'}</span> - {task.units?.name || 'UN'}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <div className="w-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleTaskToggle(task.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </form>
  );

  const headerContent = {
    title: "Crear Pedido de Subcontrato",
    subtitle: "Vincula tareas del proyecto con un subcontratista",
    icon: Package,
  };

  const footerContent = {
    rightActions: [
      { label: "Cancelar", variant: "ghost" as const, onClick: onClose },
      { 
        label: "Crear Subcontrato", 
        variant: "default" as const, 
        onClick: form.handleSubmit(onSubmit),
        isLoading: isSubmitting,
        disabled: !form.formState.isValid || selectedTasks.length === 0 || isSubmitting
      }
    ]
  };

  return (
    <FormModalLayout
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={<FormModalHeader {...headerContent} />}
      footerContent={<FormModalFooter {...footerContent} />}
      isEditing={true}
      maxWidth="1200px"
    />
  );
}