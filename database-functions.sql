-- Analytics and Presence Tracking Functions
-- Execute these functions in Supabase SQL Editor to enable analytics tracking

-- ==============================================
-- Function: heartbeat
-- Description: Updates user presence with current organization and status
-- Called: Every 30 seconds by useHeartbeat hook
-- ==============================================
CREATE OR REPLACE FUNCTION heartbeat(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_presence (
    user_id, 
    status, 
    updated_at, 
    organization_id,
    user_agent,
    locale
  )
  VALUES (
    auth.uid(),
    'online',
    NOW(),
    p_org_id,
    current_setting('request.headers', true)::json->>'user-agent',
    current_setting('request.headers', true)::json->>'accept-language'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    status = 'online',
    updated_at = NOW(),
    organization_id = p_org_id;
END;
$$;

-- ==============================================
-- Function: analytics_enter_view
-- Description: Registers entry into a new view/page
-- Called: On every page navigation by usePresenceTracker
-- ==============================================
CREATE OR REPLACE FUNCTION analytics_enter_view(p_view text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get current user's organization from user_presence
  SELECT organization_id INTO v_org_id
  FROM user_presence
  WHERE user_id = auth.uid();

  -- Insert new view entry
  INSERT INTO user_view_history (
    user_id,
    view_name,
    entered_at,
    organization_id
  )
  VALUES (
    auth.uid(),
    p_view,
    NOW(),
    v_org_id
  );

  -- Update user_presence with current view
  UPDATE user_presence
  SET current_view = p_view,
      updated_at = NOW()
  WHERE user_id = auth.uid();
END;
$$;

-- ==============================================
-- Function: analytics_exit_previous_view
-- Description: Closes previous view and calculates duration
-- Called: Before entering a new view by usePresenceTracker
-- ==============================================
CREATE OR REPLACE FUNCTION analytics_exit_previous_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_entry_id uuid;
  v_duration_secs integer;
BEGIN
  -- Find the most recent unclosed view entry
  SELECT id INTO v_last_entry_id
  FROM user_view_history
  WHERE user_id = auth.uid()
    AND exited_at IS NULL
  ORDER BY entered_at DESC
  LIMIT 1;

  -- If found, close it and calculate duration
  IF v_last_entry_id IS NOT NULL THEN
    -- Calculate duration in seconds
    SELECT EXTRACT(EPOCH FROM (NOW() - entered_at))::integer
    INTO v_duration_secs
    FROM user_view_history
    WHERE id = v_last_entry_id;

    -- Update the record
    UPDATE user_view_history
    SET exited_at = NOW(),
        duration_seconds = v_duration_secs
    WHERE id = v_last_entry_id;
  END IF;
END;
$$;

-- ==============================================
-- Function: cleanup_offline_users
-- Description: Marks users as offline if no heartbeat for 2 minutes
-- Note: This can be called by a cron job or manually
-- ==============================================
CREATE OR REPLACE FUNCTION cleanup_offline_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_presence
  SET status = 'offline'
  WHERE updated_at < NOW() - INTERVAL '2 minutes'
    AND status = 'online';
END;
$$;

-- ==============================================
-- Grants - Allow authenticated users to call these functions
-- ==============================================
GRANT EXECUTE ON FUNCTION heartbeat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_enter_view(text) TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_exit_previous_view() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_offline_users() TO authenticated;

-- ==============================================
-- Comments for documentation
-- ==============================================
COMMENT ON FUNCTION heartbeat IS 'Updates user presence every 30 seconds';
COMMENT ON FUNCTION analytics_enter_view IS 'Registers when user enters a new page/view';
COMMENT ON FUNCTION analytics_exit_previous_view IS 'Closes previous view and calculates time spent';
COMMENT ON FUNCTION cleanup_offline_users IS 'Marks users offline after 2 minutes of inactivity';
