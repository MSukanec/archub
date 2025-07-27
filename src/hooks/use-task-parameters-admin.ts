import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// Hook para obtener todas las categorías de tareas disponibles
export function useTaskSubcategories() {
  return useQuery({
    queryKey: ['task-subcategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_categories')
        .select('id, name, code, parent_id')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

// Hook para task groups
export function useTaskGroups() {
  return useQuery({
    queryKey: ['task-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_groups')
        .select('id, name, category_id, created_at')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });
}

export interface TaskParameter {
  id: string;
  template_id: string;
  parameter_id: string; // Real parameter ID for options
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  expression_template?: string;
  created_at: string;
  options?: TaskParameterOption[];
}

export interface TaskParameterOption {
  id: string;
  parameter_id: string;
  name: string;
  label: string;
  created_at: string;
}

export interface CreateTaskParameterData {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  expression_template?: string;
}

export interface UpdateTaskParameterData {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  expression_template?: string;
}

export interface CreateTaskParameterOptionData {
  parameter_id: string;
  name: string;
  label: string;
}

export interface TaskParameterOptionGroup {
  id: string;
  parameter_id: string;
  name: string;
  label: string;
  position?: number;
  created_at: string;
}

export interface TaskParameterOptionGroupItem {
  id: string;
  group_id: string;
  parameter_value_id: string;
  created_at: string;
}

export interface UpdateTaskParameterOptionData {
  id: string;
  parameter_id: string;
  name: string;
  label: string;
}

export function useTaskParametersAdmin() {
  return useQuery({
    queryKey: ['task-parameters-admin-clean'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');

      // Fetch parameters directly from task_parameters table
      const { data: parameters, error: parametersError } = await supabase
        .from('task_parameters')
        .select('id, name, label, type, expression_template, created_at')
        .order('created_at');

      if (parametersError) {
        console.error('Error fetching parameters:', parametersError);
        throw parametersError;
      }

      // Fetch options from task_parameter_values table
      const { data: options, error: optionsError } = await supabase
        .from('task_parameter_values')
        .select('id, parameter_id, name, label, created_at')
        .order('label');

      if (optionsError) {
        console.error('Error fetching options:', optionsError);
        // Don't throw error, just log it and continue with empty options
      }

      // Group options by parameter_id
      const optionsMap = new Map<string, TaskParameterOption[]>();
      (options || []).forEach((option: any) => {
        if (!optionsMap.has(option.parameter_id)) {
          optionsMap.set(option.parameter_id, []);
        }
        const mappedOption = {
          id: option.id,
          parameter_id: option.parameter_id,
          name: option.name,
          label: option.label,
          created_at: option.created_at,
        };

        optionsMap.get(option.parameter_id)!.push(mappedOption);
      });

      // Transform the data to include options

      const parametersWithOptions: TaskParameter[] = parameters.map((param: any) => ({
        id: param.id,
        template_id: '', // Not needed for standalone parameters
        parameter_id: param.id, // Same as ID for standalone parameters
        name: param.name,
        label: param.label,
        type: param.type,
        expression_template: param.expression_template,
        required: false,
        created_at: param.created_at,
        options: optionsMap.get(param.id) || []
      }));

      return parametersWithOptions;
    },
  });
}

export function useCreateTaskParameter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (parameterData: CreateTaskParameterData) => {
      if (!supabase) throw new Error('Supabase client not initialized');

      console.log('Creating parameter with data:', parameterData);

      // Create the parameter directly in task_parameters table
      const { data: parameter, error: paramError } = await supabase
        .from('task_parameters')
        .insert([{
          name: parameterData.name,
          label: parameterData.label,
          type: parameterData.type,
          expression_template: parameterData.expression_template
        }])
        .select()
        .single();

      if (paramError) {
        console.error('Error creating parameter:', paramError);
        throw paramError;
      }
      
      console.log('Parameter created with ID:', parameter?.id);
      return parameter;
    },
    onSuccess: () => {
      // Invalidate all related queries including the new useAllTaskParameterValues hook
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.removeQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.removeQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.removeQueries({ queryKey: ['all-task-parameter-values'] });
      
      // Force refetch immediately
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['task-parameters-admin-clean'] });
        queryClient.refetchQueries({ queryKey: ['all-task-parameter-values'] });
      }, 100);
      
      toast({
        title: 'Parámetro creado',
        description: 'El parámetro se ha creado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error creating parameter:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el parámetro.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTaskParameter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateTaskParameterData) => {
      if (!supabase) throw new Error('Supabase client not initialized');

      // Update the parameter directly in task_parameters table
      const { data: parameter, error: paramError } = await supabase
        .from('task_parameters')
        .update({
          name: updateData.name,
          label: updateData.label,
          type: updateData.type,
          expression_template: updateData.expression_template
        })
        .eq('id', id)
        .select()
        .single();

      if (paramError) throw paramError;
      return parameter;
    },
    onSuccess: () => {
      // Invalidate all related queries including the new useAllTaskParameterValues hook
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.removeQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.removeQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.removeQueries({ queryKey: ['all-task-parameter-values'] });
      
      // Force refetch immediately
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['task-parameters-admin-clean'] });
        queryClient.refetchQueries({ queryKey: ['all-task-parameter-values'] });
      }, 100);
      
      toast({
        title: 'Parámetro actualizado',
        description: 'El parámetro se ha actualizado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error updating parameter:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el parámetro.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTaskParameter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (parameterId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized');

      // Options table doesn't exist yet - skip option deletion

      // Then delete the parameter directly from task_parameters
      const { error } = await supabase
        .from('task_parameters')
        .delete()
        .eq('id', parameterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      toast({
        title: 'Parámetro eliminado',
        description: 'El parámetro y sus opciones se han eliminado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error deleting parameter:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el parámetro.',
        variant: 'destructive',
      });
    },
  });
}

export function useCreateTaskParameterOption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (optionData: CreateTaskParameterOptionData) => {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await supabase
        .from('task_parameter_values')
        .insert({
          parameter_id: optionData.parameter_id,
          name: optionData.name,
          label: optionData.label
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      toast({
        title: 'Opción creada',
        description: 'La opción se ha creado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error creating option:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la opción.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTaskParameterOption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateTaskParameterOptionData) => {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await supabase
        .from('task_parameter_values')
        .update({
          parameter_id: updateData.parameter_id,
          name: updateData.name,
          label: updateData.label
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      toast({
        title: 'Opción actualizada',
        description: 'La opción se ha actualizado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error updating option:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la opción.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTaskParameterOption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (optionId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { error } = await supabase
        .from('task_parameter_values')
        .delete()
        .eq('id', optionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      toast({
        title: 'Opción eliminada',
        description: 'La opción se ha eliminado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error deleting option:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la opción.',
        variant: 'destructive',
      });
    },
  });
}

// Hook para obtener valores/opciones de un parámetro específico
export function useTaskParameterValues(parameterId: string) {
  return useQuery({
    queryKey: ['task-parameter-values', parameterId],
    queryFn: async () => {
      if (!parameterId) return [];
      
      const { data, error } = await supabase
        .from('task_parameter_values')
        .select('*')
        .eq('parameter_id', parameterId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!parameterId,
  });
}

// Hook para obtener TODOS los valores de parámetros (sin filtro) con expression_template
export function useAllTaskParameterValues() {
  return useQuery({
    queryKey: ['all-task-parameter-values'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameter_options')
        .select(`
          *,
          task_parameters(
            expression_template
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Flatten the data structure to include expression_template at the top level
      const flattenedData = data?.map(item => ({
        ...item,
        expression_template: item.task_parameters?.expression_template || '{value}'
      })) || [];
      
      return flattenedData;
    },
  });
}

// Función eliminada: useTaskParameterOptionGroups - tabla eliminada

// Función eliminada: useTaskParameterOptionGroupItems - tabla eliminada

// Función eliminada: useCreateTaskParameterOptionGroup - tabla eliminada

// Funciones eliminadas: useDeleteTaskParameterOptionGroup, useUpdateTaskParameterOptionGroup, useToggleTaskParameterOptionInGroup - tablas eliminadas