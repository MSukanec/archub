import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TaskTemplate {
  id: string;
  name_template: string;
  task_group_id: string;
  unit_id?: string | null;
  created_at: string;
  updated_at: string;
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
        .select(`
          *,
          units(name),
          task_groups!task_templates_task_group_id_fkey(
            name,
            category_id,
            task_categories(name, code)
          )
        `)
        .order('name_template');
      
      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }
      
      return data as TaskTemplate[];
    }
  });
}

export function useTaskTemplateParameters(templateId: string | null) {
  return useQuery({
    queryKey: ['task-template-parameters', templateId],
    queryFn: async () => {
      if (!supabase || !templateId) return [];
      
      console.log('🔍 Buscando plantilla para task_group_id:', templateId);
      
      // New approach: get parameters through task_group_parameter_options
      const { data, error } = await supabase
        .from('task_group_parameter_options')
        .select(`
          parameter_id,
          parameter_option_id,
          task_parameter_options!inner(id, name, label),
          task_parameters!inner(id, slug, label, type, expression_template)
        `)
        .eq('group_id', templateId);
      
      console.log('🔍 Resultado búsqueda plantilla:', { data, error });
      
      if (error) {
        console.error('Error fetching parameters:', error);
        throw error;
      }
      
      if (!data || data.length === 0) return [];
      
      // Transform the data to match our interface
      const parametersMap: Record<string, any> = {};
      
      data.forEach(opt => {
        if (!parametersMap[opt.parameter_id]) {
          parametersMap[opt.parameter_id] = {
            id: opt.parameter_id,
            template_id: templateId,
            name: opt.task_parameters?.slug || '',
            label: opt.task_parameters?.label || '',
            type: opt.task_parameters?.type || 'text',
            is_required: false,
            position: 1,
            expression_template: opt.task_parameters?.expression_template || '{value}'
          };
        }
      });
      
      const parameters = Object.values(parametersMap);
      
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
        .from('task_parameter_options')
        .select('id, name, label')
        .eq('parameter_id', parameterId);
      
      if (error) {
        console.error('Error fetching parameter options:', error);
        throw error;
      }
      
      console.log('Real parameter options from task_parameter_values:', data);
      return data?.map(item => ({
        id: item.id,
        value: item.id, // Use ID as value
        label: item.label || item.name,
        expression_template: '{value}' // Default template
      })) as TaskTemplateParameterOption[];
    },
    enabled: !!parameterId && !!supabase
  });
}