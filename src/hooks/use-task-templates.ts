import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TaskTemplate {
  id: string;
  name: string;
  code: string;
  name_template: string;
  category_id: string;
  action_id?: string;
  created_at: string;
}

export interface TaskTemplateParameter {
  id: string;
  template_id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  unit?: string;
  is_required: boolean;
  position: number;
  expression_template?: string;
}

export interface TaskTemplateParameterOption {
  id: string;
  parameter_id: string;
  value: string;
  label: string;
  position: number;
}

export function useTaskTemplates() {
  return useQuery({
    queryKey: ['task-templates'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return data as TaskTemplate[];
    }
  });
}

export function useTaskTemplateParameters(templateId: string | null) {
  return useQuery({
    queryKey: ['task-template-parameters', templateId],
    queryFn: async () => {
      if (!supabase || !templateId) return [];
      
      console.log('Fetching real parameters for template:', templateId);
      
      const { data, error } = await supabase
        .from('task_template_parameters')
        .select(`
          id,
          template_id,
          parameter_id,
          option_group_id,
          is_required,
          position,
          created_at,
          updated_at,
          task_parameters (
            id,
            name,
            label,
            type
          )
        `)
        .eq('template_id', templateId)
        .order('position');
      
      if (error) {
        console.error('Error fetching parameters:', error);
        throw error;
      }
      
      console.log('Raw parameter data from DB:', data);
      console.log('Individual item raw with expression_template:', data?.[0]);
      
      // Transform the data to match our interface - only real data
      const parameters = data?.map(item => ({
        id: item.parameter_id,
        template_id: item.template_id,
        name: item.task_parameters?.name || '',
        label: item.task_parameters?.label || '',
        type: item.task_parameters?.type || 'text',
        is_required: item.is_required || false,
        position: item.position,
        expression_template: '' // Column doesn't exist in DB
      })) || [];
      
      console.log('Parameters with expression_template:', parameters.map(p => ({
        name: p.name,
        expression_template: p.expression_template,
        position: p.position
      })));
      
      console.log('Transformed real parameters:', parameters);
      return parameters as TaskTemplateParameter[];
    },
    enabled: !!templateId && !!supabase
  });
}

export function useTaskTemplateParameterOptions(parameterId: string | null) {
  return useQuery({
    queryKey: ['task-template-parameter-options', parameterId],
    queryFn: async () => {
      if (!supabase || !parameterId) return [];
      
      console.log('Fetching real options for parameter:', parameterId);
      
      const { data, error } = await supabase
        .from('task_template_parameter_options')
        .select('*')
        .eq('parameter_id', parameterId);
      
      if (error) {
        console.error('Error fetching parameter options:', error);
        throw error;
      }
      
      console.log('Real parameter options from DB:', data);
      return data as TaskTemplateParameterOption[];
    },
    enabled: !!parameterId && !!supabase
  });
}