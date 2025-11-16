-- ============================================================
-- CLIENT_LIST_VIEW - Vista Optimizada para Tab LISTA
-- ============================================================
-- Esta vista pre-computa TODOS los JOINs necesarios para la tab LISTA,
-- eliminando queries adicionales en runtime.
--
-- Datos incluidos:
-- 1. Datos financieros (de client_financial_overview)
-- 2. Datos del project_client (unit, notes, is_primary, status)
-- 3. Avatar del usuario (contacts -> users)
-- 4. Datos del proyecto (name, color)
-- 5. Datos de moneda (code, symbol)
--
-- Performance: ~8 JOINs eliminados por query
-- ============================================================

CREATE OR REPLACE VIEW client_list_view AS
SELECT 
  -- IDs principales
  cfo.project_client_id,
  cfo.project_id,
  cfo.client_id,
  cfo.organization_id,
  cfo.currency_id,
  
  -- Datos del contact (ya en client_financial_overview)
  cfo.client_first_name AS contact_first_name,
  cfo.client_last_name AS contact_last_name,
  cfo.client_name AS contact_full_name,
  cfo.client_email AS contact_email,
  cfo.client_phone AS contact_phone,
  cfo.client_company_name AS contact_company_name,
  
  -- Avatar del usuario (JOIN con contacts -> users)
  u.id AS linked_user_id,
  u.avatar_url AS linked_user_avatar_url,
  
  -- Datos del project_client (JOIN con project_clients)
  pc.unit,
  pc.notes,
  pc.is_primary,
  pc.status,
  
  -- Datos del role (ya en client_financial_overview)
  cfo.role_id,
  cfo.role_name,
  cfo.role_is_default,
  
  -- Datos del proyecto (JOIN con projects)
  p.name AS project_name,
  p.color AS project_color,
  
  -- Datos de moneda (JOIN con currencies)
  curr.code AS currency_code,
  curr.symbol AS currency_symbol,
  
  -- Datos financieros (ya en client_financial_overview)
  cfo.total_committed_amount,
  cfo.total_paid_amount,
  cfo.balance_due,
  cfo.next_due_date,
  cfo.next_due_amount,
  cfo.last_payment_date,
  cfo.total_schedule_items,
  cfo.schedule_paid,
  cfo.schedule_overdue,
  cfo.payments_missing_rate

FROM client_financial_overview cfo

-- JOIN project_clients para obtener: unit, notes, is_primary, status
LEFT JOIN project_clients pc ON pc.id = cfo.project_client_id

-- JOIN contacts para llegar al linked_user
LEFT JOIN contacts c ON c.id = cfo.client_id

-- JOIN users para obtener avatar_url
LEFT JOIN users u ON u.id = c.linked_user_id

-- JOIN projects para obtener: name, color (necesario para vista de organización)
LEFT JOIN projects p ON p.id = cfo.project_id

-- JOIN currencies para obtener: code, symbol
LEFT JOIN currencies curr ON curr.id = cfo.currency_id;

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
-- Nota: Las vistas materializadas necesitan índices explícitos.
-- Si esta vista se convierte en materializada, agregar:
-- CREATE INDEX idx_client_list_view_project ON client_list_view(project_id);
-- CREATE INDEX idx_client_list_view_org ON client_list_view(organization_id);
-- CREATE INDEX idx_client_list_view_client ON client_list_view(project_client_id);
-- ============================================================
