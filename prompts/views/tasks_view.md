-- 1) Dropear la vista anterior si existe
drop view if exists public.tasks_view;

-- 2) Crear la vista ajustada (sin columnas paramétricas)
create view public.tasks_view as
select
  t.id,
  t.custom_name,
  t.code,
  t.is_system,
  t.organization_id,
  t.is_completed,
  u.name as unit,                 -- units.name
  d.name as division,             -- task_divisions.name
  t.created_by,                   -- tasks.created_by
  t.created_at,                   -- tasks.created_at
  t.updated_at                    -- tasks.updated_at
from public.tasks t
left join public.units u
  on u.id = t.unit_id
left join public.task_divisions d
  on d.id = t.task_division_id;
