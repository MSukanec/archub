-- FIX: Hacer al usuario actual admin de su organización
-- Ejecuta esto en Supabase SQL Editor

-- Opción 1: Si conoces tu email
UPDATE organization_members 
SET role = 'admin'
WHERE user_id = (SELECT id FROM users WHERE email = 'TU_EMAIL_AQUI@gmail.com')
  AND organization_id = (SELECT last_organization_id FROM user_preferences WHERE user_id = (SELECT id FROM users WHERE email = 'TU_EMAIL_AQUI@gmail.com'));

-- Opción 2: Ver todos los miembros y sus roles actuales (para verificar)
SELECT 
  om.id,
  u.email,
  u.full_name,
  om.role,
  om.organization_id
FROM organization_members om
JOIN users u ON om.user_id = u.id
ORDER BY om.created_at;

-- Opción 3: Hacer admin al primer usuario de cada organización
UPDATE organization_members 
SET role = 'admin'
WHERE id IN (
  SELECT DISTINCT ON (organization_id) id 
  FROM organization_members 
  ORDER BY organization_id, created_at ASC
);
