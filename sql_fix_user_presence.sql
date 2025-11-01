-- ============================================
-- FIX USER PRESENCE TRACKING
-- ============================================
-- Este script arregla el foreign key constraint y configura RLS
-- Ejecuta esto en el SQL Editor de Supabase
-- ============================================

-- 1. ELIMINAR LA CONSTRAINT INCORRECTA
ALTER TABLE public.user_presence 
  DROP CONSTRAINT IF EXISTS user_presence_user_fkey;

-- 2. AGREGAR LA CONSTRAINT CORRECTA (apuntando a public.users)
ALTER TABLE public.user_presence
  ADD CONSTRAINT user_presence_user_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.users (id) 
  ON DELETE CASCADE;

-- 3. CONFIGURAR RLS POLICIES

-- Primero, eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view their own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_presence;
DROP POLICY IF EXISTS "Enable insert for authenticated users via RPC" ON public.user_presence;

-- Habilitar RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Política 1: Los usuarios pueden ver su propia presencia
CREATE POLICY "Users can view own presence"
  ON public.user_presence
  FOR SELECT
  USING (user_id = auth.uid());

-- Política 2: Permitir INSERT/UPDATE a través de la función heartbeat
-- (La función usa security definer y bypasea RLS automáticamente)
-- Pero por si acaso, permitimos a usuarios autenticados
CREATE POLICY "Enable insert for authenticated users"
  ON public.user_presence
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON public.user_presence
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política 3: Permitir SELECT a service_role (para el backend admin)
CREATE POLICY "Service role can view all presence"
  ON public.user_presence
  FOR SELECT
  TO service_role
  USING (true);

-- 4. VERIFICAR QUE TODO ESTÁ CORRECTO

-- Ver las constraints
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'user_presence';

-- Ver las políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_presence';

-- 5. LIMPIAR DATOS CORRUPTOS (opcional)
-- Si hay datos con user_id que no existen en public.users, eliminarlos
DELETE FROM public.user_presence
WHERE user_id NOT IN (SELECT id FROM public.users);

-- 6. PROBAR LA FUNCIÓN heartbeat
-- Ejecuta esto para probar (reemplaza el UUID con un org_id real)
-- SELECT heartbeat('1cba2323-c7a8-4e0e-916c-442b3c91b687'::uuid);
