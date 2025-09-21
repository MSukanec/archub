-- 1) Por las dudas, borro la vista si existe
drop view if exists public.construction_tasks_view;

-- 2) La vuelvo a crear incluyendo custom_name, unidad, división y description
create view public.construction_tasks_view as
select
  ct.id,                                   -- construction_tasks
  ct.organization_id,                      -- construction_tasks
  ct.project_id,                           -- construction_tasks
  ct.task_id,                              -- tasks (FK)
  t.custom_name,                           -- tasks.custom_name
  u.name as unit,                          -- units.name (via tasks.unit_id)
  tc.name as category_name,                -- task_categories.name (via tasks.category_id)
  td.name as division_name,                -- task_divisions.name (via tasks.task_division_id)
  ct.quantity,                             -- construction_tasks
  ct.start_date,                           -- construction_tasks
  ct.end_date,                             -- construction_tasks
  ct.duration_in_days,                     -- construction_tasks
  ct.progress_percent,                     -- construction_tasks
  ct.description as description,           -- construction_tasks.description  ⬅️ NUEVO
  ct.created_at,                           -- construction_tasks
  ct.updated_at,                           -- construction_tasks
  ph.phase_name                            -- última fase asociada
from public.construction_tasks ct
left join public.tasks t
  on t.id = ct.task_id
left join public.units u
  on u.id = t.unit_id
left join public.task_categories tc
  on tc.id = t.category_id
left join public.task_divisions td
  on td.id = t.task_division_id
-- Tomo UNA fase por task (la más reciente por created_at)
left join lateral (
  select cp.name as phase_name
  from public.construction_phase_tasks cpt
  join public.construction_phases cp
    on cp.id = cpt.project_phase_id
  where cpt.construction_task_id = ct.id
  order by cpt.created_at desc
  limit 1
) ph on true;
