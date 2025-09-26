# Detalle de las tablas de Supabase de Presupuestos:

TABLA BUDGETS:

create table public.budgets (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  project_id uuid not null,
  organization_id uuid not null,
  status text not null default 'draft'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  version integer not null default 1,
  currency_id uuid not null,
  exchange_rate numeric(18, 6) null,
  constraint budgets_pkey primary key (id),
  constraint ux_budgets_project_name_version unique (project_id, name, version),
  constraint budgets_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint budgets_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint budgets_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint budgets_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_budgets_org on public.budgets using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_budgets_project on public.budgets using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_budgets_status on public.budgets using btree (status) TABLESPACE pg_default;

create index IF not exists idx_budgets_created on public.budgets using btree (created_by) TABLESPACE pg_default;

create trigger trg_budgets_org_immutable BEFORE
update on budgets for EACH row
execute FUNCTION prevent_column_change ('organization_id');