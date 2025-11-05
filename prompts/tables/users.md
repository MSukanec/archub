# Detalle de las tablas de Supabase relacionadas a USUARIOS:

--------------- TABLA USER_DATA:

create table public.user_data (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  country uuid null,
  created_at timestamp with time zone null default now(),
  birthdate date null,
  updated_at timestamp with time zone null default now(),
  first_name text null,
  last_name text null,
  phone_e164 text null,
  constraint user_profile_data_pkey primary key (id),
  constraint user_data_id_key unique (id),
  constraint user_data_user_id_key unique (user_id),
  constraint user_data_country_fkey foreign KEY (country) references countries (id) on delete set null,
  constraint user_profile_data_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on user_data for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_user_data_fill_user BEFORE INSERT on user_data for EACH row
execute FUNCTION fill_user_data_user_id_from_auth ();

--------------- TABLA USER_NOTIFICATIONS:

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

--------------- TABLA USER_ORGANIZATION_PREFERENCES:

create table public.user_organization_preferences (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  organization_id uuid not null,
  last_project_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_organization_preferences_pkey primary key (id),
  constraint user_organization_preferences_user_id_organization_id_key unique (user_id, organization_id),
  constraint user_organization_preferences_last_project_id_fkey foreign KEY (last_project_id) references projects (id) on delete set null,
  constraint user_organization_preferences_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint user_organization_preferences_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

--------------- TABLA USER_PREFERENCES:

create table public.user_preferences (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  last_organization_id uuid null,
  theme text null default 'light'::text,
  onboarding_completed boolean null default false,
  created_at timestamp with time zone null default now(),
  sidebar_docked boolean null default false,
  updated_at timestamp with time zone null default now(),
  last_user_type public.user_type null,
  home_checklist jsonb not null default '{"create_contact": false, "create_project": false, "create_movement": false}'::jsonb,
  home_banner_dismissed boolean not null default false,
  last_home_seen_at timestamp with time zone not null default now(),
  constraint user_preferences_pkey primary key (id),
  constraint user_preferences_user_id_key unique (user_id),
  constraint user_preferences_last_organization_id_fkey foreign KEY (last_organization_id) references organizations (id) on delete set null,
  constraint user_preferences_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint user_preferences_theme_chk check (
    (theme = any (array['light'::text, 'dark'::text]))
  )
) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on user_preferences for EACH row
execute FUNCTION update_updated_at_column ();

--------------- TABLA USER_PRESENCE:

create table public.user_presence (
  user_id uuid not null,
  org_id uuid not null,
  last_seen_at timestamp with time zone not null default now(),
  status text not null default 'online'::text,
  user_agent text null,
  locale text null,
  updated_from text null,
  current_view text null,
  constraint user_presence_pkey primary key (user_id),
  constraint user_presence_user_id_key unique (user_id),
  constraint user_presence_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists user_presence_org_idx on public.user_presence using btree (org_id) TABLESPACE pg_default;

--------------- TABLA USER_VIEW_HISTORY:

create table public.user_view_history (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  organization_id uuid null,
  view_name text not null,
  entered_at timestamp with time zone not null default now(),
  exited_at timestamp with time zone null,
  duration_seconds integer null,
  created_at timestamp with time zone null default now(),
  constraint user_view_history_pkey primary key (id),
  constraint user_view_history_organization_id_fkey foreign KEY (organization_id) references organizations (id),
  constraint user_view_history_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

--------------- TABLA USERS:

create table public.users (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  auth_id uuid not null,
  email text not null,
  avatar_url text null,
  avatar_source public.avatar_source_t null default 'email'::avatar_source_t,
  full_name text null,
  role_id uuid not null default 'e6cc68d2-fc28-421b-8bd3-303326ef91b8'::uuid,
  updated_at timestamp with time zone null default now(),
  is_active boolean not null default true,
  constraint users_pkey primary key (id),
  constraint users_auth_id_key unique (auth_id),
  constraint users_id_key unique (id),
  constraint users_auth_id_fkey foreign KEY (auth_id) references auth.users (id) on delete CASCADE,
  constraint users_role_id_fkey foreign KEY (role_id) references roles (id) on delete RESTRICT,
  constraint users_email_format_chk check (
    (
      email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists users_email_lower_uniq on public.users using btree (lower(email)) TABLESPACE pg_default;

create index IF not exists idx_users_auth_id on public.users using btree (auth_id) TABLESPACE pg_default;

create index IF not exists idx_users_role_id on public.users using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_users_avatar_source on public.users using btree (avatar_source) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_users_normalize_email BEFORE INSERT
or
update on users for EACH row
execute FUNCTION users_normalize_email ();