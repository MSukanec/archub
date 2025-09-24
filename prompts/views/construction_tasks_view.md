-- 1) Por las dudas, borro la vista si existe
DROP VIEW IF EXISTS public.construction_tasks_view;

-- 2) La vuelvo a crear SIN category_name
CREATE VIEW public.construction_tasks_view AS
SELECT
  ct.id,                                   -- construction_tasks
  ct.organization_id,                      -- construction_tasks
  ct.project_id,                           -- construction_tasks
  ct.task_id,                              -- tasks (FK)
  t.custom_name,                           -- tasks.custom_name
  u.name AS unit,                          -- units.name (via tasks.unit_id)
  td.name AS division_name,                -- task_divisions.name (via tasks.task_division_id)

  -- 🔹 Tipo de costeo (enum crudo + etiqueta para la UI)
  ct.cost_scope,                           -- construction_tasks.cost_scope (enum)
  CASE ct.cost_scope
    WHEN 'materials_and_labor' THEN 'M.O. + MAT.'
    WHEN 'labor_only'           THEN 'M.O.'
    WHEN 'materials_only'       THEN 'MAT'
    ELSE 'M.O. + MAT.'
  END AS cost_scope_label,

  ct.quantity,                             -- construction_tasks
  ct.start_date,                           -- construction_tasks
  ct.end_date,                             -- construction_tasks
  ct.duration_in_days,                     -- construction_tasks
  ct.progress_percent,                     -- construction_tasks
  ct.description AS description,           -- construction_tasks.description

  ct.markup_pct,                           -- porcentaje guardado en la línea

  ct.created_at,                           -- construction_tasks
  ct.updated_at,                           -- construction_tasks

  ph.phase_name                            -- última fase asociada
FROM public.construction_tasks ct
LEFT JOIN public.tasks t
  ON t.id = ct.task_id
LEFT JOIN public.units u
  ON u.id = t.unit_id
LEFT JOIN public.task_divisions td
  ON td.id = t.task_division_id
-- Tomo UNA fase por task (la más reciente por created_at)
LEFT JOIN LATERAL (
  SELECT cp.name AS phase_name
  FROM public.construction_phase_tasks cpt
  JOIN public.construction_phases cp
    ON cp.id = cpt.project_phase_id
  WHERE cpt.construction_task_id = ct.id
  ORDER BY cpt.created_at DESC
  LIMIT 1
) ph ON TRUE;
