import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit3, Package, Settings, GripVertical } from 'lucide-react';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface TaskTemplateEditorModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
}

interface TaskTemplate {
  id: string;
  code: string;
  name: string;
  name_template?: string;
  category_id: string;
  is_public?: boolean;
  scope?: string;
  created_at: string;
}

interface TaskParameter {
  id: string;
  name: string;
  type: string;
  unit?: string;
}

interface TaskTemplateParameter {
  id: string;
  template_id: string;
  parameter_id: string;
  option_group_id?: string;
  is_required: boolean;
  position: number;
  role?: string;
  expression_template?: string;
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
          *,
          parameter:task_parameters(*)
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
          code: categoryCode,
          name: categoryName,
          name_template: `{{nombre}} de ${categoryName}`,
          category_id: categoryId
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template', categoryCode] });
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

  if (!open) return null;

  const selectedParameter = availableParameters.find(p => p.id === newParameterId);
  const showOptionGroups = selectedParameter?.type === 'select';

  return (
    <CustomModalLayout open={open} onClose={onClose} className="md:max-w-5xl">
      {{
        header: (
          <CustomModalHeader
            title={`Editor de Plantilla - ${categoryCode}`}
            description={`${categoryName} • Gestionar parámetros de la plantilla`}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md" columns={1}>
            {/* Template Status */}
            <div className="col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5" />
                    Estado de la Plantilla
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {templateLoading ? (
                    <div className="text-sm text-muted-foreground">Cargando plantilla...</div>
                  ) : template ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="default">Plantilla Existente</Badge>
                        <span className="text-sm text-muted-foreground">
                          Código: {template.code} • {templateParameters.length} parámetros
                        </span>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Activa
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">Sin Plantilla</Badge>
                        <span className="text-sm text-muted-foreground">
                          No existe plantilla para esta categoría
                        </span>
                      </div>
                      <Button 
                        onClick={handleCreateTemplate}
                        disabled={createTemplateMutation.isPending}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Plantilla
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {template && (
              <>
                <div className="col-span-1">
                  <Separator />
                </div>
                
                {/* Add Parameter Section */}
                <div className="col-span-1">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Plus className="h-5 w-5" />
                        Agregar Parámetro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                                    {parameter.name} ({parameter.type})
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
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-1">
                  <Separator />
                </div>

                {/* Parameters List */}
                <div className="col-span-1">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Edit3 className="h-5 w-5" />
                        Parámetros de la Plantilla ({templateParameters.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {parametersLoading ? (
                        <div className="text-sm text-muted-foreground">Cargando parámetros...</div>
                      ) : templateParameters.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No hay parámetros agregados a esta plantilla</p>
                          <p className="text-xs">Usa el formulario de arriba para agregar parámetros</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {templateParameters.map((param, index) => (
                            <div key={param.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <GripVertical className="h-4 w-4" />
                                <span className="text-xs font-mono">{index + 1}</span>
                              </div>
                              
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                <div>
                                  <div className="font-medium">{param.parameter.name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {param.parameter.type}
                                    </Badge>
                                    {param.parameter.unit && (
                                      <span className="text-xs">({param.parameter.unit})</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-xs text-muted-foreground">
                                  Posición: {param.position}
                                  {param.option_group_id && (
                                    <div>Grupo: {param.option_group_id}</div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Obligatorio:</Label>
                                  <Switch
                                    checked={param.is_required}
                                    onCheckedChange={() => handleToggleRequired(param)}
                                    disabled={updateParameterMutation.isPending}
                                  />
                                </div>
                                
                                <div className="flex justify-end">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteParameter(param.id)}
                                    disabled={deleteParameterMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </CustomModalFooter>
        )
      }}
    </CustomModalLayout>
  );
}