-- Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code_prefix TEXT NOT NULL,
  name_template TEXT NOT NULL,
  category_id UUID NOT NULL,
  action_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create task_template_parameters table
CREATE TABLE IF NOT EXISTS task_template_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  parameter_id UUID NOT NULL REFERENCES task_parameters(id) ON DELETE CASCADE,
  option_group_id UUID REFERENCES task_parameter_option_groups(id) ON DELETE SET NULL,
  is_required BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL,
  role TEXT,
  expression_template TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate parameter assignments
ALTER TABLE task_template_parameters 
ADD CONSTRAINT unique_template_parameter 
UNIQUE (template_id, parameter_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_template_parameters_template_id 
ON task_template_parameters(template_id);

CREATE INDEX IF NOT EXISTS idx_task_template_parameters_parameter_id 
ON task_template_parameters(parameter_id);

-- Add sample task template for testing
INSERT INTO task_templates (name, code_prefix, name_template, category_id) 
VALUES (
  'Muros Simples',
  'MS',
  'Ejecución de {{material}} {{dimension}}',
  (SELECT id FROM task_categories WHERE name = 'Estructura' LIMIT 1)
) 
ON CONFLICT DO NOTHING;