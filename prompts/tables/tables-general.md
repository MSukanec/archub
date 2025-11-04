# Detalle de las tablas de Supabase Generales:

TABLA USERS:

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

TABLA USER_DATA:

create table public.user_data (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  country uuid null,
  created_at timestamp with time zone null default now(),
  birthdate date null,
  updated_at timestamp with time zone null default now(),
  first_name text null,
  last_name text null,
  constraint user_profile_data_pkey primary key (id),
  constraint user_data_id_key unique (id),
  constraint user_data_user_id_key unique (user_id),
  constraint user_data_country_fkey foreign KEY (country) references countries (id) on delete set null,
  constraint user_profile_data_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on user_data for EACH row
execute FUNCTION update_updated_at_column ();

TABLA ORGANIZATION_PREFERENCES:

create table public.organization_preferences (
  id uuid not null default gen_random_uuid (),
  organization_id uuid null,
  default_pdf_template_id uuid null,
  created_at timestamp with time zone null default now(),
  default_currency_id uuid null,
  default_wallet_id uuid null,
  updated_at timestamp with time zone null default now(),
  use_currency_exchange boolean not null default false,
  constraint organization_preferences_pkey primary key (id),
  constraint unique_organization_preferences unique (organization_id),
  constraint organization_preferences_default_currency_id_fkey foreign KEY (default_currency_id) references currencies (id) on delete set null,
  constraint organization_preferences_default_pdf_template_id_fkey foreign KEY (default_pdf_template_id) references pdf_templates (id) on delete CASCADE,
  constraint organization_preferences_default_wallet_id_fkey foreign KEY (default_wallet_id) references wallets (id) on delete set null,
  constraint organization_preferences_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on organization_preferences for EACH row
execute FUNCTION update_updated_at_column ();

create trigger update_organization_preferences_updated_at BEFORE
update on organization_preferences for EACH row
execute FUNCTION update_updated_at_column ();

TABLA USER_ORGANIZATION_PREFERENCES:

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

TABLA USER_PREFERENCES:

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

TABLA COUNTRIES:

create table public.countries (
  id uuid not null default gen_random_uuid (),
  alpha_3 text not null,
  country_code text null,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint countries_pkey primary key (id),
  constraint countries_alpha3_format_chk check ((alpha_3 ~ '^[A-Z]{3}$'::text)),
  constraint countries_country_code_chk check (
    (
      (country_code is null)
      or (country_code ~ '^\+?[0-9]{1,4}$'::text)
    )
  ),
  constraint countries_name_not_blank_chk check ((btrim(name) <> ''::text))
) TABLESPACE pg_default;

create unique INDEX IF not exists countries_name_lower_uniq on public.countries using btree (lower(name)) TABLESPACE pg_default;

create unique INDEX IF not exists countries_alpha3_uniq on public.countries using btree (alpha_3) TABLESPACE pg_default;

Tabla GLOBAL_ANNOUNCEMENTS:

create table public.global_announcements (
  id uuid not null default gen_random_uuid (),
  title text not null,
  message text not null,
  type text not null,
  link_text text null,
  link_url text null,
  audience text null default 'all'::text,
  is_active boolean null default true,
  starts_at timestamp with time zone null default now(),
  ends_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  created_by uuid null,
  primary_button_text text null,
  primary_button_url text null,
  secondary_button_text text null,
  secondary_button_url text null,
  constraint global_announcements_pkey primary key (id),
  constraint global_announcements_created_by_fkey foreign KEY (created_by) references users (id),
  constraint global_announcements_audience_check check (
    (
      audience = any (
        array[
          'all'::text,
          'free'::text,
          'pro'::text,
          'teams'::text
        ]
      )
    )
  ),
  constraint global_announcements_type_check check (
    (
      type = any (
        array[
          'info'::text,
          'warning'::text,
          'error'::text,
          'success'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;