# Detalle de las tablas de Supabase de Notifiaciones:

TABLA USER_NOTIFICATIONS:

create table public.user_notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  notification_id uuid not null,
  delivered_at timestamp with time zone not null default now(),
  read_at timestamp with time zone null,
  clicked_at timestamp with time zone null,
  constraint user_notifications_pkey primary key (id),
  constraint user_notifications_user_id_notification_id_key unique (user_id, notification_id),
  constraint user_notifications_notification_id_fkey foreign KEY (notification_id) references notifications (id) on delete CASCADE,
  constraint user_notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists user_notifications_user_idx on public.user_notifications using btree (user_id, read_at) TABLESPACE pg_default;

Tabla NOTIFICATIONS:

create table public.notifications (
  id uuid not null default gen_random_uuid (),
  type text not null,
  title text not null,
  body text null,
  data jsonb null,
  audience text not null default 'direct'::text,
  role_id uuid null,
  org_id uuid null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  start_at timestamp with time zone null,
  expires_at timestamp with time zone null,
  constraint notifications_pkey primary key (id),
  constraint notifications_created_by_fkey foreign KEY (created_by) references users (id)
) TABLESPACE pg_default;

create index IF not exists notifications_created_at_idx on public.notifications using btree (created_at desc) TABLESPACE pg_default;

