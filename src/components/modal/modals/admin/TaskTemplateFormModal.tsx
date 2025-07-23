import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalStepHeader } from '../../form/FormModalStepHeader';
import { FormModalStepFooter } from '../../form/FormModalStepFooter';
import { StepModalConfig, StepModalFooterConfig } from '../../form/types';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';
import { TaskTemplate, TaskTemplateParameter, TaskParameter } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, GripVertical, Plus, FileText } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskTemplateFormModalProps {
  categoryId?: string;
  categoryCode?: string;
  categoryName?: string;
  taskGroupId?: string;
  taskGroupName?: string;
}

interface SortableParameterProps {
  parameter: TaskTemplateParameter & { task_parameter: TaskParameter };
  onRemove: (id: string) => void;
  onToggleRequired: (id: string, required: boolean) => void;
}

function SortableParameter({ parameter, onRemove, onToggleRequired }: SortableParameterProps) {
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
      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
    >
      <div className="flex items-center gap-3 flex-1">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{parameter.task_parameter.name}</span>
            {parameter.required && <Badge variant="secondary" className="text-xs">Obligatorio</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{parameter.task_parameter.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={parameter.required}
          onCheckedChange={(checked) => onToggleRequired(parameter.id, checked as boolean)}
        />
        <Label className="text-sm">Obligatorio</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(parameter.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
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
  const [currentStep, setCurrentStep] = useState(1);
  const { closeModal } = useGlobalModalStore();
  const queryClient = useQueryClient();

  // Template data
  const [selectedUnit, setSelectedUnit] = useState('');
  const [templateParameters, setTemplateParameters] = useState<(TaskTemplateParameter & { task_parameter: TaskParameter })[]>([]);

  // Fetch existing template
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['task-template', taskGroupId || categoryCode],
    queryFn: async () => {
      console.log('🔍 Buscando plantilla para task_group_id:', taskGroupId);
      
      const { data, error } = await supabase
        .from('task_templates')
        .select(`
          *,
          task_template_parameters (
            *,
            task_parameter:task_parameters (*)
          )
        `)
        .eq(taskGroupId ? 'task_group_id' : 'category_id', taskGroupId || categoryId)
        .single();

      console.log('🔍 Resultado búsqueda plantilla:', { data, error });
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!taskGroupId || !!categoryId
  });

  // Fetch units
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch available parameters
  const { data: availableParameters = [] } = useQuery({
    queryKey: ['task-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const templateData = {
        name: taskGroupName || categoryName || 'Plantilla',
        description: `Plantilla para ${taskGroupName || categoryName}`,
        category_id: categoryId,
        task_group_id: taskGroupId || null
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
      setCurrentStep(2);
      toast({
        title: "Plantilla creada",
        description: "La plantilla se ha creado correctamente",
        variant: "default"
      });
    }
  });

  // Update unit mutation
  const updateUnitMutation = useMutation({
    mutationFn: async () => {
      if (!template) throw new Error('No template found');
      
      const { error } = await supabase
        .from('task_templates')
        .update({ unit_id: selectedUnit })
        .eq('id', template.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
      setCurrentStep(3);
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!template) throw new Error('No template found');
      
      // First delete parameters
      const { error: paramError } = await supabase
        .from('task_template_parameters')
        .delete()
        .eq('task_template_id', template.id);
      
      if (paramError) throw paramError;
      
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
      setCurrentStep(1);
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se ha eliminado correctamente",
        variant: "default"
      });
    }
  });

  // Set initial values when template loads
  React.useEffect(() => {
    if (template) {
      setSelectedUnit(template.unit_id || '');
      setTemplateParameters(template.task_template_parameters || []);
      setCurrentStep(template.unit_id ? 3 : 2);
    }
  }, [template]);

  // Step configuration
  const stepConfig: StepModalConfig = {
    currentStep,
    totalSteps: 3,
    stepTitle: currentStep === 1 ? 'Crear Plantilla' : currentStep === 2 ? 'Seleccionar Unidad' : 'Configurar Parámetros'
  };

  // Footer configuration
  const getFooterConfig = (): StepModalFooterConfig => {
    switch (currentStep) {
      case 1:
        return template ? {
          cancelAction: { label: 'Cancelar', onClick: closeModal },
          submitAction: { 
            label: 'Eliminar Plantilla', 
            onClick: () => deleteTemplateMutation.mutate(),
            loading: deleteTemplateMutation.isPending,
            variant: 'destructive'
          }
        } : {
          cancelAction: { label: 'Cancelar', onClick: closeModal },
          submitAction: { 
            label: 'Crear Plantilla', 
            onClick: () => createTemplateMutation.mutate(),
            loading: createTemplateMutation.isPending
          }
        };
      case 2:
        return {
          cancelAction: { label: 'Cancelar', onClick: closeModal },
          previousAction: { label: 'Anterior', onClick: () => setCurrentStep(1) },
          nextAction: { 
            label: 'Siguiente', 
            onClick: () => updateUnitMutation.mutate(),
            loading: updateUnitMutation.isPending
          }
        };
      case 3:
        return {
          cancelAction: { label: 'Cancelar', onClick: closeModal },
          previousAction: { label: 'Anterior', onClick: () => setCurrentStep(2) },
          submitAction: { label: 'Finalizar', onClick: closeModal }
        };
      default:
        return {
          cancelAction: { label: 'Cancelar', onClick: closeModal }
        };
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {template ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">Plantilla Creada</h3>
                      <p className="text-sm text-muted-foreground">Ya existe una plantilla para esta grupo de tareas</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Grupo</Label>
                      <p className="text-sm mt-1">{taskGroupName || categoryName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Plantilla</Label>
                      <p className="text-sm mt-1">{template.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">No se ha creado ninguna plantilla para esta grupo de tareas</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Para: <strong>{taskGroupName || categoryName}</strong>
                    </p>
                  </div>
                  

                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Seleccionar Unidad</h3>
                  <p className="text-sm text-muted-foreground">
                    Elige la unidad de medida para esta plantilla
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="unit">Unidad de medida *</Label>
                    <Select value={selectedUnit} onValueChange={setSelectedUnit}>
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
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Configurar Parámetros</h3>
                  <p className="text-sm text-muted-foreground">
                    Define los parámetros que se mostrarán al crear tareas con esta plantilla
                  </p>
                </div>
                
                <div className="space-y-4">
                  {templateParameters.length > 0 && (
                    <DndContext
                      sensors={useSensors(
                        useSensor(PointerSensor),
                        useSensor(KeyboardSensor, {
                          coordinateGetter: sortableKeyboardCoordinates,
                        })
                      )}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => {
                        const { active, over } = event;
                        if (active.id !== over?.id) {
                          setTemplateParameters((items) => {
                            const oldIndex = items.findIndex((item) => item.id === active.id);
                            const newIndex = items.findIndex((item) => item.id === over?.id);
                            return arrayMove(items, oldIndex, newIndex);
                          });
                        }
                      }}
                    >
                      <SortableContext items={templateParameters} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {templateParameters.map((param) => (
                            <SortableParameter
                              key={param.id}
                              parameter={param}
                              onRemove={(id) => {
                                setTemplateParameters(params => params.filter(p => p.id !== id));
                              }}
                              onToggleRequired={(id, required) => {
                                setTemplateParameters(params => 
                                  params.map(p => p.id === id ? { ...p, required } : p)
                                );
                              }}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                  
                  <div>
                    <Label>Agregar parámetro</Label>
                    <Select onValueChange={(value) => {
                      const parameter = availableParameters.find(p => p.id === value);
                      if (parameter && !templateParameters.find(tp => tp.task_parameter_id === parameter.id)) {
                        const newParam = {
                          id: `temp-${Date.now()}`,
                          task_template_id: template?.id || '',
                          task_parameter_id: parameter.id,
                          required: false,
                          order_index: templateParameters.length,
                          task_parameter: parameter
                        };
                        setTemplateParameters(prev => [...prev, newParam]);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar parámetro" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableParameters
                          .filter(param => !templateParameters.find(tp => tp.task_parameter_id === param.id))
                          .map((param) => (
                            <SelectItem key={param.id} value={param.id}>
                              {param.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const headerContent = (
    <FormModalStepHeader
      title="Editor de Plantilla"
      icon={FileText}
      stepConfig={stepConfig}
    />
  );

  const footerContent = (
    <FormModalStepFooter
      config={getFooterConfig()}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      editPanel={renderStepContent()}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={closeModal}
      isEditing={true}
    />
  );
}