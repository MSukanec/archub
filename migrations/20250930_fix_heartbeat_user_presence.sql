-- Función RPC para actualizar user_presence (tracking individual de usuarios)
-- Este RPC se llama desde el frontend cada 30 segundos para mantener actualizado
-- el estado de presencia de cada usuario

CREATE OR REPLACE FUNCTION public.heartbeat(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar o insertar en user_presence
  -- Usa el user_id del usuario autenticado (auth.uid())
  INSERT INTO public.user_presence (
    user_id,
    org_id,
    last_seen_at,
    status
  )
  VALUES (
    auth.uid(),
    p_org_id,
    NOW(),
    'online'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    org_id = EXCLUDED.org_id,
    last_seen_at = EXCLUDED.last_seen_at,
    status = EXCLUDED.status;
    
  -- Opcionalmente, también actualizar organization_online_users para métricas a nivel organización
  INSERT INTO public.organization_online_users (
    org_id,
    user_id,
    last_seen_at,
    is_online
  )
  VALUES (
    p_org_id,
    auth.uid(),
    NOW(),
    true
  )
  ON CONFLICT (org_id, user_id)
  DO UPDATE SET
    last_seen_at = EXCLUDED.last_seen_at,
    is_online = true;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.heartbeat(uuid) TO authenticated;
