import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface TaskParameter {
  id: string;
  template_id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  unit_id?: string;
  is_required: boolean;
  position: number;
  created_at: string;
  options?: TaskParameterOption[];
}

export interface TaskParameterOption {
  id: string;
  parameter_id: string;
  value: string;
  label: string;
  position: number;
  created_at: string;
}

export interface CreateTaskParameterData {
  template_id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  unit_id?: string;
  is_required: boolean;
  position: number;
}

export interface UpdateTaskParameterData extends CreateTaskParameterData {
  id: string;
}

export interface CreateTaskParameterOptionData {
  parameter_id: string;
  value: string;
  label: string;
  position: number;
}

export interface UpdateTaskParameterOptionData extends CreateTaskParameterOptionData {
  id: string;
}

export function useTaskParametersAdmin() {
  return useQuery({
    queryKey: ['task-parameters-admin'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');

      // Fetch parameters
      const { data: parameters, error: parametersError } = await supabase
        .from('task_template_parameters')
        .select('*')
        .order('position');

      if (parametersError) {
        console.error('Error fetching parameters:', parametersError);
        throw parametersError;
      }

      // Fetch all options
      const { data: options, error: optionsError } = await supabase
        .from('task_template_parameter_options')
        .select('*')
        .order('position');

      if (optionsError) {
        console.error('Error fetching options:', optionsError);
        throw optionsError;
      }

      // Group options by parameter_id
      const optionsMap = new Map<string, TaskParameterOption[]>();
      options.forEach(option => {
        if (!optionsMap.has(option.parameter_id)) {
          optionsMap.set(option.parameter_id, []);
        }
        optionsMap.get(option.parameter_id)!.push(option);
      });

      // Combine parameters with their options
      const parametersWithOptions: TaskParameter[] = parameters.map(param => ({
        ...param,
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

      const { data, error } = await supabase
        .from('task_template_parameters')
        .insert([parameterData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
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

      const { data, error } = await supabase
        .from('task_template_parameters')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
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

      // First delete all options for this parameter
      const { error: optionsError } = await supabase
        .from('task_template_parameter_options')
        .delete()
        .eq('parameter_id', parameterId);

      if (optionsError) throw optionsError;

      // Then delete the parameter
      const { error } = await supabase
        .from('task_template_parameters')
        .delete()
        .eq('id', parameterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
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
        .from('task_template_parameter_options')
        .insert([optionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
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
        .from('task_template_parameter_options')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
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
        .from('task_template_parameter_options')
        .delete()
        .eq('id', optionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
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