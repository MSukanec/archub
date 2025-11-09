# Detalle de las tablas de Supabase relacionados a PROYECTOS:

---------- TABLA PROJECTS:

create table public.projects (
  created_at timestamp with time zone not null default now(),
  name text not null,
  organization_id uuid not null,
  is_active boolean not null default true,
  id uuid not null default gen_random_uuid (),
  status text not null default 'Activo'::text,
  updated_at timestamp with time zone not null default now(),
  created_by uuid not null,
  color text null,
  use_custom_color boolean not null default false,
  custom_color_h integer null,
  custom_color_hex text null,
  code text null,
  constraint projects_pkey primary key (id),
  constraint projects_id_key unique (id),
  constraint projects_code_unique_per_org unique (organization_id, code),
  constraint projects_created_by_fkey foreign KEY (created_by) references organization_members (id),
  constraint projects_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint projects_name_not_blank_chk check ((btrim(name) <> ''::text)),
  constraint projects_custom_color_h_check check (
    (
      (custom_color_h >= 0)
      and (custom_color_h <= 360)
    )
  )
) TABLESPACE pg_default;

create index IF not exists projects_org_idx on public.projects using btree (organization_id) TABLESPACE pg_default;

create index IF not exists projects_created_by_idx on public.projects using btree (created_by) TABLESPACE pg_default;

create index IF not exists projects_org_active_idx on public.projects using btree (organization_id, is_active) TABLESPACE pg_default;

create unique INDEX IF not exists projects_org_name_lower_uniq on public.projects using btree (organization_id, lower(name)) TABLESPACE pg_default;

create index IF not exists idx_projects_code on public.projects using btree (code) TABLESPACE pg_default;

---------- TABLA PROJECT_DATA:

create table public.project_data (
  project_id uuid not null,
  surface_total numeric(12, 2) null,
  surface_covered numeric(12, 2) null,
  surface_semi numeric(12, 2) null,
  start_date date null,
  estimated_end date null,
  project_type_id uuid null,
  project_image_url text null,
  lat numeric(9, 6) null,
  lng numeric(9, 6) null,
  zip_code text null,
  description text null,
  internal_notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  country text null,
  state text null,
  address text null,
  city text null,
  client_name text null,
  contact_phone text null,
  email text null,
  modality_id uuid null,
  organization_id uuid null,
  constraint project_data_pkey primary key (project_id),
  constraint project_data_modality_id_fkey foreign KEY (modality_id) references modalities (id) on delete set null,
  constraint project_data_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint project_data_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint project_data_project_type_id_fkey foreign KEY (project_type_id) references project_types (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists project_data_type_idx on public.project_data using btree (project_type_id) TABLESPACE pg_default;

create index IF not exists project_data_modality_idx on public.project_data using btree (modality_id) TABLESPACE pg_default;

create index IF not exists project_data_city_idx on public.project_data using btree (city) TABLESPACE pg_default;

create index IF not exists project_data_zip_idx on public.project_data using btree (zip_code) TABLESPACE pg_default;