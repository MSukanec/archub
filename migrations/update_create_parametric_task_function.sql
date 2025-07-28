-- Update create_parametric_task function to include unit_id and category_id logic
CREATE OR REPLACE FUNCTION create_parametric_task(
  input_param_values jsonb,
  input_param_order text[] DEFAULT '{}'::text[]
)
RETURNS SETOF task_parametric
LANGUAGE plpgsql
AS $$
DECLARE
  existing_task task_parametric%ROWTYPE;
  new_task task_parametric%ROWTYPE;
  new_code TEXT;
  last_code_num INTEGER;
  tipo_tarea_value TEXT;
  calculated_unit_id UUID;
  calculated_category_id UUID;
BEGIN
  -- Check if task already exists with same param_values
  SELECT * INTO existing_task 
  FROM task_parametric 
  WHERE param_values = input_param_values;
  
  IF FOUND THEN
    -- Return existing task
    RETURN NEXT existing_task;
    RETURN;
  END IF;
  
  -- Get the last code number
  SELECT COALESCE(MAX(CAST(code AS INTEGER)), 0) INTO last_code_num
  FROM task_parametric 
  WHERE code ~ '^\d+$';
  
  -- Generate new 6-digit code
  new_code := LPAD((last_code_num + 1)::TEXT, 6, '0');
  
  -- Extract tipo_tarea value from input_param_values
  tipo_tarea_value := input_param_values->>'tipo_tarea';
  
  -- Logic to assign unit_id and category_id based on tipo_tarea value (UUID)
  -- Check if the tipo_tarea UUID corresponds to 'ejecucion-de-muros' option
  IF EXISTS (
    SELECT 1 FROM task_parameter_options tpo
    WHERE tpo.id = tipo_tarea_value::UUID AND tpo.name = 'ejecucion-de-muros'
  ) THEN
    -- Set specific UUIDs for muros category and m2 unit
    -- You need to replace these with actual UUIDs from your database:
    -- Query: SELECT id FROM task_categories WHERE name ILIKE '%muro%' AND parent_id IS NULL;
    -- Query: SELECT id FROM units WHERE name ILIKE '%m2%' OR abbreviation = 'm²';
    calculated_category_id := (SELECT id FROM task_categories WHERE name ILIKE '%muro%' AND parent_id IS NULL LIMIT 1);
    calculated_unit_id := (SELECT id FROM units WHERE abbreviation = 'm²' OR name ILIKE '%metro%cuadrado%' LIMIT 1);
  ELSE
    -- For other values, set to null
    calculated_unit_id := NULL;
    calculated_category_id := NULL;
  END IF;
  
  -- Insert new task with calculated fields
  INSERT INTO task_parametric (
    code,
    param_values,
    param_order,
    unit_id,
    category_id,
    created_at,
    updated_at
  ) VALUES (
    new_code,
    input_param_values,
    input_param_order,
    calculated_unit_id,
    calculated_category_id,
    NOW(),
    NOW()
  ) RETURNING * INTO new_task;
  
  RETURN NEXT new_task;
  RETURN;
END;
$$;