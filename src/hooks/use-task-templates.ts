import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
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
      
      const { data, error } = await supabase
        .from('task_template_parameters')
        .select('*')
        .eq('template_id', templateId)
        .order('position');
      
      if (error) throw error;
      return data as TaskTemplateParameter[];
    },
    enabled: !!templateId && !!supabase
  });
}

export function useTaskTemplateParameterOptions(parameterId: string | null) {
  return useQuery({
    queryKey: ['task-template-parameter-options', parameterId],
    queryFn: async () => {
      if (!supabase || !parameterId) return [];
      
      const { data, error } = await supabase
        .from('task_template_parameter_options')
        .select('*')
        .eq('parameter_id', parameterId)
        .order('position');
      
      if (error) throw error;
      return data as TaskTemplateParameterOption[];
    },
    enabled: !!parameterId && !!supabase
  });
}