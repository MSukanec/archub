# Detalle de las tablas de Supabase para BITACORAS DE OBRA:

---------- TABLA SITE_LOG_TYPES:

create table public.site_log_types (
  id uuid not null default gen_random_uuid (),
  name text not null,
  code text not null,
  description text null,
  icon text null,
  color text null,
  is_default boolean not null default false,
  created_at timestamp with time zone null default now(),
  organization_id uuid null,
  updated_at timestamp with time zone null default now(),
  constraint site_log_types_pkey primary key (id),
  constraint site_log_types_code_key unique (code),
  constraint site_log_types_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

---------- TABLA SITE_LOG_FILES:

create table public.site_logs (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  created_by uuid null,
  log_date date not null,
  comments text null,
  created_at timestamp with time zone not null default now(),
  is_public boolean null default false,
  status public.site_log_status null default 'Pendiente de Revisión (Nuevo)'::site_log_status,
  updated_at timestamp with time zone not null default now(),
  is_favorite boolean null default false,
  weather public.weather_enum null default 'none'::weather_enum,
  organization_id uuid not null,
  entry_type_id uuid null,
  severity public.site_log_severity null default 'low'::site_log_severity,
  ai_summary text null,
  ai_tags text[] null,
  ai_analyzed boolean not null default false,
  location text null,
  log_time time without time zone null,
  constraint site_logs_pkey primary key (id),
  constraint site_logs_created_by_fkey1 foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint site_logs_entry_type_id_fkey foreign KEY (entry_type_id) references organization_site_log_types (id),
  constraint site_logs_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint site_logs_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;
