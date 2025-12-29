# Detalle de las funciones de Supabase:

## Funcion analytics_enter_view:

declare
  v_user_id uuid;
  v_org_id uuid;
begin
  select u.id into v_user_id from public.users u where u.auth_id = auth.uid() limit 1;
  if v_user_id is null then return; end if;
  select up.last_organization_id into v_org_id from public.user_preferences up where up.user_id = v_user_id limit 1;
  insert into public.user_view_history (user_id, organization_id, view_name) values (v_user_id, v_org_id, p_view);
end;

## Funcion analytics_exit_previous_view:

declare
  v_user_id uuid;
begin
  select u.id into v_user_id from public.users u where u.auth_id = auth.uid() limit 1;
  if v_user_id is null then return; end if;
  update public.user_view_history set exited_at = now(), duration_seconds = extract(epoch from (now() - entered_at))::integer where user_id = v_user_id and exited_at is null;
end;

## Funcion heartbeat:

declare
  v_auth_id uuid;
  v_user_id uuid;
begin
  v_auth_id := auth.uid();
  if v_auth_id is null then raise exception 'Unauthenticated'; end if;
  select u.id into v_user_id from public.users u where u.auth_id = v_auth_id limit 1;
  if v_user_id is null then raise exception 'User not provisioned'; end if;
  insert into public.user_presence (user_id, org_id, last_seen_at, status, updated_from) values (v_user_id, p_org_id, now(), coalesce(p_status, 'online'), p_from) on conflict (user_id) do update set last_seen_at = excluded.last_seen_at, status = excluded.status, updated_from = excluded.updated_from;
end;

## Funcion log_activity:

begin
  insert into public.organization_activity_logs (
    organization_id,
    user_id,
    action,
    target_table,
    target_id,
    metadata,
    created_at
  )
  values (
    p_organization_id,
    p_user_id,
    p_action,
    p_target_table,
    p_target_id,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  );
end;

## Funcion presence_set_view:

declare
  v_user_id uuid;
begin
  v_user_id := public.current_user_id();
  if v_user_id is null then raise exception 'User not authenticated'; end if;
  update public.user_presence set current_view = p_view where user_id = v_user_id;
end;

## Funcion update_org_last_activity:

begin
  if new.organization_id is not null then
    update public.organizations set last_activity_at = now() where id = new.organization_id;
  end if;
  return new;
end;















