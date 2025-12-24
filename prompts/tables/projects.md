# Detalle de las tablas de Supabase relacionados a PROYECTOS:

## Tabla PROJECT_DATA:

create table public.project_data (
  project_id uuid not null,
  surface_total numeric(12, 2) null,
  surface_covered numeric(12, 2) null,
  surface_semi numeric(12, 2) null,
  start_date date null,
  estimated_end date null,
  project_type_id uuid null,
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
  project_modality_id uuid null,
  organization_id uuid not null,
  accessibility_notes text null,
  address_full text null,
  location_type text null,
  place_id text null,
  timezone text null,
  image_bucket text null,
  image_path text null,
  is_public boolean not null default false,
  constraint project_data_pkey primary key (project_id),
  constraint project_data_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint project_data_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint project_data_project_modality_id_fkey foreign KEY (project_modality_id) references project_modalities (id) on delete set null,
  constraint project_data_project_type_id_fkey foreign KEY (project_type_id) references project_types (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists project_data_type_idx on public.project_data using btree (project_type_id) TABLESPACE pg_default;

create index IF not exists project_data_modality_idx on public.project_data using btree (project_modality_id) TABLESPACE pg_default;

create index IF not exists project_data_city_idx on public.project_data using btree (city) TABLESPACE pg_default;

create index IF not exists project_data_zip_idx on public.project_data using btree (zip_code) TABLESPACE pg_default;

create index IF not exists project_data_org_idx on public.project_data using btree (organization_id) TABLESPACE pg_default;

create index IF not exists project_data_org_project_idx on public.project_data using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_project_data_image_bucket on public.project_data using btree (image_bucket) TABLESPACE pg_default
where
  (image_bucket is not null);

create index IF not exists idx_project_data_image_metadata on public.project_data using btree (organization_id, image_bucket, image_path) TABLESPACE pg_default
where
  (image_bucket is not null);

create trigger project_data_set_updated_at BEFORE
update on project_data for EACH row
execute FUNCTION set_timestamp ();

## Tabla PROJECT_MODALITIES:

create table public.project_modalities (
  id uuid not null default gen_random_uuid (),
  name text not null,
  is_default boolean null default true,
  created_at timestamp with time zone null default now(),
  organization_id uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  created_by uuid null,
  constraint project_modalities_pkey primary key (id),
  constraint project_modalities_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint project_modalities_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists project_modalities_org_idx on public.project_modalities using btree (organization_id) TABLESPACE pg_default;

create index IF not exists project_modalities_not_deleted_idx on public.project_modalities using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create unique INDEX IF not exists project_modalities_org_name_uniq on public.project_modalities using btree (organization_id, lower(name)) TABLESPACE pg_default;

create trigger project_modalities_set_updated_at BEFORE
update on project_modalities for EACH row
execute FUNCTION set_timestamp ();

## Tabla PROJECT_TYPES:

create table public.project_types (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone null default now(),
  is_default boolean not null default false,
  organization_id uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  created_by uuid null,
  constraint project_types_pkey primary key (id),
  constraint project_types_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint project_types_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists project_types_not_deleted_idx on public.project_types using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists project_types_org_idx on public.project_types using btree (organization_id) TABLESPACE pg_default;

create unique INDEX IF not exists project_types_org_name_uniq on public.project_types using btree (organization_id, lower(name)) TABLESPACE pg_default;

create trigger project_types_set_updated_at BEFORE
update on project_types for EACH row
execute FUNCTION set_timestamp ();

## Tabla PROJECTS:

create table public.projects (
  created_at timestamp with time zone not null default now(),
  name text not null,
  organization_id uuid not null,
  is_active boolean not null default true,
  id uuid not null default gen_random_uuid (),
  status text not null default 'Activo'::text,
  updated_at timestamp with time zone not null default now(),
  created_by uuid null,
  color text null,
  use_custom_color boolean not null default false,
  custom_color_h integer null,
  custom_color_hex text null,
  code text null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  last_active_at timestamp with time zone null,
  is_over_limit boolean null default false,
  currency_id uuid not null,
  constraint projects_pkey primary key (id),
  constraint projects_id_key unique (id),
  constraint projects_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint projects_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint projects_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint projects_custom_color_h_check check (
    (
      (custom_color_h >= 0)
      and (custom_color_h <= 360)
    )
  ),
  constraint projects_name_not_blank_chk check ((btrim(name) <> ''::text))
) TABLESPACE pg_default;

create index IF not exists projects_org_idx on public.projects using btree (organization_id) TABLESPACE pg_default;

create index IF not exists projects_created_by_idx on public.projects using btree (created_by) TABLESPACE pg_default;

create index IF not exists projects_org_active_idx on public.projects using btree (organization_id, is_active) TABLESPACE pg_default;

create index IF not exists projects_created_at_idx on public.projects using btree (created_at) TABLESPACE pg_default;

create unique INDEX IF not exists projects_org_code_uniq on public.projects using btree (organization_id, code) TABLESPACE pg_default
where
  (code is not null);

create index IF not exists idx_projects_org_status_active on public.projects using btree (organization_id, status, is_active, is_deleted) TABLESPACE pg_default;

create index IF not exists idx_projects_code on public.projects using btree (code) TABLESPACE pg_default;

create unique INDEX IF not exists projects_org_name_lower_uniq on public.projects using btree (organization_id, lower(name)) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists projects_over_limit_idx on public.projects using btree (organization_id, is_over_limit) TABLESPACE pg_default;

create trigger projects_set_updated_at BEFORE
update on projects for EACH row
execute FUNCTION set_timestamp ();

## Vista PROJECTS_VIEW:

create view public.projects_view as
select
  p.id,
  p.name,
  p.code,
  p.status,
  p.created_at,
  p.updated_at,
  p.last_active_at,
  p.is_active,
  p.is_deleted,
  p.deleted_at,
  p.organization_id,
  p.created_by,
  p.color,
  p.use_custom_color,
  p.custom_color_h,
  p.custom_color_hex,
  p.is_over_limit,
  p.currency_id,
  pd.project_type_id,
  pd.project_modality_id,
  pd.image_bucket,
  pd.image_path,
  pd.is_public,
  pd.city,
  pd.country,
  pd.start_date,
  pd.estimated_end,
  pt.name as project_type_name,
  pm.name as project_modality_name,
  c.symbol as currency_symbol,
  c.code as currency_code,
  c.name as currency_name,
  c.id as currency_id_full
from
  projects p
  left join project_data pd on pd.project_id = p.id
  left join project_types pt on pt.id = pd.project_type_id
  and pt.is_deleted = false
  left join project_modalities pm on pm.id = pd.project_modality_id
  and pm.is_deleted = false
  left join currencies c on c.id = p.currency_id
where
  p.is_deleted = false;