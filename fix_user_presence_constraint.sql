-- ============================================
-- FIX USER_PRESENCE FOREIGN KEY CONSTRAINT
-- ============================================
-- El problema: user_presence.user_id debe apuntar a public.users.id (NO a auth.users.id)
-- La función heartbeat inserta public.users.id, entonces el FK debe validar contra public.users
-- ============================================

-- PASO 1: Ver el constraint actual (ejecuta esto primero)
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_presence' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- PASO 2: Eliminar el constraint incorrecto (si existe)
-- Si el query anterior muestra que foreign_table_name = 'users' y foreign_table_schema = 'auth'
-- entonces necesitas ejecutar esto:
ALTER TABLE public.user_presence 
  DROP CONSTRAINT IF EXISTS user_presence_user_fkey;

-- PASO 3: Agregar el constraint CORRECTO
-- Este apunta a public.users.id (NO a auth.users.id)
ALTER TABLE public.user_presence
  ADD CONSTRAINT user_presence_user_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.users (id) 
  ON DELETE CASCADE;

-- PASO 4: Limpiar datos inválidos (opcional)
-- Eliminar registros de user_presence que no tienen un user_id válido en public.users
DELETE FROM public.user_presence
WHERE user_id NOT IN (SELECT id FROM public.users);

-- PASO 5: Verificar que el constraint está correcto
SELECT 
  tc.constraint_name,
  kcu.column_name AS column_name,
  ccu.table_schema AS references_schema,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_presence' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- ✅ RESULTADO ESPERADO:
-- constraint_name: user_presence_user_fkey
-- column_name: user_id
-- references_schema: public
-- references_table: users
-- references_column: id
