-- Fixed create_generated_task function with proper table aliases to resolve ambiguous column reference
CREATE OR REPLACE FUNCTION create_generated_task(
  input_template_id UUID,
  input_param_values JSONB,
  input_created_by VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  template_name VARCHAR;
  template_description VARCHAR;
  generated_code VARCHAR;
  existing_task_id UUID;
  existing_task_code VARCHAR;
  existing_task_description VARCHAR;
  new_task_id UUID;
BEGIN
  -- Get template information without ambiguous references
  SELECT name, description
  INTO template_name, template_description
  FROM task_templates
  WHERE id = input_template_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Generate unique code based on template and parameters
  generated_code := template_name || '_' || 
    SUBSTRING(MD5(input_param_values::TEXT) FROM 1 FOR 8);
  
  -- Check if task with same code already exists
  SELECT id, code, description
  INTO existing_task_id, existing_task_code, existing_task_description
  FROM generated_tasks
  WHERE code = generated_code;
  
  IF FOUND THEN
    -- Return existing task
    RETURN jsonb_build_object(
      'existing_task', jsonb_build_object(
        'id', existing_task_id,
        'code', existing_task_code,
        'description', existing_task_description
      )
    );
  END IF;
  
  -- Create new generated task
  new_task_id := gen_random_uuid();
  
  INSERT INTO generated_tasks (
    id,
    code,
    template_id,
    param_values,
    description,
    created_by,
    is_public,
    created_at
  ) VALUES (
    new_task_id,
    generated_code,
    input_template_id,
    input_param_values,
    template_description || ' - Generada',
    input_created_by,
    true,
    NOW()
  );
  
  -- Return new task
  RETURN jsonb_build_object(
    'new_task', jsonb_build_object(
      'id', new_task_id,
      'code', generated_code,
      'description', template_description || ' - Generada'
    )
  );
END;
$$;