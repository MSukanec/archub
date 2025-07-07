import { supabase } from './db.js';

export async function createTaskTemplatesTables() {
  try {
    // Crear tabla task_templates si no existe
    const createTaskTemplatesSQL = `
      CREATE TABLE IF NOT EXISTS task_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code_prefix TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        name_template TEXT NOT NULL,
        category_id UUID NOT NULL REFERENCES task_categories(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const { error: templatesError } = await supabase.rpc('exec_sql', { 
      sql: createTaskTemplatesSQL 
    });

    if (templatesError) {
      console.log('Error creating task_templates:', templatesError);
    } else {
      console.log('task_templates table created/verified');
    }

    // Crear tabla task_template_parameters si no existe
    const createTaskTemplateParametersSQL = `
      CREATE TABLE IF NOT EXISTS task_template_parameters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
        parameter_id UUID NOT NULL REFERENCES task_parameters(id) ON DELETE CASCADE,
        is_required BOOLEAN DEFAULT FALSE,
        position INTEGER DEFAULT 0,
        option_group_id UUID REFERENCES task_parameter_option_groups(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(template_id, parameter_id)
      );
    `;

    const { error: parametersError } = await supabase.rpc('exec_sql', { 
      sql: createTaskTemplateParametersSQL 
    });

    if (parametersError) {
      console.log('Error creating task_template_parameters:', parametersError);
    } else {
      console.log('task_template_parameters table created/verified');
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating tables:', error);
    return { success: false, error };
  }
}