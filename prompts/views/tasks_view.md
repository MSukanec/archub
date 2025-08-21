TASKS_VIEW

-- 1) Dropear la vista anterior si existe
drop view if exists public.tasks_view;

-- 2) Crear la vista con el nombre correcto
create view public.tasks_view as
select
  t.id,
  t.created_at,
  t.updated_at,
  t.param_values,
  t.param_order,
  t.name_rendered,
  t.custom_name,
  t.code,
  t.is_system,
  t.organization_id,
  t.is_completed,
  u.name as unit,        -- units.name
  c.name as category     -- task_categories.name
from public.tasks t
left join public.units u           on u.id = t.unit_id
left join public.task_categories c on c.id = t.category_id;
