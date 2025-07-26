import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';
import { TaskTemplate, TaskTemplateParameter, TaskParameter } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite';
import { Badge } from '@/components/ui/badge';
import { Trash2, GripVertical, Plus, FileText, Settings } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface TaskGroupTemplateModalProps {
  taskGroupId?: string;
  taskGroupName?: string;
  categoryId?: string;
}

interface SortableParameterItemProps {
  param: { id: string; parameter_id: string; template_id: string; position: number; option_group_id: string | null };
  parameter: { id: string; name: string; label: string; type: string } | undefined;
  onRemove: (id: string) => void;
}

function SortableParameterItem({ param, parameter, onRemove }: SortableParameterItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: param.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-muted/30 rounded border"
    >
      <div className="flex items-center space-x-3 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <span className="font-medium text-sm">{parameter?.label || parameter?.name || 'Parámetro desconocido'}</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {parameter?.type || 'unknown'}
          </Badge>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(param.id)}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default function TaskGroupTemplateModal({ taskGroupId, taskGroupName, categoryId }: TaskGroupTemplateModalProps) {
  const { closeModal } = useGlobalModalStore();
  const queryClient = useQueryClient();
  
  // Estados locales
  const [templateParameters, setTemplateParameters] = useState<any[]>([]);
  const [newParameterId, setNewParameterId] = useState('');
  const [newOptionGroupId, setNewOptionGroupId] = useState('');

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch existing template
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['task-template', taskGroupId],
    queryFn: async () => {
      if (!taskGroupId) return null;
      
      console.log('🔍 Buscando plantilla para task_group_id:', taskGroupId);
      
      const { data, error } = await supabase
        .from('task_templates')
        .select(`
          *,
          task_template_parameters (
            id,
            parameter_id,
            position,
            option_group_id,
            task_parameter:task_parameters (
              id,
              name,
              label,
              type
            )
          )
        `)
        .eq('task_group_id', taskGroupId)
        .single();
      
      console.log('🔍 Resultado búsqueda plantilla:', { data, error });
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!taskGroupId
  });

  // Fetch available parameters
  const { data: availableParameters = [] } = useQuery({
    queryKey: ['task-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .order('label');
      
      if (error) throw error;
      return data;
    }
  });

  // Parameter option groups for selected parameter
  const { data: parameterOptionGroups = [] } = useQuery({
    queryKey: ['parameter-option-groups', newParameterId],
    queryFn: async () => {
      if (!newParameterId) return [];
      
      const { data, error } = await supabase
        .from('task_parameter_option_groups')
        .select('*')
        .eq('parameter_id', newParameterId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!newParameterId
  });

  // Función para generar vista previa
  const generatePreview = () => {
    const baseName = taskGroupName || 'Nombre del grupo';
    
    if (!template) return `${baseName}.`;
    
    if (templateParameters.length === 0) {
      return `${baseName}.`;
    }
    
    const parameterPlaceholders = templateParameters
      .map(tp => {
        const parameter = availableParameters.find(p => p.id === tp.parameter_id);
        return `{{${parameter?.name || 'parámetro'}}}`;
      })
      .join(' ');
    
    return `${baseName} ${parameterPlaceholders}.`;
  };

  // Save parameters mutation
  const saveParametersMutation = useMutation({
    mutationFn: async () => {
      if (!template?.id) throw new Error('No template found');
      
      console.log('💾 Iniciando guardado de plantilla:', template.id);
      console.log('💾 Parámetros a guardar:', templateParameters);
      
      // First, delete existing parameters
      const { error: deleteError } = await supabase
        .from('task_template_parameters')
        .delete()
        .eq('template_id', template.id);
      
      if (deleteError) {
        console.error('❌ Error eliminando parámetros existentes:', deleteError);
        throw deleteError;
      }
      
      // Then insert new parameters if any
      if (templateParameters.length > 0) {
        const parametersToInsert = templateParameters.map((param, index) => ({
          template_id: template.id,
          parameter_id: param.parameter_id,
          position: index,
          option_group_id: param.option_group_id
        }));
        
        console.log('💾 Insertando nuevos parámetros:', parametersToInsert);
        
        const { error: insertError } = await supabase
          .from('task_template_parameters')
          .insert(parametersToInsert);
        
        if (insertError) {
          console.error('❌ Error insertando parámetros:', insertError);
          throw insertError;
        }
      }
      
      // Finally, update the template name with the generated preview
      const finalName = generatePreview();
      console.log('💾 Actualizando nombre plantilla a:', finalName);
      
      const { error: updateError } = await supabase
        .from('task_templates')
        .update({ name_template: finalName })
        .eq('id', template.id);
      
      if (updateError) {
        console.error('❌ Error actualizando nombre plantilla:', updateError);
        throw updateError;
      }
      
      console.log('✅ Plantilla guardada exitosamente');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast({
        title: "Plantilla guardada",
        description: "La plantilla se ha guardado exitosamente con todos sus parámetros",
        variant: "default"
      });
      closeModal();
    },
    onError: (error: any) => {
      console.error('❌ Error general en saveParametersMutation:', error);
      toast({
        title: "Error al guardar",
        description: error.message || "Error al guardar la plantilla",
        variant: "destructive"
      });
    }
  });

  // Set initial values when template loads
  React.useEffect(() => {
    if (template) {
      // Convertir a la estructura esperada
      const parameters = (template.task_template_parameters || []).map((tp, index) => ({
        id: tp.id,
        parameter_id: tp.parameter_id,
        template_id: tp.template_id,
        position: index,
        option_group_id: tp.option_group_id
      }));
      setTemplateParameters(parameters);
    }
  }, [template]);

  // Función para agregar parámetro
  const handleAddParameter = () => {
    if (template?.id && newParameterId) {
      const newParam = {
        id: `temp-${Date.now()}`,
        parameter_id: newParameterId,
        template_id: template.id,
        position: templateParameters.length,
        option_group_id: newOptionGroupId || null,
      };
      setTemplateParameters(prev => [...prev, newParam]);
      setNewParameterId('');
      setNewOptionGroupId('');
    }
  };

  // Función para remover parámetro
  const handleRemoveParameter = (id: string) => {
    setTemplateParameters(prev => prev.filter(p => p.id !== id));
  };

  // Función para drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTemplateParameters((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        // Actualizar posiciones
        return reorderedItems.map((item, index) => ({
          ...item,
          position: index
        }));
      });
    }
  };

  if (templateLoading) {
    return (
      <FormModalLayout
        columns={1}
        editPanel={<div className="flex items-center justify-center py-8">Cargando plantilla...</div>}
        headerContent={
          <FormModalHeader 
            title="Configurar Plantilla"
            icon={Settings}
          />
        }
        footerContent={
          <FormModalFooter
            leftLabel="Cancelar"
            onLeftClick={closeModal}
          />
        }
        onClose={closeModal}
      />
    );
  }

  if (!template) {
    return (
      <FormModalLayout
        columns={1}
        editPanel={
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Plantilla</h3>
            <p className="text-sm text-muted-foreground">
              Este grupo de tareas no tiene una plantilla asociada.
              <br />
              Primero debes crear la plantilla desde la página de categorías.
            </p>
          </div>
        }
        headerContent={
          <FormModalHeader 
            title="Configurar Plantilla"
            icon={Settings}
          />
        }
        footerContent={
          <FormModalFooter
            leftLabel="Cerrar"
            onLeftClick={closeModal}
          />
        }
        onClose={closeModal}
      />
    );
  }

  const editPanel = (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">Vista Previa de la Plantilla</h3>
        <p className="text-xs text-muted-foreground">
          Así se verá el nombre de la tarea generada
        </p>
      </div>
      
      <div className="text-sm font-medium bg-muted/30 p-3 rounded border-2 border-dashed border-[var(--accent)]">
        <span>
          {generatePreview()}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground">Agregar Parámetros</h3>
        <p className="text-xs text-muted-foreground">
          Define los parámetros que se mostrarán al crear tareas
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Parámetro</Label>
            <ComboBox
              value={newParameterId}
              onValueChange={(value) => {
                setNewParameterId(value);
                setNewOptionGroupId('');
              }}
              options={availableParameters.map((parameter) => ({
                value: parameter.id,
                label: `${parameter.label || parameter.name} (${parameter.type})`
              }))}
              placeholder="Buscar parámetro..."
              searchPlaceholder="Escribir para buscar..."
              emptyMessage="No se encontraron parámetros"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Grupo de Opciones</Label>
            <Select 
              value={newOptionGroupId} 
              onValueChange={setNewOptionGroupId}
              disabled={!newParameterId || parameterOptionGroups.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !newParameterId 
                    ? "Primero selecciona parámetro"
                    : parameterOptionGroups.length === 0
                    ? "Sin grupos disponibles"
                    : "Seleccionar grupo"
                } />
              </SelectTrigger>
              <SelectContent>
                {parameterOptionGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={handleAddParameter}
          disabled={!newParameterId}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de parámetros con drag & drop */}
      {templateParameters.length > 0 && (
        <>
          <div>
            <h3 className="text-sm font-medium text-foreground">Parámetros Configurados</h3>
            <p className="text-xs text-muted-foreground">
              Arrastra para reordenar los parámetros
            </p>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={templateParameters.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {templateParameters.map((param) => {
                  const parameter = availableParameters.find(p => p.id === param.parameter_id);
                  return (
                    <SortableParameterItem
                      key={param.id}
                      param={param}
                      parameter={parameter}
                      onRemove={handleRemoveParameter}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title="Configurar Plantilla"
      icon={Settings}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={closeModal}
      rightLabel="Guardar Plantilla"
      onRightClick={() => saveParametersMutation.mutate()}
      rightLoading={saveParametersMutation.isPending}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={closeModal}
      isEditing={true}
    />
  );
}