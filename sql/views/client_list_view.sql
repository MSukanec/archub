-- ============================================================
-- CLIENT_LIST_VIEW - Vista para Tab LISTA de Clientes
-- ============================================================
-- Esta vista incluye SOLO los datos necesarios para la tab LISTA.
-- NO incluye datos financieros (esos son para otras tabs).
--
-- Datos mostrados en LISTA:
-- 1. Cliente (nombre, avatar)
-- 2. Mail
-- 3. Teléfono
-- 4. Rol
-- 5. Notas
-- 6. Primario
-- 7. Estado
--
-- Performance: Elimina queries adicionales en runtime usando solo JOINs directos a tablas
-- ============================================================

CREATE OR REPLACE VIEW client_list_view AS
SELECT 
  -- IDs principales
  pc.id AS project_client_id,
  pc.project_id,
  pc.organization_id,
  pc.contact_id AS client_id,
  
  -- Datos del project_client (columnas de la LISTA)
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
  cr.is_default AS role_is_default

FROM project_clients pc

-- JOIN contacts para obtener información del cliente
LEFT JOIN contacts c ON c.id = pc.contact_id

-- JOIN users para obtener avatar (via linked_user_id)
LEFT JOIN users u ON u.id = c.linked_user_id

-- JOIN client_roles para obtener información del rol
LEFT JOIN client_roles cr ON cr.id = pc.client_role_id;

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- Esta vista NO incluye datos financieros porque la tab LISTA
-- no los muestra. Si en el futuro necesitas datos financieros,
-- crea una vista separada (ej: client_financial_view).
-- ============================================================
