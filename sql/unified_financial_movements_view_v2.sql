-- =====================================================
-- SQL para actualizar la vista unified_financial_movements_view
-- =====================================================
-- CAMBIOS:
-- 1. Eliminada columna "notes" duplicada (ya está en "description")
-- 2. Agregadas columnas del creador: creator_full_name, creator_avatar_url
-- 3. Agregada columna entity_name para cada tipo de movimiento
-- 4. Para general_cost_payment: entity_name = nombre del gasto general
-- =====================================================

-- PASO 1: DROP de la vista existente
DROP VIEW IF EXISTS public.unified_financial_movements_view;

-- PASO 2: CREATE de la vista mejorada
CREATE VIEW public.unified_financial_movements_view AS

-- CLIENT PAYMENTS
SELECT
  cp.id,
  cp.organization_id,
  cp.project_id,
  cp.amount,
  cp.currency_id,
  COALESCE(cp.exchange_rate, 1::numeric) AS exchange_rate,
  cp.payment_date,
  COALESCE(cp.notes, cp.reference, 'Pago de cliente'::text) AS description,
  cp.reference,
  cp.wallet_id,
  cp.status,
  cp.created_by,
  cp.created_at,
  cp.updated_at,
  'client_payment'::text AS movement_type,
  cp.client_id,
  NULL::uuid AS material_id,
  NULL::uuid AS personnel_id,
  NULL::uuid AS purchase_id,
  NULL::uuid AS partner_id,
  NULL::uuid AS general_cost_id,
  1 AS amount_sign,
  -- Creator info
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  -- Entity name (client name)
  COALESCE(c.full_name, c.company_name) AS entity_name
FROM client_payments cp
LEFT JOIN organization_members om ON om.id = cp.created_by
LEFT JOIN users u ON u.id = om.user_id
LEFT JOIN project_clients pc ON pc.id = cp.client_id
LEFT JOIN contacts c ON c.id = pc.contact_id
WHERE cp.is_deleted IS NOT TRUE

UNION ALL

-- MATERIAL PAYMENTS
SELECT
  mp.id,
  mp.organization_id,
  mp.project_id,
  mp.amount,
  mp.currency_id,
  COALESCE(mp.exchange_rate, 1::numeric) AS exchange_rate,
  mp.payment_date,
  COALESCE(mp.notes, mp.reference, 'Pago de material'::text) AS description,
  mp.reference,
  mp.wallet_id,
  mp.status,
  mp.created_by,
  mp.created_at,
  mp.updated_at,
  'material_payment'::text AS movement_type,
  NULL::uuid AS client_id,
  NULL::uuid AS material_id,
  NULL::uuid AS personnel_id,
  mp.purchase_id,
  NULL::uuid AS partner_id,
  NULL::uuid AS general_cost_id,
  -1 AS amount_sign,
  -- Creator info
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  -- Entity name (from description/notes since materials don't have a direct entity)
  COALESCE(mp.notes, mp.reference, 'Material'::text) AS entity_name
FROM material_payments mp
LEFT JOIN organization_members om ON om.id = mp.created_by
LEFT JOIN users u ON u.id = om.user_id
WHERE mp.is_deleted IS NOT TRUE

UNION ALL

-- PERSONNEL PAYMENTS
SELECT
  pp.id,
  pp.organization_id,
  pp.project_id,
  pp.amount,
  pp.currency_id,
  pp.exchange_rate,
  pp.payment_date,
  COALESCE(pp.notes, pp.reference, 'Pago de personal'::text) AS description,
  pp.reference,
  pp.wallet_id,
  pp.status,
  pp.created_by,
  pp.created_at,
  pp.updated_at,
  'personnel_payment'::text AS movement_type,
  NULL::uuid AS client_id,
  NULL::uuid AS material_id,
  pp.personnel_id,
  NULL::uuid AS purchase_id,
  NULL::uuid AS partner_id,
  NULL::uuid AS general_cost_id,
  -1 AS amount_sign,
  -- Creator info
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  -- Entity name (personnel name)
  pu.full_name AS entity_name
FROM personnel_payments pp
LEFT JOIN organization_members om ON om.id = pp.created_by
LEFT JOIN users u ON u.id = om.user_id
LEFT JOIN organization_members pom ON pom.id = pp.personnel_id
LEFT JOIN users pu ON pu.id = pom.user_id
WHERE pp.is_deleted IS NOT TRUE

UNION ALL

-- PARTNER CONTRIBUTIONS
SELECT
  pc.id,
  pc.organization_id,
  pc.project_id,
  pc.amount,
  pc.currency_id,
  COALESCE(pc.exchange_rate, 1::numeric) AS exchange_rate,
  pc.contribution_date AS payment_date,
  COALESCE(pc.notes, pc.reference, 'Aporte de socio'::text) AS description,
  pc.reference,
  pc.wallet_id,
  pc.status,
  pc.created_by,
  pc.created_at,
  pc.updated_at,
  'partner_contribution'::text AS movement_type,
  NULL::uuid AS client_id,
  NULL::uuid AS material_id,
  NULL::uuid AS personnel_id,
  NULL::uuid AS purchase_id,
  pc.partner_id,
  NULL::uuid AS general_cost_id,
  1 AS amount_sign,
  -- Creator info
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  -- Entity name (partner/capital participant name)
  COALESCE(c.full_name, c.company_name) AS entity_name
FROM partner_contributions pc
LEFT JOIN organization_members om ON om.id = pc.created_by
LEFT JOIN users u ON u.id = om.user_id
LEFT JOIN capital_participants cp ON cp.id = pc.partner_id
LEFT JOIN contacts c ON c.id = cp.contact_id
WHERE pc.is_deleted IS NOT TRUE

UNION ALL

-- PARTNER WITHDRAWALS
SELECT
  pw.id,
  pw.organization_id,
  pw.project_id,
  pw.amount,
  pw.currency_id,
  COALESCE(pw.exchange_rate, 1::numeric) AS exchange_rate,
  pw.withdrawal_date AS payment_date,
  COALESCE(pw.notes, pw.reference, 'Retiro de socio'::text) AS description,
  pw.reference,
  pw.wallet_id,
  pw.status,
  pw.created_by,
  pw.created_at,
  pw.updated_at,
  'partner_withdrawal'::text AS movement_type,
  NULL::uuid AS client_id,
  NULL::uuid AS material_id,
  NULL::uuid AS personnel_id,
  NULL::uuid AS purchase_id,
  pw.partner_id,
  NULL::uuid AS general_cost_id,
  -1 AS amount_sign,
  -- Creator info
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  -- Entity name (partner/capital participant name)
  COALESCE(c.full_name, c.company_name) AS entity_name
FROM partner_withdrawals pw
LEFT JOIN organization_members om ON om.id = pw.created_by
LEFT JOIN users u ON u.id = om.user_id
LEFT JOIN capital_participants cp ON cp.id = pw.partner_id
LEFT JOIN contacts c ON c.id = cp.contact_id
WHERE pw.is_deleted IS NOT TRUE

UNION ALL

-- GENERAL COST PAYMENTS
SELECT
  gcp.id,
  gcp.organization_id,
  NULL::uuid AS project_id,
  gcp.amount,
  gcp.currency_id,
  COALESCE(gcp.exchange_rate, 1::numeric) AS exchange_rate,
  gcp.payment_date,
  COALESCE(gcp.notes, gcp.reference, 'Pago de gasto general'::text) AS description,
  gcp.reference,
  gcp.wallet_id,
  gcp.status,
  gcp.created_by,
  gcp.created_at,
  gcp.updated_at,
  'general_cost_payment'::text AS movement_type,
  NULL::uuid AS client_id,
  NULL::uuid AS material_id,
  NULL::uuid AS personnel_id,
  NULL::uuid AS purchase_id,
  NULL::uuid AS partner_id,
  gcp.general_cost_id,
  -1 AS amount_sign,
  -- Creator info
  u.full_name AS creator_full_name,
  u.avatar_url AS creator_avatar_url,
  -- Entity name (general cost name like "Contador", "Expensas")
  gc.name AS entity_name
FROM general_costs_payments gcp
LEFT JOIN organization_members om ON om.id = gcp.created_by
LEFT JOIN users u ON u.id = om.user_id
LEFT JOIN general_costs gc ON gc.id = gcp.general_cost_id
WHERE gcp.is_deleted IS NOT TRUE;
