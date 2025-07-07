-- Add semantic_role and expression_template columns to task_parameters table
ALTER TABLE task_parameters 
ADD COLUMN IF NOT EXISTS semantic_role TEXT,
ADD COLUMN IF NOT EXISTS expression_template TEXT,
ADD COLUMN IF NOT EXISTS unit_id TEXT;

-- Add comment to explain the expression_template column
COMMENT ON COLUMN task_parameters.expression_template IS 'Template for dynamic phrases using {value} placeholder (e.g., "de {value}")';
COMMENT ON COLUMN task_parameters.semantic_role IS 'Semantic role of the parameter (material, dimension, quantity, etc.)';
COMMENT ON COLUMN task_parameters.unit_id IS 'Reference to measurement unit if applicable';