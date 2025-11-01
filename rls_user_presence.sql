-- ============================================
-- RLS POLICIES PARA USER_PRESENCE
-- ============================================
-- Siguiendo el mismo patrón que user_data:
-- user_presence.user_id -> public.users.id -> users.auth_id = auth.uid()
-- ============================================

-- PASO 1: Habilitar RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar policies existentes (si las hay)
DROP POLICY IF EXISTS "Users can view own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can view their own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_presence;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.user_presence;
DROP POLICY IF EXISTS "Service role can view all presence" ON public.user_presence;

-- PASO 3: Crear policies correctas

-- Policy 1: SELECT - Usuarios pueden ver su propia presencia
CREATE POLICY "USUARIOS VEN SU PROPIA PRESENCIA"
  ON public.user_presence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_presence.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Policy 2: INSERT - Usuarios pueden insertar su propia presencia
-- (La función heartbeat usa security definer, pero esta policy es útil para seguridad adicional)
CREATE POLICY "USUARIOS INSERTAN SU PROPIA PRESENCIA"
  ON public.user_presence
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_presence.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Policy 3: UPDATE - Usuarios pueden actualizar su propia presencia
CREATE POLICY "USUARIOS ACTUALIZAN SU PROPIA PRESENCIA"
  ON public.user_presence
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_presence.user_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_presence.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Policy 4: DELETE - Usuarios pueden eliminar su propia presencia (opcional)
CREATE POLICY "USUARIOS ELIMINAN SU PROPIA PRESENCIA"
  ON public.user_presence
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_presence.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Policy 5: SERVICE_ROLE puede ver todo (para admin)
CREATE POLICY "SERVICE_ROLE VE TODA PRESENCIA"
  ON public.user_presence
  FOR SELECT
  TO service_role
  USING (true);

-- PASO 4: Verificar las policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_presence'
ORDER BY policyname;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. La función heartbeat() usa SECURITY DEFINER, lo que significa que bypasea RLS
--    automáticamente porque ejecuta con los permisos del owner de la función.
-- 
-- 2. Estas policies protegen contra acceso directo a la tabla user_presence
--    fuera de la función heartbeat.
--
-- 3. El patrón es el mismo que user_data:
--    - user_presence.user_id apunta a public.users.id
--    - Verificamos ownership con: users.auth_id = auth.uid()
--
-- 4. La policy de service_role permite que el backend admin lea todos los datos
--    usando el admin client (getAdminClient()).
-- ============================================
