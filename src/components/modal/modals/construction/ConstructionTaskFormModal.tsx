import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

import { ComboBox } from "@/components/ui-custom/ComboBoxWrite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Search, CheckSquare, Square, Filter, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useProjectPhases } from "@/hooks/use-construction-phases";


import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const addTaskSchema = z.object({
  selectedTasks: z.array(z.object({
    task_id: z.string(),
    quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0")
  })).min(1, "Debe seleccionar al menos una tarea")
});

type AddTaskFormData = z.infer<typeof addTaskSchema>;

interface SelectedTask {
  task_id: string;
  quantity: number;
  phase_id?: string;
}

interface ConstructionTaskFormModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
    editingTask?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ConstructionTaskFormModal({ 
  modalData, 
  onClose 
}: ConstructionTaskFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const [rubroFilter, setRubroFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  
  const { data: userData } = useCurrentUser();
  
  // Query para obtener la membresía actual del usuario en la organización
  const { data: organizationMember } = useQuery({
    queryKey: ['organization-member', modalData.organizationId, userData?.user?.id],
    queryFn: async () => {
      if (!supabase || !userData?.user?.id || !modalData.organizationId) return null;
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, user_id, organization_id')
        .eq('organization_id', modalData.organizationId)
        .eq('user_id', userData.user.id)
        .single();
        
      if (error) {
        console.error('❌ Error obteniendo membresía de organización:', error);
        return null;
      }
      
      console.log('✅ Membresía encontrada:', data);
      return data;
    },
    enabled: !!userData?.user?.id && !!modalData.organizationId
  });



  // Hook para cargar TODAS las tareas de la librería parametrica (sin filtrar por proyecto)
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['task-parametric-library'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('🔍 Cargando librería completa de tareas parametricas');
      
      const { data: allTasks, error } = await supabase
        .from('task_parametric_view')
        .select('*')
        .order('name_rendered', { ascending: true });
      
      if (error) {
        console.error('❌ Error cargando librería de tareas:', error);
        throw error;
      }
      
      console.log('✅ Librería de tareas cargada:', allTasks?.length || 0);
      console.log('📋 Primeras 3 tareas:', allTasks?.slice(0, 3));
      
      return allTasks || [];
    },
    enabled: !!supabase
  });

  // Hook para obtener las fases del proyecto
  const { data: projectPhases = [], isLoading: isLoadingProjectPhases } = useProjectPhases(modalData.projectId);
  
  // Log para debug
  useEffect(() => {
    console.log('Project phases loaded:', projectPhases);
  }, [projectPhases]);

  // Hook para obtener la fase actual de la tarea cuando se está editando
  // Ya tenemos la información en editingTask.phase_instance_id, no necesitamos query adicional

  const form = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      selectedTasks: []
    }
  });

  const { handleSubmit, setValue, watch, formState: { errors } } = form;

  // Obtener rubros únicos para el filtro
  const rubroOptions = useMemo(() => {
    const uniqueRubros = Array.from(new Set(tasks.map(task => task.category_name).filter(Boolean)));
    return uniqueRubros.map(rubro => ({ value: rubro, label: rubro }));
  }, [tasks]);

  // Filtrar tareas con ambos filtros
  const filteredTasks = useMemo(() => {
    console.log('🔄 Procesando filtros - Tareas totales:', tasks.length, 'Búsqueda:', searchQuery, 'Rubro:', rubroFilter);
    
    let filtered = tasks;
    
    // Filtro por rubro
    if (rubroFilter) {
      filtered = filtered.filter(task => task.category_name === rubroFilter);
    }
    
    // Filtro por búsqueda de texto
    if (searchQuery.trim()) {
      filtered = filtered.filter(task => 
        task.name_rendered?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    console.log('🔍 Tareas filtradas:', filtered.length);
    return filtered;
  }, [tasks, searchQuery, rubroFilter]);

  // Función para obtener la unidad de una tarea específica
  const getTaskUnit = (task: any) => {
    return task.units?.name || task.unit_name || 'ud';
  };

  // Funciones para manejar la selección de tareas
  const handleTaskSelection = (taskId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTasks(prev => [...prev, { task_id: taskId, quantity: 1 }]);
    } else {
      setSelectedTasks(prev => prev.filter(t => t.task_id !== taskId));
    }
  };

  const handleQuantityChange = (taskId: string, quantity: number) => {
    setSelectedTasks(prev => 
      prev.map(t => t.task_id === taskId ? { ...t, quantity } : t)
    );
  };



  // Cargar datos cuando está en modo edición
  useEffect(() => {
    if (modalData.isEditing && modalData.editingTask) {
      const task = modalData.editingTask;
      console.log('Loading task for editing:', task);
      
      // Pre-cargar la tarea actual como seleccionada
      setSelectedTasks([{
        task_id: task.task_id || '',
        quantity: task.quantity || 1,
        phase_instance_id: task.phase_instance_id || ''
      }]);
      
      // Reset del formulario con valores básicos
      form.reset({
        selectedTasks: [{
          task_id: task.task_id || '',
          quantity: task.quantity || 1
        }]
      });
    }
  }, [modalData.isEditing, modalData.editingTask, form]);

  // Sincronizar selectedTasks con el formulario
  useEffect(() => {
    setValue('selectedTasks', selectedTasks);
  }, [selectedTasks, setValue]);

  const createTask = useCreateConstructionTask();
  const updateTask = useUpdateConstructionTask();

  const onSubmit = async (data: AddTaskFormData) => {
    console.log('🚀 SUBMIT INICIADO - Datos del formulario:', data);
    console.log('🚀 SUBMIT INICIADO - selectedTasks:', selectedTasks);
    console.log('🚀 SUBMIT INICIADO - modalData:', modalData);
    console.log('🚀 SUBMIT INICIADO - userData:', userData?.user);
    console.log('🚀 SUBMIT INICIADO - organizationMember:', organizationMember);

    if (!userData?.user?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive"
      });
      return;
    }

    if (!organizationMember?.id) {
      console.log('⚠️ organizationMember es null');
      toast({
        title: "Error",
        description: "No se pudo verificar tu membresía en la organización",
        variant: "destructive"
      });
      return;
    }

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
      if (modalData.isEditing && modalData.editingTask) {
        // Modo edición - solo editar la primera tarea seleccionada
        const firstSelected = selectedTasks[0];
        await updateTask.mutateAsync({
          id: modalData.editingTask.id,
          quantity: firstSelected.quantity,
          project_id: modalData.projectId,
          organization_id: modalData.organizationId,
          phase_id: firstSelected.phase_id || undefined
        });

        toast({
          title: "Tarea actualizada",
          description: "La tarea se ha actualizado correctamente",
        });
      } else {
        // Modo creación - crear múltiples tareas
        console.log('🚀 CREANDO TAREAS - DATOS A ENVIAR:', {
          numberOfTasks: selectedTasks.length,
          organizationId: modalData.organizationId,
          projectId: modalData.projectId,
          createdBy: organizationMember?.id,
          taskDetails: selectedTasks.map(st => ({
            task_id: st.task_id,
            quantity: st.quantity,
            phase_id: st.phase_id
          }))
        });

        const createdById = organizationMember?.id;
        console.log('🔧 ID A USAR PARA created_by:', {
          organizationMember: organizationMember?.id,
          finalId: createdById
        });

        const promises = selectedTasks.map((selectedTask, index) => {
          console.log(`🔄 Preparando tarea ${index + 1}:`, {
            task_id: selectedTask.task_id,
            quantity: selectedTask.quantity,
            organization_id: modalData.organizationId,
            project_id: modalData.projectId,
            created_by: createdById,
            phase_id: selectedTask.phase_id || undefined
          });
          
          return createTask.mutateAsync({
            organization_id: modalData.organizationId,
            project_id: modalData.projectId,
            task_id: selectedTask.task_id,
            quantity: selectedTask.quantity,
            created_by: createdById,
            phase_id: selectedTask.phase_id || undefined
          }).catch(error => {
            console.error(`❌ Error en tarea ${index + 1}:`, error);
            throw error;
          });
        });

        await Promise.all(promises);

        toast({
          title: "Tareas agregadas",
          description: `Se agregaron ${selectedTasks.length} tarea${selectedTasks.length > 1 ? 's' : ''} al proyecto`,
        });
      }

      onClose();
    } catch (error) {
      console.error('❌ ERROR COMPLETO AL ENVIAR TAREAS:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = "Error desconocido";
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'details' in error) {
        errorMessage = String(error.details);
      }
      
      toast({
        title: "Error",
        description: `${modalData.isEditing ? "No se pudo actualizar la tarea" : "No se pudo agregar las tareas"}: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Panel de vista (vacío para este modal)
  const viewPanel = (
    <div className="p-4 text-center text-muted-foreground">
      Este modal no tiene vista previa
    </div>
  );

  const editPanel = (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="flex flex-col h-full"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }
      }}
    >
      {/* Sección fija superior */}
      <div className="flex-shrink-0 space-y-6">


        {/* Errores y estado */}
        <div className="space-y-2">
          {errors.selectedTasks && (
            <p className="text-sm text-destructive">{errors.selectedTasks.message}</p>
          )}
        </div>
      </div>

      {/* Layout de dos columnas */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
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
                <ComboBox
                  value={rubroFilter}
                  onValueChange={setRubroFilter}
                  options={rubroOptions}
                  placeholder="Todos los rubros"
                  searchPlaceholder="Buscar rubro..."
                  emptyMessage="No se encontraron rubros"
                  className="text-xs"
                />
              </div>
              
              {/* Campo de búsqueda */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Búsqueda de Texto
                </Label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o categoría..."
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
          <ScrollArea className="h-[350px]">
            <div className="divide-y">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No se encontraron tareas" : "No hay tareas disponibles"}
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isSelected = selectedTasks.some(t => t.task_id === task.id);
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`p-3 hover:bg-muted/50 cursor-pointer border-b transition-all ${
                        isSelected ? 'border-l-4 border-l-accent bg-accent/10' : ''
                      }`}
                      onClick={() => {
                        // Permite agregar la misma tarea múltiples veces
                        setSelectedTasks(prev => [...prev, { task_id: task.id, quantity: 1 }]);
                      }}
                    >
                      {/* Task Name */}
                      <div>
                        <div className="text-sm leading-tight line-clamp-2">
                          {task.name_rendered || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-bold">{task.category_name || 'Sin rubro'}</span> - {task.unit_name || 'Sin unidad'}
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
          <div className="grid gap-2 py-2 px-3 bg-muted/50 font-medium text-xs border-b" style={{gridTemplateColumns: "1fr auto auto auto"}}>
            <div className="text-xs font-medium">TAREA</div>
            <div className="text-xs font-medium w-16">CANT.</div>
            <div className="text-xs font-medium w-20">FASE</div>
            <div className="text-xs font-medium w-8"></div>
          </div>

          {/* Selected Tasks Body */}
          <ScrollArea className="h-[350px]">
            <div className="divide-y">
              {selectedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay tareas seleccionadas
                </div>
              ) : (
                selectedTasks.map((selectedTask, index) => {
                  const task = tasks?.find(t => t.id === selectedTask.task_id);
                  if (!task) return null;
                  
                  return (
                    <div key={`${selectedTask.task_id}-${index}`} className="grid gap-2 py-3 px-3" style={{gridTemplateColumns: "1fr auto auto auto"}}>
                      {/* Task Name */}
                      <div>
                        <div className="text-sm leading-tight line-clamp-2">
                          {task.name_rendered || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-bold">{task.category_name || 'Sin rubro'}</span> - {task.unit_name || 'Sin unidad'}
                        </div>
                      </div>

                      {/* Cantidad Input */}
                      <div className="w-16">
                        <Input
                          type="number"
                          value={selectedTask.quantity}
                          onChange={(e) => {
                            const newQuantity = parseFloat(e.target.value) || 0;
                            setSelectedTasks(prev => 
                              prev.map((t, i) => 
                                i === index ? { ...t, quantity: newQuantity } : t
                              )
                            );
                          }}
                          className="h-8 text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      {/* Fase Select */}
                      <div className="w-20">
                        <Select 
                          value={selectedTask.phase_id || ""}
                          onValueChange={(value) => {
                            setSelectedTasks(prev => 
                              prev.map((t, i) => 
                                i === index ? { ...t, phase_id: value } : t
                              )
                            );
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Fase" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectPhases.map((projectPhase) => (
                              <SelectItem key={projectPhase.id} value={projectPhase.id}>
                                {projectPhase.phase.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Delete Button */}
                      <div className="w-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedTasks(prev => prev.filter((_, i) => i !== index));
                          }}
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

  const headerContent = (
    <FormModalHeader 
      title={modalData.isEditing ? "Editar Tarea de Construcción" : "Seleccionar Tareas del Proyecto"}
      icon={CheckSquare}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={modalData.isEditing ? "Guardar Cambios" : `Agregar ${selectedTasks.length} Tarea${selectedTasks.length !== 1 ? 's' : ''}`}
      onRightClick={() => {
        console.log('🎯 BOTÓN PRESIONADO - Form errors:', form.formState.errors);
        console.log('🎯 BOTÓN PRESIONADO - Form isValid:', form.formState.isValid);
        console.log('🎯 BOTÓN PRESIONADO - Form values:', form.getValues());
        console.log('🎯 BOTÓN PRESIONADO - selectedTasks:', selectedTasks);
        handleSubmit(onSubmit)();
      }}
      isLoading={isSubmitting}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
      className="max-w-[1440px] w-[1440px]"
    />
  );
}