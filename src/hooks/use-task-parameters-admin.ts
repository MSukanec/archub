import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface TaskParameter {
  id: string;
  template_id: string;
  parameter_id: string; // Real parameter ID for options
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  unit_id?: string;
  is_required: boolean;
  created_at: string;
  options?: TaskParameterOption[];
}

export interface TaskParameterOption {
  id: string;
  parameter_id: string;
  value: string;
  label: string;
  created_at: string;
}

export interface CreateTaskParameterData {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  unit_id?: string;
  is_required: boolean;
}

export interface UpdateTaskParameterData {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  unit_id?: string;
  is_required: boolean;
}

export interface CreateTaskParameterOptionData {
  parameter_id: string;
  value: string;
  label: string;
}

export interface UpdateTaskParameterOptionData extends CreateTaskParameterOptionData {
  id: string;
}

export function useTaskParametersAdmin() {
  return useQuery({
    queryKey: ['task-parameters-admin'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');

      // Fetch parameters directly from task_parameters table
      const { data: parameters, error: parametersError } = await supabase
        .from('task_parameters')
        .select('id, name, label, type, unit_id, created_at')
        .order('created_at');

      if (parametersError) {
        console.error('Error fetching parameters:', parametersError);
        throw parametersError;
      }

      // Options table doesn't exist yet - return empty array
      const options: any[] = [];

      // Group options by parameter_id
      const optionsMap = new Map<string, TaskParameterOption[]>();
      options.forEach(option => {
        if (!optionsMap.has(option.parameter_id)) {
          optionsMap.set(option.parameter_id, []);
        }
        optionsMap.get(option.parameter_id)!.push(option);
      });

      // Transform the data to include options
      const parametersWithOptions: TaskParameter[] = parameters.map((param: any) => ({
        id: param.id,
        template_id: '', // Not needed for standalone parameters
        parameter_id: param.id, // Same as ID for standalone parameters
        name: param.name,
        label: param.label,
        type: param.type,
        unit_id: param.unit_id,
        is_required: false, // Default for standalone parameters
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
          unit_id: parameterData.unit_id || null
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

      // Update the parameter directly in task_parameters table
      const { data: parameter, error: paramError } = await supabase
        .from('task_parameters')
        .update({
          name: updateData.name,
          label: updateData.label,
          type: updateData.type,
          unit_id: updateData.unit_id
        })
        .eq('id', id)
        .select()
        .single();

      if (paramError) throw paramError;
      return parameter;
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

      // Options table doesn't exist yet - skip option deletion

      // Then delete the parameter directly from task_parameters
      const { error } = await supabase
        .from('task_parameters')
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

      // Options table doesn't exist yet - throw error
      throw new Error('Parameter options functionality not implemented yet');
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

      // Options table doesn't exist yet - throw error
      throw new Error('Parameter options functionality not implemented yet');
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

      // Options table doesn't exist yet - throw error
      throw new Error('Parameter options functionality not implemented yet');
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