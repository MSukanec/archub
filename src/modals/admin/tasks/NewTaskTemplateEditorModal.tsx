import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useUnits } from '@/hooks/use-units';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { TaskTemplate, TaskTemplateParameter, TaskParameter } from '@shared/schema';

interface TaskTemplateEditorModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  taskGroupId?: string; // NEW: Para plantillas de task groups
  taskGroupName?: string; // NEW: Para mostrar el nombre del grupo
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
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="w-6 h-6 bg-accent/20 text-accent-foreground rounded text-xs flex items-center justify-center font-medium">
          {index + 1}
        </div>
        <span className="text-sm font-medium">
          {parameter.task_parameters?.label || parameter.task_parameters?.name}
        </span>
        <Badge variant="outline" className="text-xs">
          {parameter.task_parameters?.type}
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(parameter.id)}
        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default function TaskTemplateEditorModal({
  open,
  onClose,
  categoryId,
  categoryCode,
  categoryName,
  taskGroupId,
  taskGroupName
}: TaskTemplateEditorModalProps) {
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

  // Generate dynamic preview based on task group name and added parameters
  const generatePreview = () => {
    // NEW: Use task group name instead of category name for template generation
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
      queryClient.invalidateQueries({ queryKey: ['admin-task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
    }
  });

  // Update template name_template mutation
  const updateTemplateNameMutation = useMutation({
    mutationFn: async (newNameTemplate: string) => {
      if (!template?.id) throw new Error('No template selected');
      
      const { error } = await supabase
        .from('task_templates')
        .update({ name_template: newNameTemplate })
        .eq('id', template.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      toast({
        title: "Plantilla actualizada",
        description: "La vista previa se ha guardado correctamente",
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
      queryClient.invalidateQueries({ queryKey: ['admin-task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      toast({
        title: "Unidad actualizada",
        description: "La unidad se ha guardado correctamente",
        variant: "default"
      });
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
      queryClient.invalidateQueries({ queryKey: ['admin-task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      toast({
        title: 'Parámetro eliminado',
        description: 'Parámetro eliminado exitosamente de la plantilla'
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

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = templateParameters.findIndex(param => param.id === active.id);
      const newIndex = templateParameters.findIndex(param => param.id === over.id);
      
      const reorderedParameters = arrayMove(templateParameters, oldIndex, newIndex);
      updatePositionsMutation.mutate(reorderedParameters);
    }
  };

  // Check if template exists - NEW: Buscar por task_group_id en lugar de categoryCode
  const { data: template, isLoading: templateLoading, error: templateError } = useQuery<TaskTemplate | null>({
    queryKey: ['task-template', taskGroupId || categoryCode],
    queryFn: async () => {
      if (taskGroupId) {
        // NEW: Buscar plantilla por task_group_id
        console.log('🔍 Buscando plantilla para task_group_id:', taskGroupId);
        const { data, error } = await supabase
          .from('task_templates')
          .select('*')
          .eq('task_group_id', taskGroupId)
          .maybeSingle();
        
        console.log('🔍 Resultado búsqueda plantilla:', { data, error });
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      } else {
        // LEGACY: Buscar por categoryCode (para compatibilidad)
        console.log('🔍 Buscando plantilla LEGACY para categoryCode:', categoryCode);
        const { data, error } = await supabase
          .from('task_templates')
          .select('*')
          .eq('code', categoryCode)
          .maybeSingle();
        
        console.log('🔍 Resultado búsqueda plantilla LEGACY:', { data, error });
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      }
    },
    enabled: open
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
  const { data: parameterOptionGroups = [] } = useQuery({
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
    enabled: open && !!newParameterId
  });

  // Fetch template parameters if template exists
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
          position,
          created_at,
          updated_at,
          task_parameters!inner (
            id,
            name,
            label,
            type,
            expression_template
          )
        `)
        .eq('template_id', template.id)
        .order('position');
      
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!template?.id
  });

  // Add parameter mutation
  const addParameterMutation = useMutation({
    mutationFn: async ({ parameterId, optionGroupId }: { parameterId: string; optionGroupId?: string }) => {
      if (!template?.id) throw new Error('No template selected');
      
      const { data, error } = await supabase
        .from('task_template_parameters')
        .insert({
          template_id: template.id,
          parameter_id: parameterId,
          option_group_id: optionGroupId || null,

          position: templateParameters.length,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', template?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      setNewParameterId('');
      setNewOptionGroupId('');
      toast({
        title: 'Parámetro agregado',
        description: 'Parámetro agregado exitosamente a la plantilla'
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

  // Create template mutation - NEW: Crear plantilla para task group
  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      if (taskGroupId) {
        // NEW: Crear plantilla para task group

        const insertData = {
          name_template: `${taskGroupName}.`,
          task_group_id: taskGroupId
        };

        
        const { data, error } = await supabase
          .from('task_templates')
          .insert(insertData)
          .select()
          .single();
        

        if (error) throw error;
        
        // CRITICAL: Actualizar el template_id en task_groups

        const { error: updateError } = await supabase
          .from('task_groups')
          .update({ template_id: data.id })
          .eq('id', taskGroupId);
        

        if (updateError) throw updateError;
        
        return data;
      } else {
        // LEGACY: Crear plantilla para categoría - Solo campos que existen en la tabla
        const { data, error } = await supabase
          .from('task_templates')
          .insert({
            name_template: `${categoryName}.`
          })
          .select()
          .single();
        

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries to update UI immediately
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['task-templates'] }); // CRITICAL: For AdminGeneratedTasks modal
      queryClient.invalidateQueries({ queryKey: ['task-categories-admin'] }); // CRITICAL: For categories tree
      queryClient.invalidateQueries({ queryKey: ['admin-task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      toast({
        title: 'Plantilla creada',
        description: `Plantilla creada exitosamente para ${taskGroupName || categoryName}`
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

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      // First delete all template parameters
      await supabase
        .from('task_template_parameters')
        .delete()
        .eq('template_id', templateId);
      
      // CRITICAL: Clear template_id from task_groups before deleting template
      if (taskGroupId) {

        const { error: clearError } = await supabase
          .from('task_groups')
          .update({ template_id: null })
          .eq('id', taskGroupId);
        

        if (clearError) throw clearError;
      }
      
      // Then delete the template
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', templateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all relevant queries to update UI immediately
      queryClient.invalidateQueries({ queryKey: ['task-template', taskGroupId || categoryCode] });
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['task-templates'] }); // CRITICAL: For AdminGeneratedTasks modal
      queryClient.invalidateQueries({ queryKey: ['task-categories-admin'] }); // CRITICAL: For categories tree
      queryClient.invalidateQueries({ queryKey: ['admin-task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['task-groups'] });
      toast({
        title: 'Plantilla eliminada',
        description: 'Plantilla y todos sus parámetros eliminados exitosamente'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al eliminar plantilla'
      });
    }
  });

  if (!open) return null;

  return (
    <CustomModalLayout open={open} onClose={onClose} className="md:max-w-4xl">
      {{
        header: (
          <CustomModalHeader
            title={`Editor de Plantilla - ${taskGroupName || categoryName}`}
            subtitle={`${taskGroupName ? `Grupo: ${taskGroupName}` : categoryName} • Gestionar parámetros de la plantilla`}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <div className="space-y-6">
              {/* Paso 1: Crear Plantilla */}
              {!template && !templateLoading && (
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

              {/* Loading state */}
              {templateLoading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando plantilla...</p>
                </div>
              )}

              {/* Estado de la plantilla (si existe) */}
              {template && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium mb-1">
                        ✓ Plantilla Creada: {taskGroupName || categoryName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Categoría: {categoryName} | Parámetros: {templateParameters.length}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar esta plantilla y todos sus parámetros?')) {
                          deleteTemplateMutation.mutate(template.id);
                        }
                      }}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      {deleteTemplateMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Paso 2: Unidad (solo si la plantilla existe) */}
              {template && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Paso 2: Unidad</h3>
                  <div className="space-y-2">
                    <Label>Unidad</Label>
                    <Select 
                      value={template.unit_id || ""} 
                      onValueChange={(value) => {
                        updateTemplateUnitMutation.mutate(value || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar unidad..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin unidad</SelectItem>
                        {units?.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Paso 3: Gestión de Parámetros (solo si la plantilla existe) */}
              {template && (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3">Paso 3: Agregar Parámetros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Parámetro</Label>
                        <Select 
                          value={newParameterId} 
                          onValueChange={(value) => {
                            setNewParameterId(value);
                            setNewOptionGroupId(''); // Reset option group when parameter changes
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar parámetro" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableParameters.map((parameter) => (
                              <SelectItem key={parameter.id} value={parameter.id}>
                                {parameter.label || parameter.name} ({parameter.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      
                      <div className="flex items-end">
                        <Button 
                          onClick={() => {
                            addParameterMutation.mutate({ 
                              parameterId: newParameterId,
                              optionGroupId: newOptionGroupId || undefined
                            });
                          }}
                          disabled={!newParameterId || !newOptionGroupId || addParameterMutation.isPending}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {addParameterMutation.isPending ? 'Agregando...' : 'Agregar'}
                        </Button>
                      </div>
                    </div>
                    
                    {newParameterId && parameterOptionGroups.length === 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        ⚠️ Este parámetro no tiene grupos de opciones configurados
                      </div>
                    )}
                  </div>



                  {/* Lista de parámetros agregados con drag & drop */}
                  {templateParameters.length > 0 && (
                    <div className="bg-card border border-border rounded-lg p-4">
                      <Label className="text-sm font-medium mb-3 block">
                        Parámetros de la plantilla ({templateParameters.length}):
                      </Label>
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
                            {templateParameters.map((tp, index) => (
                              <SortableParameterItem
                                key={tp.id}
                                parameter={tp}
                                index={index}
                                onDelete={(parameterId) => deleteParameterMutation.mutate(parameterId)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}

                  {/* Preview de la plantilla */}
                  <div className="bg-muted/30 rounded-lg border p-4">
                    <Label className="text-sm font-medium mb-2 block">
                      Vista previa de la plantilla:
                    </Label>
                    <div className="text-sm bg-background p-3 rounded border">
                      <span className="font-medium">
                        {generatePreview()}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>• Estructura: {categoryName} + parámetros + punto final</p>
                      <p>• Los parámetros se insertan automáticamente entre el nombre y el punto</p>
                      <p>• Se guardará al presionar "Guardar" en el modal</p>
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
            onSave={() => {
              // Save the name_template with the current preview
              if (template?.id) {
                const newNameTemplate = generatePreview();
                updateTemplateNameMutation.mutate(newNameTemplate, {
                  onSuccess: () => {
                    toast({
                      title: 'Plantilla guardada',
                      description: 'La plantilla se ha guardado exitosamente'
                    });
                    onClose();
                  },
                  onError: (error: any) => {
                    toast({
                      variant: 'destructive',
                      title: 'Error al guardar',
                      description: error.message || 'Error al guardar la plantilla'
                    });
                  }
                });
              } else {
                onClose();
              }
            }}
            cancelText="Cancelar"
            saveText="Guardar"
          />
        )
      }}
    </CustomModalLayout>
  );
}