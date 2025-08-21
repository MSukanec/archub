-- 1) Por las dudas, borro la vista si existe
drop view if exists public.construction_tasks_view;

-- 2) Creo la vista con las columnas solicitadas incluyendo custom_name
create view public.construction_tasks_view as
select
  ct.id,                                   -- construction_tasks
  ct.organization_id,                      -- construction_tasks
  ct.project_id,                           -- construction_tasks
  ct.task_id,                              -- tasks (FK)
  t.custom_name,                           -- tasks.custom_name
  tc.name as category_name,                -- task_categories.name (via tasks.category_id)
  ct.quantity,                             -- construction_tasks
  ct.start_date,                           -- construction_tasks
  ct.end_date,                             -- construction_tasks
  ct.duration_in_days,                     -- construction_tasks
  ct.progress_percent,                     -- construction_tasks
  ct.created_at,                           -- construction_tasks
  ct.updated_at,                           -- construction_tasks
  ph.phase_name                            -- nombre de la fase (ver LATERAL)
from public.construction_tasks ct
left join public.tasks t
  on t.id = ct.task_id
left join public.task_categories tc
  on tc.id = t.category_id
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