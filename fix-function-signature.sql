-- Fixed function signature with all required parameters
CREATE OR REPLACE FUNCTION task_generate_code(
  input_template_id uuid,
  input_param_values jsonb,
  input_organization_id uuid,
  input_unit_id uuid DEFAULT NULL,
  input_is_system boolean DEFAULT false
)
RETURNS TABLE(
  generated_id uuid,
  generated_code text,
  generated_param_values jsonb,
  generated_created_at timestamptz
)
LANGUAGE plpgsql
AS $$
declare
  prefix text;
  next_number int;
  new_code text;
  existing_task record;
begin
  -- Obtener prefijo desde el template
  select tt.code into prefix
  from task_templates tt
  where tt.id = input_template_id;

  if prefix is null then
    raise exception 'Template not found or missing prefix';
  end if;

  -- Verificar si ya existe una tarea con esos parámetros
  select tg.id, tg.code, tg.param_values, tg.created_at
  into existing_task
  from task_generated tg
  where tg.template_id = input_template_id
    and tg.param_values::jsonb = input_param_values::jsonb;

  if found then
    return query
    select existing_task.id,
           existing_task.code,
           existing_task.param_values,
           existing_task.created_at;
  end if;

  -- Buscar el primer número libre
  select i
  into next_number
  from generate_series(1, 999999) as s(i)
  where lpad(i::text, 6, '0') not in (
    select regexp_replace(tg.code, '[^0-9]', '', 'g')
    from task_generated tg
    where tg.code like prefix || '-%'
  )
  limit 1;

  -- Armar el nuevo código
  new_code := prefix || '-' || lpad(next_number::text, 6, '0');

  -- Insertar la nueva tarea
  return query
  insert into task_generated (
    id,
    template_id,
    code,
    param_values,
    organization_id,
    is_system,
    unit_id
  ) values (
    gen_random_uuid(),
    input_template_id,
    new_code,
    input_param_values,
    case when input_is_system then null else input_organization_id end,
    input_is_system,
    input_unit_id
  )
  returning id as generated_id,
            code as generated_code,
            param_values as generated_param_values,
            created_at as generated_created_at;
end;
$$;