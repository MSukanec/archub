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
  constraint projects_pkey primary key (id),
  constraint projects_id_key unique (id),
  constraint projects_created_by_fkey foreign KEY (created_by) references organization_members (id),
  constraint projects_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
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

create unique INDEX IF not exists projects_org_name_lower_uniq on public.projects using btree (organization_id, lower(name)) TABLESPACE pg_default;

create trigger on_new_project
after INSERT on projects for EACH row
execute FUNCTION handle_new_project ();