-- ============================================================
-- CLIENT_OBLIGATIONS_VIEW - Vista para Tab COMPROMISOS DE PAGO
-- ============================================================
-- Esta vista incluye datos financieros agregados por moneda
-- usando SOLO tablas base conocidas.
-- 
-- Datos incluidos:
-- 1. Información básica del cliente (nombre, email, avatar, rol)
-- 2. Datos financieros por moneda (compromiso, pagado, saldo)
-- 3. Fechas relevantes (último pago)
-- 
-- Performance: Pre-computa agregaciones financieras con CTEs
-- ============================================================

CREATE OR REPLACE VIEW client_obligations_view AS
WITH client_commitments_agg AS (
  -- Agregar compromisos por cliente y moneda
  SELECT 
    cc.client_id,
    cc.project_id,
    cc.organization_id,
    cc.currency_id,
    SUM(cc.amount) AS total_committed_amount
  FROM client_commitments cc
  GROUP BY cc.client_id, cc.project_id, cc.organization_id, cc.currency_id
),
client_payments_agg AS (
  -- Agregar pagos por cliente y moneda (solo confirmados)
  SELECT 
    cp.client_id,
    cp.project_id,
    cp.organization_id,
    cp.currency_id,
    SUM(cp.amount) AS total_paid_amount,
    MAX(cp.payment_date) AS last_payment_date,
    COUNT(*) FILTER (WHERE cp.exchange_rate IS NULL OR cp.exchange_rate = 0) AS payments_missing_rate
  FROM client_payments cp
  WHERE cp.status = 'confirmed'
  GROUP BY cp.client_id, cp.project_id, cp.organization_id, cp.currency_id
)
SELECT 
  -- IDs principales
  pc.id AS project_client_id,
  pc.project_id,
  pc.organization_id,
  pc.contact_id AS client_id,
  
  -- Datos del project_client
  pc.unit,
  pc.notes,
  pc.is_primary,
  pc.status,
  
  -- Datos del contact
  c.first_name AS contact_first_name,
  c.last_name AS contact_last_name,
  c.full_name AS contact_full_name,
  c.email AS contact_email,
  c.phone AS contact_phone,
  c.company_name AS contact_company_name,
  
  -- Avatar del usuario (via linked_user)
  u.id AS linked_user_id,
  u.avatar_url AS linked_user_avatar_url,
  
  -- Datos del rol
  cr.id AS role_id,
  cr.name AS role_name,
  cr.is_default AS role_is_default,
  
  -- Datos de moneda
  curr.id AS currency_id,
  curr.code AS currency_code,
  curr.symbol AS currency_symbol,
  
  -- Datos financieros agregados
  COALESCE(cca.total_committed_amount, 0) AS total_committed_amount,
  COALESCE(cpa.total_paid_amount, 0) AS total_paid_amount,
  COALESCE(cca.total_committed_amount, 0) - COALESCE(cpa.total_paid_amount, 0) AS balance_due,
  
  -- Fechas
  cpa.last_payment_date,
  
  -- Campos de cronograma (NULL porque no tenemos client_payment_schedule)
  NULL::date AS next_due_date,
  NULL::numeric AS next_due_amount,
  0 AS total_schedule_items,
  0 AS schedule_paid,
  0 AS schedule_overdue,
  
  -- Warning flag para pagos sin tasa de cambio
  COALESCE(cpa.payments_missing_rate, 0) AS payments_missing_rate

FROM project_clients pc

-- JOIN contacts
LEFT JOIN contacts c ON c.id = pc.contact_id

-- JOIN users para avatar
LEFT JOIN users u ON u.id = c.linked_user_id

-- JOIN client_roles
LEFT JOIN client_roles cr ON cr.id = pc.client_role_id

-- JOIN agregaciones de compromisos
LEFT JOIN client_commitments_agg cca ON cca.client_id = pc.id 
  AND cca.project_id = pc.project_id 
  AND cca.organization_id = pc.organization_id

-- JOIN agregaciones de pagos (matchear por moneda)
LEFT JOIN client_payments_agg cpa ON cpa.client_id = pc.id 
  AND cpa.project_id = pc.project_id 
  AND cpa.organization_id = pc.organization_id
  AND cpa.currency_id = cca.currency_id

-- JOIN currencies
LEFT JOIN currencies curr ON curr.id = cca.currency_id;

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. Esta vista usa SOLO tablas base (NO otras vistas)
-- 2. Un cliente puede tener múltiples filas (una por moneda)
-- 3. Los campos de cronograma están en 0/NULL (tabla no disponible)
-- 4. LEFT JOINs permiten que clientes sin compromisos aparezcan
-- ============================================================
