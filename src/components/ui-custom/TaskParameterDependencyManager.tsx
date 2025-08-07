import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TreePine, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { TaskParameter, TaskParameterOption, TaskParameterDependency, TaskParameterDependencyOption, InsertTaskParameterDependency, InsertTaskParameterDependencyOption } from '@shared/schema';

interface DependencyWithDetails extends TaskParameterDependency {
  parent_parameter?: TaskParameter;
  parent_option?: TaskParameterOption;
  child_parameter?: TaskParameter;
  child_options?: TaskParameterOption[];
}

// Hook para obtener parámetros
const useTaskParameters = () => {
  return useQuery({
    queryKey: ['task-parameters-dependencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .eq('type', 'select')
        .order('label');
      
      if (error) throw error;
      return data as TaskParameter[];
    }
  });
};

// Hook para obtener opciones de un parámetro
const useParameterOptions = (parameterId: string | null) => {
  return useQuery({
    queryKey: ['parameter-options', parameterId],
    queryFn: async () => {
      if (!parameterId) return [];
      
      const { data, error } = await supabase
        .from('task_parameter_options')
        .select('*')
        .eq('parameter_id', parameterId)
        .order('label');
      
      if (error) throw error;
      return data as TaskParameterOption[];
    },
    enabled: !!parameterId
  });
};

// Hook para obtener dependencias existentes
const useTaskParameterDependencies = () => {
  return useQuery({
    queryKey: ['task-parameter-dependencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameter_dependencies')
        .select(`
          *,
          parent_parameter:task_parameters!parent_parameter_id(*),
          parent_option:task_parameter_options!parent_option_id(*),
          child_parameter:task_parameters!child_parameter_id(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Obtener las opciones filtradas para cada dependencia
      const dependenciesWithOptions = await Promise.all(
        data.map(async (dep) => {
          const { data: childOptions, error: optionsError } = await supabase
            .from('task_parameter_dependency_options')
            .select(`
              *,
              child_option:task_parameter_options(*)
            `)
            .eq('dependency_id', dep.id);

          if (optionsError) throw optionsError;

          return {
            ...dep,
            child_options: childOptions?.map(opt => opt.child_option).filter(Boolean) || []
          } as DependencyWithDetails;
        })
      );

      return dependenciesWithOptions;
    }
  });
};

export function TaskParameterDependencyManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingDependency, setEditingDependency] = useState<string | null>(null);
  const [expandedDependencies, setExpandedDependencies] = useState<Set<string>>(new Set());

  // Formulario para nueva dependencia
  const [newDependency, setNewDependency] = useState({
    parent_parameter_id: '',
    parent_option_id: '',
    child_parameter_id: '',
    selected_child_options: [] as string[]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: parameters = [], isLoading: parametersLoading } = useTaskParameters();
  const { data: dependencies = [], isLoading: dependenciesLoading } = useTaskParameterDependencies();
  
  const { data: parentOptions = [] } = useParameterOptions(newDependency.parent_parameter_id);
  const { data: childOptions = [] } = useParameterOptions(newDependency.child_parameter_id);

  // Mutación para crear dependencia
  const createDependencyMutation = useMutation({
    mutationFn: async (dependencyData: InsertTaskParameterDependency) => {
      const { data, error } = await supabase
        .from('task_parameter_dependencies')
        .insert(dependencyData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      toast({
        title: "Dependencia creada",
        description: "La dependencia entre parámetros ha sido creada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la dependencia. Intenta nuevamente.",
        variant: "destructive",
      });
      console.error('Error creating dependency:', error);
    }
  });

  // Mutación para crear opciones de dependencia
  const createDependencyOptionsMutation = useMutation({
    mutationFn: async ({ dependencyId, optionIds }: { dependencyId: string, optionIds: string[] }) => {
      const optionsData = optionIds.map(optionId => ({
        dependency_id: dependencyId,
        child_option_id: optionId
      }));

      const { data, error } = await supabase
        .from('task_parameter_dependency_options')
        .insert(optionsData);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
    }
  });

  // Mutación para eliminar dependencia
  const deleteDependencyMutation = useMutation({
    mutationFn: async (dependencyId: string) => {
      // Primero eliminar las opciones
      await supabase
        .from('task_parameter_dependency_options')
        .delete()
        .eq('dependency_id', dependencyId);

      // Luego eliminar la dependencia
      const { error } = await supabase
        .from('task_parameter_dependencies')
        .delete()
        .eq('id', dependencyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      toast({
        title: "Dependencia eliminada",
        description: "La dependencia ha sido eliminada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la dependencia.",
        variant: "destructive",
      });
      console.error('Error deleting dependency:', error);
    }
  });

  const handleCreateDependency = async () => {
    if (!newDependency.parent_parameter_id || !newDependency.parent_option_id || !newDependency.child_parameter_id) {
      toast({
        title: "Campos requeridos",
        description: "Debes seleccionar el parámetro padre, la opción padre y el parámetro hijo.",
        variant: "destructive",
      });
      return;
    }

    try {
      const dependency = await createDependencyMutation.mutateAsync({
        parent_parameter_id: newDependency.parent_parameter_id,
        parent_option_id: newDependency.parent_option_id,
        child_parameter_id: newDependency.child_parameter_id
      });

      // Si hay opciones de hijo seleccionadas, crearlas
      if (newDependency.selected_child_options.length > 0) {
        await createDependencyOptionsMutation.mutateAsync({
          dependencyId: dependency.id,
          optionIds: newDependency.selected_child_options
        });
      }

      // Limpiar formulario
      setNewDependency({
        parent_parameter_id: '',
        parent_option_id: '',
        child_parameter_id: '',
        selected_child_options: []
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating dependency:', error);
    }
  };

  const toggleDependencyExpansion = (dependencyId: string) => {
    const newExpanded = new Set(expandedDependencies);
    if (newExpanded.has(dependencyId)) {
      newExpanded.delete(dependencyId);
    } else {
      newExpanded.add(dependencyId);
    }
    setExpandedDependencies(newExpanded);
  };

  const handleChildOptionToggle = (optionId: string) => {
    const current = newDependency.selected_child_options;
    const updated = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId];
    
    setNewDependency(prev => ({
      ...prev,
      selected_child_options: updated
    }));
  };

  if (parametersLoading || dependenciesLoading) {
    return (
        Cargando sistema de dependencias...
      </div>
    );
  }

  return (
      {/* Header y botón para crear nueva dependencia */}
        <div>
            Gestión de Dependencias entre Parámetros
          </h3>
            Define relaciones tipo "árbol genealógico" donde al elegir una opción se habilitan ciertos parámetros.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          Nueva Dependencia
        </Button>
      </div>

      {/* Panel de creación de dependencia */}
      {isCreating && (
        <Card>
          <CardHeader>
              <span>Crear Nueva Dependencia</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewDependency({
                    parent_parameter_id: '',
                    parent_option_id: '',
                    child_parameter_id: '',
                    selected_child_options: []
                  });
                }}
              >
              </Button>
            </CardTitle>
          </CardHeader>
            {/* Parte 1: Definir la dependencia básica */}
                <Select
                  value={newDependency.parent_parameter_id}
                  onValueChange={(value) => setNewDependency(prev => ({
                    ...prev,
                    parent_parameter_id: value,
                    parent_option_id: '' // Reset parent option when parameter changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar parámetro padre" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameters.map((param) => (
                      <SelectItem key={param.id} value={param.id}>
                        {param.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <Select
                  value={newDependency.parent_option_id}
                  onValueChange={(value) => setNewDependency(prev => ({ ...prev, parent_option_id: value }))}
                  disabled={!newDependency.parent_parameter_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <Select
                  value={newDependency.child_parameter_id}
                  onValueChange={(value) => setNewDependency(prev => ({
                    ...prev,
                    child_parameter_id: value,
                    selected_child_options: [] // Reset child options when parameter changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar parámetro hijo" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameters
                      .filter(param => param.id !== newDependency.parent_parameter_id)
                      .map((param) => (
                        <SelectItem key={param.id} value={param.id}>
                          {param.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Parte 2: Seleccionar opciones del parámetro hijo (opcional) */}
            {newDependency.child_parameter_id && childOptions.length > 0 && (
                <Separator />
                <div>
                    Si no seleccionas ninguna opción, se habilitarán todas las opciones del parámetro hijo.
                  </p>
                    {childOptions.map((option) => (
                        <Checkbox
                          id={option.id}
                          checked={newDependency.selected_child_options.includes(option.id)}
                          onCheckedChange={() => handleChildOptionToggle(option.id)}
                        />
                        <label
                          htmlFor={option.id}
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewDependency({
                    parent_parameter_id: '',
                    parent_option_id: '',
                    child_parameter_id: '',
                    selected_child_options: []
                  });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateDependency}
                disabled={createDependencyMutation.isPending}
              >
                {createDependencyMutation.isPending ? 'Guardando...' : 'Guardar Dependencia'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de dependencias existentes */}
        
        {dependencies.length === 0 ? (
          <Card>
                Crea tu primera dependencia para empezar a construir el árbol de parámetros.
              </p>
            </CardContent>
          </Card>
        ) : (
            {dependencies.map((dependency) => (
              <Card key={dependency.id}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDependencyExpansion(dependency.id)}
                      >
                        {expandedDependencies.has(dependency.id) ? (
                        ) : (
                        )}
                      </Button>
                      
                        <Badge variant="outline">
                          {dependency.parent_parameter?.label}
                        </Badge>
                        <Badge variant="secondary">
                          {dependency.parent_option?.label}
                        </Badge>
                        <Badge variant="default">
                          {dependency.child_parameter?.label}
                        </Badge>
                      </div>
                    </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDependencyMutation.mutate(dependency.id)}
                        disabled={deleteDependencyMutation.isPending}
                      >
                      </Button>
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {expandedDependencies.has(dependency.id) && (
                          Cuando se seleccione "{dependency.parent_option?.label}" en "{dependency.parent_parameter?.label}", 
                          se habilitará el parámetro "{dependency.child_parameter?.label}".
                        </p>
                      </div>
                      
                      {dependency.child_options && dependency.child_options.length > 0 && (
                            {dependency.child_options.map((option) => (
                                {option.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(!dependency.child_options || dependency.child_options.length === 0) && (
                            Se habilitarán todas las opciones del parámetro hijo.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}