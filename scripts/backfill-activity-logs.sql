-- =============================================================================
-- BACKFILL SCRIPT: Poblar organization_activity_logs con actividades históricas
-- =============================================================================
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script en el SQL Editor de Supabase
-- 2. Primero ejecuta solo la sección de VERIFICACIÓN para ver cuántos registros se van a crear
-- 3. Luego ejecuta las secciones de INSERT según necesites
-- 4. Es recomendable ejecutar sección por sección y revisar los resultados
--
-- NOTA: Este script crea actividades "create_*" para registros existentes
-- usando created_at como fecha de la actividad. Los deletes y updates
-- no se pueden reconstruir retrospectivamente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- VERIFICACIÓN: Cuenta cuántos registros se van a insertar (EJECUTAR PRIMERO)
-- -----------------------------------------------------------------------------

SELECT 'Movements' as entity, COUNT(*) as count FROM movements WHERE is_deleted = false
UNION ALL
SELECT 'Projects' as entity, COUNT(*) as count FROM projects WHERE is_deleted = false
UNION ALL
SELECT 'Site Logs' as entity, COUNT(*) as count FROM site_logs
UNION ALL
SELECT 'Contacts' as entity, COUNT(*) as count FROM contacts WHERE is_deleted = false
UNION ALL
SELECT 'Construction Tasks' as entity, COUNT(*) as count FROM construction_tasks
UNION ALL
SELECT 'Organization Members' as entity, COUNT(*) as count FROM organization_members WHERE is_deleted = false
UNION ALL
SELECT 'Project Clients' as entity, COUNT(*) as count FROM project_clients WHERE is_deleted = false
UNION ALL
SELECT 'Subcontracts' as entity, COUNT(*) as count FROM subcontracts WHERE is_deleted = false
UNION ALL
SELECT 'Personnel' as entity, COUNT(*) as count FROM personnel WHERE is_deleted = false
UNION ALL
SELECT 'Materials' as entity, COUNT(*) as count FROM materials WHERE organization_id IS NOT NULL
UNION ALL
SELECT 'Material Purchases' as entity, COUNT(*) as count FROM material_purchases
ORDER BY entity;

-- -----------------------------------------------------------------------------
-- 1. BACKFILL: Movimientos Financieros (movements)
-- -----------------------------------------------------------------------------

INSERT INTO organization_activity_logs (
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata,
  created_at
)
SELECT 
  m.organization_id,
  om.user_id, -- Obtener user_id desde organization_members
  'create_movement',
  'movements',
  m.id,
  jsonb_build_object(
    'amount', m.amount,
    'description', COALESCE(m.description, ''),
    'movement_date', m.movement_date,
    'backfilled', true
  ),
  m.created_at
FROM movements m
LEFT JOIN organization_members om ON m.created_by = om.id
WHERE m.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM organization_activity_logs oa 
    WHERE oa.target_id = m.id 
      AND oa.target_table = 'movements'
      AND oa.action = 'create_movement'
  );

-- -----------------------------------------------------------------------------
-- 2. BACKFILL: Proyectos (projects)
-- -----------------------------------------------------------------------------

INSERT INTO organization_activity_logs (
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata,
  created_at
)
SELECT 
  p.organization_id,
  om.user_id,
  'create_project',
  'projects',
  p.id,
  jsonb_build_object(
    'name', p.name,
    'backfilled', true
  ),
  p.created_at
FROM projects p
LEFT JOIN organization_members om ON p.created_by = om.id
WHERE p.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM organization_activity_logs oa 
    WHERE oa.target_id = p.id 
      AND oa.target_table = 'projects'
      AND oa.action = 'create_project'
  );

-- -----------------------------------------------------------------------------
-- 3. BACKFILL: Bitácoras de Obra (site_logs)
-- -----------------------------------------------------------------------------

INSERT INTO organization_activity_logs (
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata,
  created_at
)
SELECT 
  sl.organization_id,
  om.user_id,
  'create_site_log',
  'site_logs',
  sl.id,
  jsonb_build_object(
    'log_date', sl.log_date,
    'project_id', sl.project_id,
    'backfilled', true
  ),
  sl.created_at
FROM site_logs sl
LEFT JOIN organization_members om ON sl.created_by = om.id
WHERE NOT EXISTS (
    SELECT 1 FROM organization_activity_logs oa 
    WHERE oa.target_id = sl.id 
      AND oa.target_table = 'site_logs'
      AND oa.action = 'create_site_log'
  );

-- -----------------------------------------------------------------------------
-- 4. BACKFILL: Contactos (contacts)
-- -----------------------------------------------------------------------------

INSERT INTO organization_activity_logs (
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata,
  created_at
)
SELECT 
  c.organization_id,
  NULL, -- contacts no tienen created_by
  'add_contact',
  'contacts',
  c.id,
  jsonb_build_object(
    'name', COALESCE(c.full_name, c.first_name || ' ' || COALESCE(c.last_name, '')),
    'email', c.email,
    'backfilled', true
  ),
  c.created_at
FROM contacts c
WHERE c.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM organization_activity_logs oa 
    WHERE oa.target_id = c.id 
      AND oa.target_table = 'contacts'
      AND oa.action = 'add_contact'
  );

-- -----------------------------------------------------------------------------
-- 5. BACKFILL: Tareas de Construcción (construction_tasks)
-- -----------------------------------------------------------------------------

INSERT INTO organization_activity_logs (
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata,
  created_at
)
SELECT 
  ct.organization_id,
  om.user_id,
  'create_task',
  'construction_tasks',
  ct.id,
  jsonb_build_object(
    'project_id', ct.project_id,
    'quantity', ct.quantity,
    'backfilled', true
  ),
  ct.created_at
FROM construction_tasks ct
LEFT JOIN organization_members om ON ct.created_by = om.id
WHERE NOT EXISTS (
    SELECT 1 FROM organization_activity_logs oa 
    WHERE oa.target_id = ct.id 
      AND oa.target_table = 'construction_tasks'
      AND oa.action = 'create_task'
  );

-- -----------------------------------------------------------------------------
-- 6. BACKFILL: Miembros de Organización (organization_members)
-- -----------------------------------------------------------------------------

INSERT INTO organization_activity_logs (
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata,
  created_at
)
SELECT 
  om.organization_id,
  om.user_id, -- El usuario que se unió
  'add_member',
  'organization_members',
  om.id,
  jsonb_build_object(
    'email', u.email,
    'backfilled', true
  ),
  om.joined_at
FROM organization_members om
LEFT JOIN users u ON om.user_id = u.id
WHERE om.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM organization_activity_logs oa 
    WHERE oa.target_id = om.id 
      AND oa.target_table = 'organization_members'
      AND oa.action = 'add_member'
  );

-- -----------------------------------------------------------------------------
-- 7. BACKFILL: Clientes de Proyecto (project_clients)
-- -----------------------------------------------------------------------------

INSERT INTO organization_activity_logs (
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata,
  created_at
)
SELECT 
  pc.organization_id,
  NULL, -- project_clients no tienen created_by
  'add_client',
  'project_clients',
  pc.id,
  jsonb_build_object(
    'name', pc.name,
    'project_id', pc.project_id,
    'backfilled', true
  ),
  pc.created_at
FROM project_clients pc
WHERE pc.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM organization_activity_logs oa 
    WHERE oa.target_id = pc.id 
      AND oa.target_table = 'project_clients'
      AND oa.action = 'add_client'
  );

-- -----------------------------------------------------------------------------
-- 8. BACKFILL: Subcontratos (subcontracts)
-- -----------------------------------------------------------------------------

INSERT INTO organization_activity_logs (
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata,
  created_at
)
SELECT 
  s.organization_id,
  om.user_id,
  'create_subcontract',
  'subcontracts',
  s.id,
  jsonb_build_object(
    'name', s.name,
    'project_id', s.project_id,
    'backfilled', true
  ),
  s.created_at
FROM subcontracts s
LEFT JOIN organization_members om ON s.created_by = om.id
WHERE s.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM organization_activity_logs oa 
    WHERE oa.target_id = s.id 
      AND oa.target_table = 'subcontracts'
      AND oa.action = 'create_subcontract'
  );

-- -----------------------------------------------------------------------------
-- 9. BACKFILL: Personal (personnel)
-- -----------------------------------------------------------------------------

INSERT INTO organization_activity_logs (
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata,
  created_at
)
SELECT 
  p.organization_id,
  om.user_id,
  'add_personnel',
  'personnel',
  p.id,
  jsonb_build_object(
    'name', p.full_name,
    'backfilled', true
  ),
  p.created_at
FROM personnel p
LEFT JOIN organization_members om ON p.created_by = om.id
WHERE p.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM organization_activity_logs oa 
    WHERE oa.target_id = p.id 
      AND oa.target_table = 'personnel'
      AND oa.action = 'add_personnel'
  );

-- -----------------------------------------------------------------------------
-- 10. BACKFILL: Materiales (materials)
-- -----------------------------------------------------------------------------

INSERT INTO organization_activity_logs (
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata,
  created_at
)
SELECT 
  m.organization_id,
  NULL, -- materials no tienen created_by
  'add_material',
  'materials',
  m.id,
  jsonb_build_object(
    'name', m.name,
    'backfilled', true
  ),
  m.created_at
FROM materials m
WHERE m.organization_id IS NOT NULL -- Solo materiales de organizaciones, no del sistema
  AND NOT EXISTS (
    SELECT 1 FROM organization_activity_logs oa 
    WHERE oa.target_id = m.id 
      AND oa.target_table = 'materials'
      AND oa.action = 'add_material'
  );

-- -----------------------------------------------------------------------------
-- 11. BACKFILL: Compras de Materiales (material_purchases)
-- -----------------------------------------------------------------------------

INSERT INTO organization_activity_logs (
  organization_id,
  user_id,
  action,
  target_table,
  target_id,
  metadata,
  created_at
)
SELECT 
  mp.organization_id,
  om.user_id,
  'create_purchase',
  'material_purchases',
  mp.id,
  jsonb_build_object(
    'invoice_number', mp.invoice_number,
    'total_amount', mp.total_amount,
    'backfilled', true
  ),
  mp.created_at
FROM material_purchases mp
LEFT JOIN organization_members om ON mp.created_by = om.id
WHERE NOT EXISTS (
    SELECT 1 FROM organization_activity_logs oa 
    WHERE oa.target_id = mp.id 
      AND oa.target_table = 'material_purchases'
      AND oa.action = 'create_purchase'
  );

-- -----------------------------------------------------------------------------
-- VERIFICACIÓN FINAL: Cuenta actividades por tipo
-- -----------------------------------------------------------------------------

SELECT 
  action,
  target_table,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE metadata->>'backfilled' = 'true') as backfilled_count
FROM organization_activity_logs
GROUP BY action, target_table
ORDER BY target_table, action;

-- -----------------------------------------------------------------------------
-- OPCIONAL: Ver actividades recientes por organización
-- -----------------------------------------------------------------------------
-- SELECT 
--   o.name as organization,
--   COUNT(*) as activity_count
-- FROM organization_activity_logs oal
-- JOIN organizations o ON oal.organization_id = o.id
-- GROUP BY o.name
-- ORDER BY activity_count DESC;
