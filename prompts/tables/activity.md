# Detalle de las tablas de Supabase de ACTIVIDAD:

---------- TABLA ORGANIZATION_ACTIVITY_LOGS:

create table public.organization_activity_logs (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  user_id uuid null,
  action text not null,
  target_table text not null,
  target_id uuid null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint organization_activity_logs_pkey primary key (id),
  constraint organization_activity_logs_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_activity_logs_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_org_id on public.organization_activity_logs using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_user_id on public.organization_activity_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_target on public.organization_activity_logs using btree (target_table, target_id) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_created_at on public.organization_activity_logs using btree (created_at desc) TABLESPACE pg_default;

---------- VISTA ORGANIZATION_ACTIVITY_LOGS_VIEW:

create view public.organization_activity_logs_view as
select
  l.id,
  l.organization_id,
  l.user_id,
  l.action,
  l.target_table,
  l.target_id,
  l.metadata,
  l.created_at,
  u.full_name,
  u.avatar_url,
  u.email
from
  organization_activity_logs l
  left join users u on l.user_id = u.id;

  ---------- FUNCION LOG_ACTIVITY:

BEGIN
  INSERT INTO public.organization_activity_logs (
    organization_id,
    user_id,
    action,
    target_table,
    target_id,
    metadata,
    created_at
  )
  VALUES (
    p_organization_id,
    p_user_id,
    p_action,
    p_target_table,
    p_target_id,
    COALESCE(p_metadata, '{}'::jsonb),
    now()
  );
END;
