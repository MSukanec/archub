-- Vistas que necesitas crear en tu base de datos para que funcione CRONOGRAMA

-- Vista principal para tareas de construcción
CREATE OR REPLACE VIEW construction_tasks_view AS
SELECT 
  ct.id,
  ct.project_id,
  ct.task_id,
  t.name_rendered,
  u.name as unit_name,
  tc.name as category_name,
  ct.quantity,
  ct.start_date,
  ct.end_date,
  ct.duration_in_days,
  ct.progress_percent,
  pp.name as phase_name,
  pp.position as phase_position,
  ct.created_at,
  ct.updated_at
FROM construction_tasks ct
LEFT JOIN task_view t ON ct.task_id = t.id
LEFT JOIN units u ON t.unit_id = u.id
LEFT JOIN task_categories tc ON t.category_id = tc.id
LEFT JOIN project_phases pp ON ct.project_phase_id = pp.id;

-- Vista para el Gantt de construcción
CREATE OR REPLACE VIEW construction_gantt_view AS
SELECT 
  ct.id,
  ct.project_id,
  ct.task_id,
  t.name_rendered as task_name,
  t.code as task_code,
  ct.quantity,
  u.name as unit_name,
  u.symbol as unit_symbol,
  tc.name as category_name,
  ct.start_date,
  ct.end_date,
  ct.duration_in_days,
  ct.progress_percent,
  pp.id as phase_id,
  pp.name as phase_name,
  pp.position as phase_position,
  ct.created_at,
  ct.updated_at,
  ct.organization_id,
  ct.created_by
FROM construction_tasks ct
LEFT JOIN task_view t ON ct.task_id = t.id
LEFT JOIN units u ON t.unit_id = u.id
LEFT JOIN task_categories tc ON t.category_id = tc.id
LEFT JOIN project_phases pp ON ct.project_phase_id = pp.id;