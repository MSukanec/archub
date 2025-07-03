import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TaskTemplate {
  id: string;
  name: string;
  code_prefix: string;
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
      
      // Add demo name_template for testing if missing
      const templatesWithDemo = data?.map(template => ({
        ...template,
        name_template: template.name_template || `${template.name} de {{largo}} x {{ancho}} metros en {{material}}, incluye instalación: {{incluye_instalacion}}`
      })) || [];
      
      return templatesWithDemo as TaskTemplate[];
    }
  });
}

export function useTaskTemplateParameters(templateId: string | null) {
  return useQuery({
    queryKey: ['task-template-parameters', templateId],
    queryFn: async () => {
      if (!supabase || !templateId) return [];
      
      console.log('Fetching parameters for template:', templateId);
      
      // TODO: Replace with real data when available in Supabase
      // For now, return demo parameters for testing the modal functionality
      const demoParameters: TaskTemplateParameter[] = [
        {
          id: 'demo-1',
          template_id: templateId,
          name: 'largo',
          label: 'Largo (metros)',
          type: 'number',
          unit: 'm',
          is_required: true,
          position: 1
        },
        {
          id: 'demo-2',
          template_id: templateId,
          name: 'ancho',
          label: 'Ancho (metros)',
          type: 'number',
          unit: 'm',
          is_required: true,
          position: 2
        },
        {
          id: 'demo-3',
          template_id: templateId,
          name: 'material',
          label: 'Tipo de Material',
          type: 'select',
          unit: undefined,
          is_required: true,
          position: 3
        },
        {
          id: 'demo-4',
          template_id: templateId,
          name: 'incluye_instalacion',
          label: 'Incluye Instalación',
          type: 'boolean',
          unit: undefined,
          is_required: false,
          position: 4
        }
      ];
      
      console.log('Demo parameters for template:', demoParameters);
      return demoParameters;
    },
    enabled: !!templateId && !!supabase
  });
}

export function useTaskTemplateParameterOptions(parameterId: string | null) {
  return useQuery({
    queryKey: ['task-template-parameter-options', parameterId],
    queryFn: async () => {
      if (!supabase || !parameterId) return [];
      
      // Return demo options for the material parameter
      if (parameterId === 'demo-3') {
        return [
          { id: 'opt-1', parameter_id: parameterId, value: 'concreto', label: 'Concreto', position: 1 },
          { id: 'opt-2', parameter_id: parameterId, value: 'ladrillo', label: 'Ladrillo', position: 2 },
          { id: 'opt-3', parameter_id: parameterId, value: 'metal', label: 'Metal', position: 3 },
          { id: 'opt-4', parameter_id: parameterId, value: 'madera', label: 'Madera', position: 4 }
        ] as TaskTemplateParameterOption[];
      }
      
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