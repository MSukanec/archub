import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { DropResult } from 'react-beautiful-dnd';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TaskTemplate, TaskTemplateParameter, TaskParameter } from '@shared/schema';

interface TaskTemplateEditorModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
}

interface TaskTemplateParameterWithParameter extends TaskTemplateParameter {
  parameter: TaskParameter;
}

interface TaskParameterOptionGroup {
  id: string;
  parameter_id: string;
  name: string;
}

export default function TaskTemplateEditorModal({
  open,
  onClose,
  categoryId,
  categoryCode,
  categoryName
}: TaskTemplateEditorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newParameterId, setNewParameterId] = useState<string>('');
  const [newOptionGroupId, setNewOptionGroupId] = useState<string>('');
  const [hasTriedCreateTemplate, setHasTriedCreateTemplate] = useState(false);

  // Fetch existing template
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['task-template', categoryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('id, code, name, name_template, category_id, created_at')
        .eq('code', categoryCode)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
    enabled: open
  });

  // Fetch template parameters
  const { data: templateParameters = [], isLoading: parametersLoading } = useQuery({
    queryKey: ['task-template-parameters', template?.id],
    queryFn: async () => {
      if (!template?.id) return [];
      
      const { data, error } = await supabase
        .from('task_template_parameters')
        .select(`
          id,
          template_id,
          parameter_id,
          option_group_id,
          is_required,
          position,
          role,
          expression_template,
          parameter:task_parameters(
            id,
            name,
            label,
            type,
            unit
          )
        `)
        .eq('template_id', template.id)
        .order('position');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!template?.id && open
  });

  // Fetch all available parameters
  const { data: availableParameters = [] } = useQuery({
    queryKey: ['task-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  // Fetch option groups for selected parameter
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
      return data || [];
    },
    enabled: !!newParameterId && open
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .insert({
          code_prefix: categoryCode,
          name: `Plantilla de ${categoryName}`,
          name_template: `Ejecución de ${categoryName} {{material}} {{dimension}}`,
          category_id: categoryId
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template', categoryCode] });
      setHasTriedCreateTemplate(true);
      toast({
        title: 'Plantilla creada',
        description: `Plantilla ${categoryCode} creada exitosamente`
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al crear la plantilla'
      });
    }
  });

  // Add parameter mutation
  const addParameterMutation = useMutation({
    mutationFn: async ({ parameterId, optionGroupId }: { parameterId: string; optionGroupId?: string }) => {
      if (!template?.id) throw new Error('No template found');
      
      const maxPosition = Math.max(...templateParameters.map(p => p.position), 0);
      
      const { data, error } = await supabase
        .from('task_template_parameters')
        .insert({
          template_id: template.id,
          parameter_id: parameterId,
          option_group_id: optionGroupId || null,
          is_required: false,
          position: maxPosition + 1
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', template?.id] });
      setNewParameterId('');
      setNewOptionGroupId('');
      toast({
        title: 'Parámetro agregado',
        description: 'Parámetro agregado a la plantilla exitosamente'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al agregar parámetro'
      });
    }
  });

  // Update parameter mutation
  const updateParameterMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskTemplateParameter> }) => {
      const { data, error } = await supabase
        .from('task_template_parameters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', template?.id] });
      toast({
        title: 'Parámetro actualizado',
        description: 'Parámetro actualizado exitosamente'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al actualizar parámetro'
      });
    }
  });

  // Delete parameter mutation
  const deleteParameterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_template_parameters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', template?.id] });
      toast({
        title: 'Parámetro eliminado',
        description: 'Parámetro eliminado de la plantilla'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al eliminar parámetro'
      });
    }
  });

  const updatePositionsMutation = useMutation({
    mutationFn: async (updates: { id: string; position: number }[]) => {
      if (!supabase) throw new Error('Supabase not available');
      
      // Update positions in batch
      for (const update of updates) {
        const { error } = await supabase
          .from('task_template_parameters')
          .update({ position: update.position })
          .eq('id', update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', template?.id] });
      toast({
        title: 'Orden actualizado',
        description: 'El orden de los parámetros ha sido actualizado correctamente.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el orden',
        variant: 'destructive'
      });
    }
  });

  // Auto-create template if it doesn't exist
  useEffect(() => {
    if (open && !templateLoading && !template && !hasTriedCreateTemplate && !createTemplateMutation.isPending) {
      createTemplateMutation.mutate();
    }
  }, [open, templateLoading, template, hasTriedCreateTemplate, createTemplateMutation.isPending]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setHasTriedCreateTemplate(false);
    } else {
      setNewParameterId('');
      setNewOptionGroupId('');
      setHasTriedCreateTemplate(false);
    }
  }, [open]);

  const handleCreateTemplate = () => {
    createTemplateMutation.mutate();
  };

  const handleAddParameter = () => {
    if (!newParameterId) return;
    
    const selectedParameter = availableParameters.find(p => p.id === newParameterId);
    const requiresOptionGroup = selectedParameter?.type === 'select';
    
    if (requiresOptionGroup && !newOptionGroupId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe seleccionar un grupo de opciones para parámetros de tipo select'
      });
      return;
    }
    
    addParameterMutation.mutate({
      parameterId: newParameterId,
      optionGroupId: requiresOptionGroup ? newOptionGroupId : undefined
    });
  };

  const handleToggleRequired = (parameter: TaskTemplateParameter) => {
    updateParameterMutation.mutate({
      id: parameter.id,
      updates: { is_required: !parameter.is_required }
    });
  };

  const handleDeleteParameter = (id: string) => {
    deleteParameterMutation.mutate(id);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !template) return

    const items = Array.from(templateParameters)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update positions locally first for immediate UI feedback
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index + 1
    }))

    // Update positions in database
    updatePositionsMutation.mutate(updatedItems.map(item => ({
      id: item.id,
      position: item.position
    })))
  };

  // Generate preview sentence
  const generatePreviewSentence = () => {
    if (!templateParameters.length) {
      return { sentence: `${categoryName}.`, missingTemplates: [] };
    }

    // Sort parameters by position
    const sortedParams = [...templateParameters].sort((a, b) => a.position - b.position);
    
    // Get sample values for different parameter types
    const getSampleValue = (param: TaskTemplateParameter) => {
      if (!param.parameter) return "Ejemplo";
      
      switch (param.parameter.type) {
        case 'text':
          return param.parameter.name === 'brick_type' ? 'Ladrillo Hueco' : 
                 param.parameter.name === 'material' ? 'Hormigón' : 'Ejemplo';
        case 'number':
          return param.parameter.name.includes('thickness') || param.parameter.name.includes('espesor') ? '12cm' :
                 param.parameter.name.includes('height') || param.parameter.name.includes('altura') ? '2.50m' : '10';
        case 'select':
          return param.parameter.name === 'marcas' ? 'Klaukol' :
                 param.parameter.name === 'brands' ? 'Klaukol' :
                 param.parameter.name === 'colors' ? 'Blanco' : 'Opción';
        case 'boolean':
          return 'Sí';
        default:
          return 'Ejemplo';
      }
    };

    // Build sentence parts
    let sentence = categoryName;
    const missingTemplates: string[] = [];

    sortedParams.forEach(param => {
      if (param.expression_template && param.expression_template.trim() && param.expression_template !== 'NULL') {
        const sampleValue = getSampleValue(param);
        const fragment = param.expression_template.replace(/{value}/g, sampleValue);
        sentence += ` ${fragment}`;
      } else {
        missingTemplates.push(param.parameter?.label || param.parameter?.name || 'parámetro');
      }
    });

    sentence += '.';
    
    return { sentence, missingTemplates };
  };

  const previewResult = generatePreviewSentence();

  if (!open) return null;

  const selectedParameter = availableParameters.find(p => p.id === newParameterId);
  const showOptionGroups = selectedParameter?.type === 'select';

  return (
    <CustomModalLayout open={open} onClose={onClose} className="md:max-w-5xl">
      {{
        header: (
          <CustomModalHeader
            title={`Editor de Plantilla - ${categoryCode}`}
            subtitle={`${categoryName} • Gestionar parámetros de la plantilla`}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody columns={1} className="overflow-visible">
            <div className="space-y-6">
              {/* Paso 1: Crear Plantilla */}
              {!template && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-center space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Paso 1: Crear Plantilla</h3>
                      <p className="text-sm text-muted-foreground">
                        Primero debes crear la plantilla básica para {categoryName}
                      </p>
                    </div>
                    <Button 
                      onClick={() => createTemplateMutation.mutate()}
                      disabled={createTemplateMutation.isPending}
                      size="lg"
                      className="w-full max-w-sm"
                    >
                      {createTemplateMutation.isPending ? "Creando..." : "CREAR PLANTILLA"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Paso 2: Agregar Parámetros (solo si la plantilla existe) */}
              {template && (
                <>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3">Paso 2: Agregar Parámetros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Parámetro</Label>
                  <Select value={newParameterId} onValueChange={setNewParameterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar parámetro" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableParameters
                        .filter(p => !templateParameters.some(tp => tp.parameter_id === p.id))
                        .map((parameter) => (
                          <SelectItem key={parameter.id} value={parameter.id}>
                            {parameter.label || parameter.name} ({parameter.type})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {showOptionGroups && (
                  <div className="space-y-2">
                    <Label>Grupo de Opciones</Label>
                    <Select value={newOptionGroupId} onValueChange={setNewOptionGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar grupo" />
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
                )}
                
                    <div className="flex items-end">
                      <Button 
                        onClick={handleAddParameter}
                        disabled={!newParameterId || addParameterMutation.isPending || (showOptionGroups && !newOptionGroupId)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Parámetros con Drag and Drop (solo si la plantilla existe) */}
              {template && (
                parametersLoading ? (
                <div className="text-sm text-muted-foreground">Cargando parámetros...</div>
              ) : templateParameters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay parámetros agregados a esta plantilla</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="parameters">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {templateParameters.map((param, index) => (
                          <Draggable key={param.id} draggableId={param.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-3 p-4 border rounded-lg bg-muted/30 ${
                                  snapshot.isDragging ? 'shadow-lg bg-card' : ''
                                }`}
                              >
                                <div 
                                  {...provided.dragHandleProps}
                                  className="flex items-center gap-2 text-muted-foreground cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-4 w-4" />
                                  <span className="text-xs font-mono">{index + 1}</span>
                                </div>
                                
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                  <div>
                                    <div className="font-medium">{param.parameter.label || param.parameter.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {param.parameter.type}
                                      </Badge>
                                      {param.parameter.unit && (
                                        <span className="text-xs">({param.parameter.unit})</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Obligatorio:</Label>
                                    <Switch
                                      checked={param.is_required}
                                      onCheckedChange={() => handleToggleRequired(param)}
                                      disabled={updateParameterMutation.isPending}
                                    />
                                  </div>
                                  
                                  <div className="flex items-center justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteParameter(param.id)}
                                      disabled={deleteParameterMutation.isPending}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ))}

              {/* Vista Previa de la Frase Generada */}
              {template && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-foreground mb-2 block">
                        Vista previa de la frase generada:
                      </Label>
                      <div className="text-sm bg-background p-3 rounded border">
                        <span className="font-medium text-foreground">
                          {previewResult.sentence}
                        </span>
                      </div>
                      
                      {/* Advertencias si faltan expression_template */}
                      {previewResult.missingTemplates.length > 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-500 flex-shrink-0 mt-0.5">
                              <span className="text-xs text-white font-bold block text-center">!</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Parámetros sin plantilla de expresión:
                              </p>
                              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                {previewResult.missingTemplates.join(', ')}
                              </p>
                              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                Agrega un <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">expression_template</code> para que aparezcan en la frase final.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Información de ayuda */}
                      <div className="mt-3 text-xs text-muted-foreground">
                        <p>• La frase se genera automáticamente al crear tareas usando esta plantilla</p>
                        <p>• Los valores mostrados son ejemplos - en tareas reales se usarán los valores seleccionados</p>
                        <p>• Los parámetros se ordenan según su posición (arrastra para reordenar)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter 
            onCancel={onClose}
            onSave={onClose}
            cancelText="Cancelar"
            saveText="Guardar"
          />
        )
      }}
    </CustomModalLayout>
  );
}