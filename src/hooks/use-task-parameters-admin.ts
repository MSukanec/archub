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
  role?: string;
  expression_template?: string;
  is_required: boolean;
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
  role?: string;
  expression_template?: string;
  is_required: boolean;
}

export interface UpdateTaskParameterData {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  role?: string;
  expression_template?: string;
  is_required: boolean;
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
        .select('id, name, label, type, role, expression_template, required, created_at')
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
        required: param.required || false,
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
          role: parameterData.role,
          expression_template: parameterData.expression_template,
          required: parameterData.is_required
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
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.removeQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.removeQueries({ queryKey: ['task-parameter-values'] });
      
      // Force refetch immediately
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['task-parameters-admin-clean'] });
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
          role: updateData.role,
          expression_template: updateData.expression_template,
          required: updateData.is_required
        })
        .eq('id', id)
        .select()
        .single();

      if (paramError) throw paramError;
      return parameter;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.removeQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.removeQueries({ queryKey: ['task-parameter-values'] });
      
      // Force refetch immediately
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['task-parameters-admin-clean'] });
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

// Hook para obtener grupos de opciones de un parámetro
export function useTaskParameterOptionGroups(parameterId: string) {
  return useQuery({
    queryKey: ['task-parameter-option-groups', parameterId],
    queryFn: async () => {
      console.log('Fetching groups for parameter ID:', parameterId);
      if (!parameterId) return [];
      
      const { data, error } = await supabase
        .from('task_parameter_option_groups')
        .select('*')
        .eq('parameter_id', parameterId)
        .order('created_at', { ascending: true });

      console.log('Groups query result:', { data, error });
      if (error) throw error;
      return data || [];
    },
    enabled: !!parameterId,
  });
}

// Hook para obtener items de un grupo
export function useTaskParameterOptionGroupItems(groupId: string) {
  return useQuery({
    queryKey: ['task-parameter-option-group-items', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      const { data, error } = await supabase
        .from('task_parameter_option_group_items')
        .select('*')
        .eq('group_id', groupId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
}

// Hook para crear grupo de opciones
export function useCreateTaskParameterOptionGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      parameter_id: string;
      name: string;
      label: string;
      position?: number;
    }) => {
      const { data: result, error } = await supabase
        .from('task_parameter_option_groups')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-parameter-option-groups'] });
      toast({
        title: 'Grupo creado',
        description: 'El grupo de opciones se ha creado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error creating option group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el grupo de opciones.',
        variant: 'destructive',
      });
    },
  });
}

// Hook para eliminar grupo de opciones
export function useDeleteTaskParameterOptionGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      // First delete all group items
      await supabase
        .from('task_parameter_option_group_items')
        .delete()
        .eq('group_id', groupId);

      // Then delete the group
      const { error } = await supabase
        .from('task_parameter_option_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameter-option-groups'] });
      toast({
        title: 'Grupo eliminado',
        description: 'El grupo de opciones se ha eliminado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error deleting option group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el grupo de opciones.',
        variant: 'destructive',
      });
    },
  });
}

// Hook para actualizar grupo de opciones
export function useUpdateTaskParameterOptionGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      label: string;
    }) => {
      const { data: result, error } = await supabase
        .from('task_parameter_option_groups')
        .update({
          name: data.name,
          label: data.label,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameter-option-groups'] });
      toast({
        title: 'Grupo actualizado',
        description: 'El grupo de opciones se ha actualizado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error updating option group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el grupo de opciones.',
        variant: 'destructive',
      });
    },
  });
}

// Hook para agregar/quitar opciones de un grupo
export function useToggleTaskParameterOptionInGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      groupId: string;
      parameterValueId: string;
      action: 'add' | 'remove';
    }) => {
      if (data.action === 'add') {
        const { data: result, error } = await supabase
          .from('task_parameter_option_group_items')
          .insert([{
            group_id: data.groupId,
            parameter_value_id: data.parameterValueId
          }])
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { error } = await supabase
          .from('task_parameter_option_group_items')
          .delete()
          .eq('group_id', data.groupId)
          .eq('parameter_value_id', data.parameterValueId);

        if (error) throw error;
        return null;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-parameter-option-group-items', variables.groupId] });
      toast({
        title: variables.action === 'add' ? 'Opción agregada' : 'Opción removida',
        description: `La opción se ha ${variables.action === 'add' ? 'agregado al' : 'removido del'} grupo correctamente.`,
      });
    },
    onError: (error) => {
      console.error('Error toggling option in group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la asignación de la opción.',
        variant: 'destructive',
      });
    },
  });
}