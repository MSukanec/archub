-- ============================================
-- FIX RLS PARA USER_PREFERENCES Y USER_ORGANIZATION_PREFERENCES
-- ============================================
-- Problema: Ambas tablas tienen user_id FK a public.users.id
-- pero las RLS verifican contra auth.uid() directamente
-- Solución: Hacer join con public.users igual que user_data
-- ============================================

-- ==========================================
-- TABLA: USER_PREFERENCES
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Eliminar policies existentes
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "USUARIOS ACTUALIZAN SUS PREFERENCIAS" ON public.user_preferences;

-- Policy 1: SELECT - Usuarios ven sus propias preferencias
CREATE POLICY "USUARIOS VEN SUS PREFERENCIAS"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_preferences.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Policy 2: INSERT - Usuarios insertan sus propias preferencias
CREATE POLICY "USUARIOS INSERTAN SUS PREFERENCIAS"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_preferences.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Policy 3: UPDATE - Usuarios actualizan sus propias preferencias
CREATE POLICY "USUARIOS ACTUALIZAN SUS PREFERENCIAS"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_preferences.user_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_preferences.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Policy 4: DELETE - Usuarios eliminan sus propias preferencias
CREATE POLICY "USUARIOS ELIMINAN SUS PREFERENCIAS"
  ON public.user_preferences
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_preferences.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- ==========================================
-- TABLA: USER_ORGANIZATION_PREFERENCES
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.user_organization_preferences ENABLE ROW LEVEL SECURITY;

-- Eliminar policies existentes
DROP POLICY IF EXISTS "Users can view their own org preferences" ON public.user_organization_preferences;
DROP POLICY IF EXISTS "Users can insert their own org preferences" ON public.user_organization_preferences;
DROP POLICY IF EXISTS "Users can update their own org preferences" ON public.user_organization_preferences;
DROP POLICY IF EXISTS "Users can delete their own org preferences" ON public.user_organization_preferences;

-- Policy 1: SELECT - Usuarios ven sus propias preferencias de organización
CREATE POLICY "USUARIOS VEN SUS PREFERENCIAS DE ORG"
  ON public.user_organization_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_organization_preferences.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Policy 2: INSERT - Usuarios insertan sus propias preferencias de organización
CREATE POLICY "USUARIOS INSERTAN SUS PREFERENCIAS DE ORG"
  ON public.user_organization_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_organization_preferences.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Policy 3: UPDATE - Usuarios actualizan sus propias preferencias de organización
CREATE POLICY "USUARIOS ACTUALIZAN SUS PREFERENCIAS DE ORG"
  ON public.user_organization_preferences
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_organization_preferences.user_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_organization_preferences.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Policy 4: DELETE - Usuarios eliminan sus propias preferencias de organización
CREATE POLICY "USUARIOS ELIMINAN SUS PREFERENCIAS DE ORG"
  ON public.user_organization_preferences
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = user_organization_preferences.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- ==========================================
-- VERIFICACIÓN
-- ==========================================

-- Ver policies de user_preferences
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_preferences'
ORDER BY policyname;

-- Ver policies de user_organization_preferences
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_organization_preferences'
ORDER BY policyname;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Ambas tablas usan user_id FK a public.users.id
-- 2. Las RLS verifican ownership con: users.auth_id = auth.uid()
-- 3. Este es el mismo patrón que user_data, user_presence
-- 4. El código usa userData.user.id (public.users.id) correctamente
-- ============================================
