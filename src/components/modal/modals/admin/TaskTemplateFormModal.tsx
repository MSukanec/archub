import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Check } from 'lucide-react';
import { useUnits } from '@/hooks/use-units';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalFooter } from '../../form/FormModalFooter';
import { TaskTemplate, TaskTemplateParameter, TaskParameter } from '@shared/schema';

interface TaskTemplateFormModalProps {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  taskGroupId?: string;
  taskGroupName?: string;
}

interface TaskTemplateParameterWithParameter extends TaskTemplateParameter {
  parameter: TaskParameter;
}

interface TaskParameterOptionGroup {
  id: string;
  parameter_id: string;
  name: string;
}

// Sortable Parameter Item Component
function SortableParameterItem({ 
  parameter, 
  index, 
  onDelete 
}: { 
  parameter: any; 
  index: number; 
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: parameter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center justify-between bg-muted/30 p-2 rounded border"
    >
      <div className="flex items-center gap-2">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Badge variant="outline" className="text-xs">
          {index + 1}
        </Badge>
        <span className="text-sm">{parameter.task_parameters?.name || 'Parámetro'}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(parameter.id)}
        className="h-8 w-8 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function TaskTemplateFormModal({
  categoryId,
  categoryCode,
  categoryName,
  taskGroupId,
  taskGroupName
}: TaskTemplateFormModalProps) {
  const [currentStep, setCurrentStep] = useState<'created' | 'unit' | 'parameters'>('created');
  const [newParameterId, setNewParameterId] = useState('');
  const [newOptionGroupId, setNewOptionGroupId] = useState('');
  const queryClient = useQueryClient();
  
  // Load units
  const { data: units = [] } = useUnits();

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load existing template for this category or task group
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['task-template', taskGroupId || categoryCode],
    queryFn: async () => {
      console.log('🔍 Buscando plantilla para task_group_id:', taskGroupId);
      
      let query = supabase
        .from('task_templates')
        .select('*')
        .single();

      if (taskGroupId) {
        query = query.eq('task_group_id', taskGroupId);
      } else {
        query = query.eq('category_id', categoryId);
      }

      const result = await query;
      console.log('🔍 Resultado búsqueda plantilla:', result);
      
      if (result.error && result.error.code !== 'PGRST116') {
        throw result.error;
      }
      
      return result.data;
    }
  });

  // Load template parameters
  const { data: templateParameters = [], isLoading: parametersLoading } = useQuery({
    queryKey: ['task-template-parameters', template?.id],
    queryFn: async () => {
      if (!template?.id) return [];
      
      const { data, error } = await supabase
        .from('task_template_parameters')
        .select(`
          *,
          task_parameters:parameter_id (
            id,
            name,
            description
          )
        `)
        .eq('template_id', template.id)
        .order('position');

      if (error) throw error;
      return data as TaskTemplateParameterWithParameter[];
    },
    enabled: !!template?.id
  });

  // Load all available parameters
  const { data: allParameters = [] } = useQuery({
    queryKey: ['admin-task-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as TaskParameter[];
    }
  });

  // Load parameter option groups
  const { data: optionGroups = [] } = useQuery({
    queryKey: ['task-parameter-option-groups', newParameterId],
    queryFn: async () => {
      if (!newParameterId) return [];
      
      const { data, error } = await supabase
        .from('task_parameter_option_groups')
        .select('*')
        .eq('parameter_id', newParameterId)
        .order('name');

      if (error) throw error;
      return data as TaskParameterOptionGroup[];
    },
    enabled: !!newParameterId
  });

  // Generate dynamic preview based on task group name and added parameters
  const generatePreview = () => {
    const baseName = taskGroupName || categoryName;
    
    if (!template) return `${baseName}.`;
    
    if (templateParameters.length === 0) {
      return `${baseName}.`;
    }
    
    const parameterPlaceholders = templateParameters
      .map(tp => `{{${tp.task_parameters?.name || 'parámetro'}}}`)
      .join(' ');
    
    return `${baseName} ${parameterPlaceholders}.`;
  };

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const templateData = {
        name_template: generatePreview(),
        category_id: taskGroupId ? null : categoryId,
        task_group_id: taskGroupId || null,
        unit_id: null,
        task_code: categoryCode
      };

      const { data, error } = await supabase
        .from('task_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      setCurrentStep('unit');
      toast({
        title: "Plantilla creada",
        description: "La plantilla se ha creado correctamente",
        variant: "default"
      });
    }
  });

  // Update template unit_id mutation
  const updateTemplateUnitMutation = useMutation({
    mutationFn: async (unitId: string | null) => {
      if (!template?.id) throw new Error('No template selected');
      
      const { error } = await supabase
        .from('task_templates')
        .update({ unit_id: unitId })
        .eq('id', template.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
      setCurrentStep('parameters');
    }
  });

  // Add parameter mutation
  const addParameterMutation = useMutation({
    mutationFn: async () => {
      if (!template?.id || !newParameterId) throw new Error('Missing data');
      
      const newPosition = templateParameters.length;
      
      const templateParameterData = {
        template_id: template.id,
        parameter_id: newParameterId,
        position: newPosition,
        option_group_id: newOptionGroupId || null
      };

      const { data, error } = await supabase
        .from('task_template_parameters')
        .insert(templateParameterData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', template?.id] });
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
      setNewParameterId('');
      setNewOptionGroupId('');
    }
  });

  // Delete parameter mutation
  const deleteParameterMutation = useMutation({
    mutationFn: async (parameterId: string) => {
      const { error } = await supabase
        .from('task_template_parameters')
        .delete()
        .eq('id', parameterId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', template?.id] });
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
    }
  });

  // Update parameter positions mutation
  const updatePositionsMutation = useMutation({
    mutationFn: async (parameters: any[]) => {
      const updates = parameters.map((param, index) => 
        supabase
          .from('task_template_parameters')
          .update({ position: index })
          .eq('id', param.id)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Error updating positions');
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', template?.id] });
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
    }
  });

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = templateParameters.findIndex(p => p.id === active.id);
      const newIndex = templateParameters.findIndex(p => p.id === over.id);
      
      const newParameters = arrayMove(templateParameters, oldIndex, newIndex);
      updatePositionsMutation.mutate(newParameters);
    }
  };

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!template?.id) return;

      // First delete template parameters
      await supabase
        .from('task_template_parameters')
        .delete()
        .eq('template_id', template.id);

      // Then delete template
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      setCurrentStep('created');
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se ha eliminado correctamente",
        variant: "default"
      });
    }
  });

  // Step 1: Template Creation Status
  const renderCreatedStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {template ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
          )}
          <span className="font-medium">Plantilla Creada</span>
        </div>
        {template && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteTemplateMutation.mutate()}
            disabled={deleteTemplateMutation.isPending}
          >
            Eliminar
          </Button>
        )}
      </div>
      
      {template ? (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            {generatePreview()}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Categoría: {taskGroupName ? `${categoryName} > ${taskGroupName}` : categoryName} | Parámetros: {templateParameters.length}
          </p>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <p className="text-muted-foreground mb-4">
            No se ha creado ninguna plantilla para esta {taskGroupId ? 'grupo de tareas' : 'categoría'}
          </p>
          <Button 
            onClick={() => createTemplateMutation.mutate()}
            disabled={createTemplateMutation.isPending}
          >
            Crear Plantilla
          </Button>
        </div>
      )}
    </div>
  );

  // Step 2: Unit Selection
  const renderUnitStep = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Paso 2: Unidad</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona la unidad de medida para esta plantilla
        </p>
      </div>

      <div className="space-y-4">
        <Label htmlFor="unit-select">Unidad</Label>
        <Select
          value={template?.unit_id || ''}
          onValueChange={(value) => updateTemplateUnitMutation.mutate(value || null)}
          disabled={updateTemplateUnitMutation.isPending || !template}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar unidad" />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.name} ({unit.symbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Step 3: Parameters Management
  const renderParametersStep = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Paso 3: Agregar Parámetros</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Agrega y organiza parámetros para personalizar la plantilla
        </p>
      </div>

      {/* Add parameter form */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Parámetro</Label>
          <Select value={newParameterId} onValueChange={setNewParameterId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar parámetro" />
            </SelectTrigger>
            <SelectContent>
              {allParameters
                .filter(p => !templateParameters.some(tp => tp.parameter_id === p.id))
                .map((param) => (
                  <SelectItem key={param.id} value={param.id}>
                    {param.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Grupo de Opciones</Label>
          <Select value={newOptionGroupId} onValueChange={setNewOptionGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="Primero selecciona parámetro" />
            </SelectTrigger>
            <SelectContent>
              {optionGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={() => addParameterMutation.mutate()}
        disabled={!newParameterId || addParameterMutation.isPending}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar
      </Button>

      {/* Parameters list */}
      <div className="space-y-4">
        <Label>Parámetros de la plantilla ({templateParameters.length}):</Label>
        
        {templateParameters.length > 0 ? (
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
                {templateParameters.map((param, index) => (
                  <SortableParameterItem
                    key={param.id}
                    parameter={param}
                    index={index}
                    onDelete={(id) => deleteParameterMutation.mutate(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded">
            No hay parámetros agregados
          </p>
        )}
      </div>

      {/* Preview */}
      {template && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Vista previa:</Label>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 font-mono">
            {generatePreview()}
          </p>
        </div>
      )}
    </div>
  );

  const editPanel = (
    <div className="space-y-6">
      {/* Step Navigation */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant={currentStep === 'created' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentStep('created')}
          >
            1
          </Button>
          <Button
            variant={currentStep === 'unit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentStep('unit')}
            disabled={!template}
          >
            2
          </Button>
          <Button
            variant={currentStep === 'parameters' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentStep('parameters')}
            disabled={!template}
          >
            3
          </Button>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'created' && renderCreatedStep()}
      {currentStep === 'unit' && renderUnitStep()}
      {currentStep === 'parameters' && renderParametersStep()}
    </div>
  );

  const title = `Editor de Plantilla - ${taskGroupName || categoryName}`;

  return (
    <FormModalLayout
      title={title}
      editPanel={editPanel}
      viewPanel={null}
      isEditing={true}
      footer={
        <FormModalFooter
          onCancel={() => {}}
          onSave={() => {}}
          saveLabel="Guardar"
          isLoading={false}
          showSave={false}
        />
      }
    />
  );
}