declare
  existing_task tasks;
  new_code text;
begin
  raise notice '📩 Recibido → unit: %, category: %, org: %, custom_name: %',
    input_unit_id, input_category_id, input_organization_id, input_custom_name;

  -- Si es tarea del sistema (paramétrica)
  if input_custom_name is null then
    select * into existing_task from tasks
    where param_values = input_param_values
      and is_system = true;

    if found then
      raise notice '⚠ Ya existía tarea paramétrica con ID %', existing_task.id;
      return query select * from tasks where id = existing_task.id;
    end if;

    new_code := 'TP-' || to_char(now(), 'YYYYMMDDHH24MISSMS');

    insert into tasks (
      id, created_at, updated_at,
      param_values, param_order, unit_id, category_id,
      name_rendered, code, is_system
    )
    select
      gen_random_uuid(), now(), now(),
      input_param_values, input_param_order, input_unit_id, input_category_id,
      render_parametric_task_name(input_param_order, input_param_values),
      new_code, true;

    return query select * from tasks where code = new_code;

  -- Si es tarea personalizada
  else
    new_code := 'CU-' || to_char(now(), 'YYYYMMDDHH24MISSMS');

    insert into tasks (
      id, created_at, updated_at,
      param_values, param_order, unit_id, category_id,
      name_rendered, custom_name, code, is_system, organization_id
    )
    select
      gen_random_uuid(), now(), now(),
      input_param_values, input_param_order, input_unit_id, input_category_id,
      input_custom_name, input_custom_name, new_code, false, input_organization_id;

    return query select * from tasks where code = new_code;
  end if;
end;