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
import { Settings, Search, Filter, Plus } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useConstructionProjectPhases } from "@/hooks/use-construction-phases";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const singleTaskSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  project_phase_id: z.string().optional()
});

type SingleTaskFormData = z.infer<typeof singleTaskSchema>;

interface ConstructionSingleTaskModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
    editingTask?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ConstructionSingleTaskModal({ 
  modalData, 
  onClose 
}: ConstructionSingleTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rubroFilter, setRubroFilter] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  
  const { data: userData } = useCurrentUser();
  const createTask = useCreateConstructionTask();
  const updateTask = useUpdateConstructionTask();
  
  const isEditing = modalData.isEditing && modalData.editingTask;

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
      
      return data;
    },
    enabled: !!userData?.user?.id && !!modalData.organizationId
  });

  // Hook para cargar TODAS las tareas de la librería parametrica
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['task-parametric-library'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data: allTasks, error } = await supabase
        .from('task_parametric_view')
        .select('*')
        .order('name_rendered', { ascending: true });
      
      if (error) {
        console.error('❌ Error cargando librería de tareas:', error);
        throw error;
      }
      
      return allTasks || [];
    },
    enabled: !!supabase
  });

  // Hook para obtener las fases del proyecto
  const { data: projectPhases = [], isLoading: isLoadingProjectPhases } = useConstructionProjectPhases(modalData.projectId);

  // Configurar el formulario
  const form = useForm<SingleTaskFormData>({
    resolver: zodResolver(singleTaskSchema),
    defaultValues: {
      task_id: '',
      quantity: 1,
      project_phase_id: ''
    }
  });

  // Si estamos editando, configurar los valores iniciales
  useEffect(() => {
    if (isEditing && modalData.editingTask) {
      console.log('Loading task for editing:', modalData.editingTask);
      
      setSelectedTaskId(modalData.editingTask.task_id || '');
      
      form.reset({
        task_id: modalData.editingTask.task_id || '',
        quantity: modalData.editingTask.quantity || 1,
        project_phase_id: modalData.editingTask.phase_instance_id || ''
      });
    }
  }, [isEditing, modalData.editingTask, form]);

  // Obtener categorías únicas para el filtro
  const uniqueRubros = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    const rubros = tasks
      .filter(task => task.category_name)
      .map(task => task.category_name)
      .filter((rubro, index, self) => self.indexOf(rubro) === index)
      .sort();
    
    return rubros;
  }, [tasks]);

  // Filtrar tareas según búsqueda y filtros
  const filteredTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    let filtered = tasks;
    
    // Filtro por búsqueda de texto
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.name_rendered?.toLowerCase().includes(searchLower) ||
        task.code?.toLowerCase().includes(searchLower) ||
        task.category_name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtro por rubro
    if (rubroFilter) {
      filtered = filtered.filter(task => task.category_name === rubroFilter);
    }
    
    return filtered;
  }, [tasks, searchQuery, rubroFilter]);

  // Función para manejar la selección de tarea
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    form.setValue('task_id', taskId);
  };

  // Función para enviar el formulario
  const onSubmit = async (data: SingleTaskFormData) => {
    if (!organizationMember?.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información del usuario",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEditing && modalData.editingTask) {
        // Modo edición
        await updateTask.mutateAsync({
          id: modalData.editingTask.id,
          quantity: data.quantity,
          project_id: modalData.projectId,
          organization_id: modalData.organizationId,
          project_phase_id: data.project_phase_id
        });
      } else {
        // Modo creación
        await createTask.mutateAsync({
          organization_id: modalData.organizationId,
          project_id: modalData.projectId,
          task_id: data.task_id,
          quantity: data.quantity,
          created_by: organizationMember.id,
          project_phase_id: data.project_phase_id
        });
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Error al procesar tarea:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Vista de la tarea seleccionada
      </p>
    </div>
  );

  const editPanel = (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rubro-filter" className="text-sm font-medium">
              Filtrar por Rubro
            </Label>
            <Select value={rubroFilter} onValueChange={setRubroFilter}>
              <SelectTrigger>
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
            <Label htmlFor="search" className="text-sm font-medium">
              Búsqueda de Texto
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por nombre o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Lista de tareas */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">TAREA</Label>
        <ScrollArea className="h-[300px] border rounded-md p-4">
          {tasksLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Cargando tareas...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No se encontraron tareas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskSelect(task.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedTaskId === task.id 
                      ? 'border-primary bg-accent border-r-4 border-r-primary' 
                      : 'border-border hover:border-accent-foreground'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm leading-tight">
                      {task.name_rendered}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {task.category_name} - {task.code}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <Separator />

      {/* Campos de configuración */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity" className="text-sm font-medium">
            CANTIDAD
          </Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0.01"
            {...form.register('quantity', { valueAsNumber: true })}
            className={form.formState.errors.quantity ? 'border-destructive' : ''}
          />
          {form.formState.errors.quantity && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.quantity.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phase" className="text-sm font-medium">
            FASE
          </Label>
          <Select
            value={form.watch('project_phase_id') || ''}
            onValueChange={(value) => form.setValue('project_phase_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin fase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin fase</SelectItem>
              {projectPhases.map((phase) => (
                <SelectItem key={phase.project_phase_id} value={phase.project_phase_id}>
                  {phase.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Tarea de Construcción" : "Agregar Tarea"}
      icon={isEditing ? Settings : Plus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Guardar Cambios" : "Agregar Tarea"}
      onRightClick={form.handleSubmit(onSubmit)}
      rightLoading={isSubmitting}
      rightDisabled={!selectedTaskId || isSubmitting}
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
      isEditing={true} // Siempre mostrar el panel de edición
    />
  );
}