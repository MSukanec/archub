-- ============================================
-- FUNCIONES CORREGIDAS PARA ANALYTICS Y PRESENCE
-- ============================================
-- Copia y pega estas funciones en Supabase SQL Editor
-- Reemplazarán las funciones existentes con errores
-- ============================================

-- FUNCIÓN 1: analytics_enter_view
-- Registra cuando un usuario entra a una vista
CREATE OR REPLACE FUNCTION public.analytics_enter_view(p_view text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Obtener user_id de la sesión actual
  SELECT id INTO v_user_id 
  FROM public.users 
  WHERE auth_id = auth.uid();
  
  -- Obtener organization_id desde user_preferences
  SELECT last_organization_id INTO v_org_id 
  FROM public.user_preferences 
  WHERE user_id = v_user_id;
  
  -- Insertar en user_view_history (entered_at se llena automáticamente con DEFAULT now())
  INSERT INTO public.user_view_history(user_id, organization_id, view_name)
  VALUES (v_user_id, v_org_id, p_view);
END;
$$;

-- FUNCIÓN 2: analytics_exit_previous_view
-- Cierra la vista anterior registrando el tiempo de salida
CREATE OR REPLACE FUNCTION public.analytics_exit_previous_view()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Obtener user_id de la sesión actual
  SELECT id INTO v_user_id 
  FROM public.users 
  WHERE auth_id = auth.uid();
  
  -- Actualizar la última vista abierta (sin exited_at) para este usuario
  UPDATE public.user_view_history
  SET exited_at = now(),
      duration_seconds = extract(epoch FROM (now() - entered_at))
  WHERE user_id = v_user_id
    AND exited_at IS NULL;
END;
$$;

-- FUNCIÓN 3: presence_set_view
-- Actualiza la vista actual del usuario en user_presence
CREATE OR REPLACE FUNCTION public.presence_set_view(p_view text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_auth_id uuid;
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Obtener auth_id
  v_auth_id := auth.uid();
  
  -- Obtener user_id desde tabla users
  SELECT id INTO v_user_id 
  FROM public.users 
  WHERE auth_id = v_auth_id;
  
  -- Si no se encuentra el usuario, salir
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found in public.users';
  END IF;
  
  -- Obtener organization_id desde user_preferences
  SELECT last_organization_id INTO v_org_id 
  FROM public.user_preferences 
  WHERE user_id = v_user_id;
  
  -- Actualizar user_presence
  UPDATE public.user_presence
  SET current_view = p_view
  WHERE user_id = v_user_id;
END;
$$;

-- ============================================
-- VERIFICACIÓN DE TABLAS
-- ============================================
-- Asegúrate de que user_view_history tenga estos campos:
-- - user_id (uuid)
-- - organization_id (uuid)
-- - view_name (text)
-- - entered_at (timestamp with time zone) DEFAULT now()
-- - exited_at (timestamp with time zone) NULL
-- - duration_seconds (numeric) NULL
