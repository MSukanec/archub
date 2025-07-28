import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface TaskParameter {
  id: string;
  slug: string;
  label: string;
  type: string;
  expression_template: string;
  category_id?: string;
  unit_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskParameterOption {
  id: string;
  parameter_id: string;
  name: string;
  label: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskParameterWithOptions extends TaskParameter {
  options: TaskParameterOption[];
}

export interface CreateTaskParameterData {
  slug: string;
  label: string;
  type: string;
  expression_template?: string;
  category_id?: string;
  unit_id?: string;
}

export interface UpdateTaskParameterData {
  id: string;
  slug: string;
  label: string;
  type: string;
  expression_template?: string;
  category_id?: string;
  unit_id?: string;
}

export interface CreateTaskParameterOptionData {
  parameter_id: string;
  name: string;
  label: string;
  description?: string;
}

export interface UpdateTaskParameterOptionData {
  id: string;
  parameter_id: string;
  name: string;
  label: string;
  description?: string;
}

export interface UpdateTaskParameterData extends CreateTaskParameterData {
  id: string;
}

export interface CreateTaskParameterOptionData {
  parameter_id: string;
  name: string;
  label: string;
}

export interface UpdateTaskParameterOptionData extends CreateTaskParameterOptionData {
  id: string;
}

// Hook para obtener todos los parámetros con sus opciones
export function useTaskParametersAdmin() {
  return useQuery({
    queryKey: ['task-parameters-admin'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not available');
      
      const { data: parameters, error: parametersError } = await supabase
        .from('task_parameters')
        .select('*')
        .order('slug');

      if (parametersError) throw parametersError;

      const { data: options, error: optionsError } = await supabase
        .from('task_parameter_options')
        .select('*')
        .order('label');

      if (optionsError) throw optionsError;

      // Group options by parameter_id
      const optionsByParameter = options?.reduce((acc, option) => {
        if (!acc[option.parameter_id]) {
          acc[option.parameter_id] = [];
        }
        acc[option.parameter_id].push(option);
        return acc;
      }, {} as Record<string, TaskParameterOption[]>) || {};

      // Combine parameters with their options
      const parametersWithOptions: TaskParameterWithOptions[] = parameters?.map(param => ({
        ...param,
        options: optionsByParameter[param.id] || []
      })) || [];

      return parametersWithOptions;
    },
  });
}

// Hook para crear parámetro
export function useCreateTaskParameter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (parameterData: CreateTaskParameterData) => {
      if (!supabase) throw new Error('Supabase client not available');
      
      const { data: parameter, error: paramError } = await supabase
        .from('task_parameters')
        .insert([{
          slug: parameterData.slug,
          label: parameterData.label,
          type: parameterData.type,
          expression_template: parameterData.expression_template
        }])
        .select()
        .single();

      if (paramError) throw paramError;
      return parameter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      
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

// Hook para actualizar parámetro
export function useUpdateTaskParameter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateTaskParameterData) => {
      if (!supabase) throw new Error('Supabase client not available');
      
      const { data: parameter, error: paramError } = await supabase
        .from('task_parameters')
        .update({
          slug: updateData.slug,
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
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      
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

// Hook para eliminar parámetro
export function useDeleteTaskParameter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (parameterId: string) => {
      if (!supabase) throw new Error('Supabase client not available');
      
      // First delete all parameter options
      await supabase
        .from('task_parameter_options')
        .delete()
        .eq('parameter_id', parameterId);

      // Then delete the parameter
      const { error } = await supabase
        .from('task_parameters')
        .delete()
        .eq('id', parameterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      
      toast({
        title: 'Parámetro eliminado',
        description: 'El parámetro se ha eliminado correctamente.',
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

// Hook para crear opción de parámetro
export function useCreateTaskParameterOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (optionData: CreateTaskParameterOptionData) => {
      if (!supabase) throw new Error('Supabase client not available');
      
      const { data: option, error: optionError } = await supabase
        .from('task_parameter_options')
        .insert([{
          parameter_id: optionData.parameter_id,
          name: optionData.name,
          label: optionData.label,
          description: optionData.description
        }])
        .select()
        .single();

      if (optionError) throw optionError;
      return option;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      
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

// Hook para actualizar opción de parámetro
export function useUpdateTaskParameterOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateTaskParameterOptionData) => {
      if (!supabase) throw new Error('Supabase client not available');
      
      const { data: option, error: optionError } = await supabase
        .from('task_parameter_options')
        .update({
          parameter_id: updateData.parameter_id,
          name: updateData.name,
          label: updateData.label,
          description: updateData.description
        })
        .eq('id', id)
        .select()
        .single();

      if (optionError) throw optionError;
      return option;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      
      toast({
        title: 'Opción actualizada',
        description: 'La opción se ha actualizada correctamente.',
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

// Hook para eliminar opción de parámetro
export function useDeleteTaskParameterOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (optionId: string) => {
      if (!supabase) throw new Error('Supabase client not available');
      
      const { error } = await supabase
        .from('task_parameter_options')
        .delete()
        .eq('id', optionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      
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
        .from('task_parameter_values')
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