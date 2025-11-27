# Detalle de las tablas de Supabase de MATERIALS:

---------- TABLA GENERAL_COSTS:

create table public.general_costs (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  name text not null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean null default false,
  deleted_at timestamp without time zone null,
  created_by uuid null,
  constraint general_costs_pkey primary key (id),
  constraint general_costs_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint general_costs_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

