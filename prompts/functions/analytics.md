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
