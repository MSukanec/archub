# Detalle de las tablas de Supabase de COSTOS GENERALES:

## Tabla GENERAL_COST_CATEGORIES:

create table public.general_cost_categories (
  id uuid not null default gen_random_uuid (),
  organization_id uuid null,
  name text not null,
  description text null,
  created_at timestamp with time zone not null default now(),
  is_system boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  constraint general_cost_categories_pkey primary key (id),
  constraint fk_gc_cat_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint general_cost_categories_system_org_check check (
    (
      (
        (is_system = true)
        and (organization_id is null)
      )
      or (
        (is_system = false)
        and (organization_id is not null)
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists uq_gc_categories_system_name on public.general_cost_categories using btree (lower(name)) TABLESPACE pg_default
where
  (
    (is_system = true)
    and (is_deleted = false)
  );

create unique INDEX IF not exists uq_gc_categories_org_name on public.general_cost_categories using btree (organization_id, lower(name)) TABLESPACE pg_default
where
  (
    (is_system = false)
    and (is_deleted = false)
  );

create index IF not exists idx_gc_categories_list on public.general_cost_categories using btree (is_system, organization_id, is_deleted, name) TABLESPACE pg_default;

create trigger trg_set_updated_at_general_cost_categories BEFORE
update on general_cost_categories for EACH row
execute FUNCTION set_updated_at ();

## Tabla GENERAL_COST_PAYMENT_ALLOCATIONS:

create table public.general_cost_payment_allocations (
  id uuid not null default gen_random_uuid (),
  payment_id uuid not null,
  project_id uuid not null,
  percentage numeric(5, 2) not null,
  created_at timestamp with time zone not null default now(),
  constraint general_cost_payment_allocations_pkey primary key (id),
  constraint fk_gc_alloc_payment foreign KEY (payment_id) references general_costs_payments (id) on delete CASCADE,
  constraint fk_gc_alloc_project foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint general_cost_payment_allocations_percentage_check check ((percentage > (0)::numeric))
) TABLESPACE pg_default;

## Tabla GENERAL_COSTS:

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
  category_id uuid null,
  is_recurring boolean not null default false,
  recurrence_interval text null,
  expected_day smallint null,
  constraint general_costs_pkey primary key (id),
  constraint general_costs_category_id_fkey foreign KEY (category_id) references general_cost_categories (id) on delete set null,
  constraint general_costs_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint general_costs_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_general_costs_org_deleted on public.general_costs using btree (organization_id, is_deleted) TABLESPACE pg_default;

## Tabla GENERAL_COSTS_PAYMENTS:

create table public.general_costs_payments (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  exchange_rate numeric null,
  payment_date date not null default now(),
  notes text null,
  reference text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone not null default now(),
  wallet_id uuid not null,
  general_cost_id uuid null,
  status text not null default 'confirmed'::text,
  created_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint general_costs_payments_pkey primary key (id),
  constraint fk_gc_payment_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint fk_gc_payment_general_cost foreign KEY (general_cost_id) references general_costs (id) on delete set null,
  constraint fk_gc_payment_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_gc_payment_created_by foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint general_costs_payments_wallet_id_fkey foreign KEY (wallet_id) references organization_wallets (id) on delete RESTRICT,
  constraint general_costs_payments_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'confirmed'::text,
          'overdue'::text,
          'cancelled'::text
        ]
      )
    )
  ),
  constraint general_costs_payments_amount_positive check ((amount > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_gc_payments_org_date on public.general_costs_payments using btree (organization_id, payment_date) TABLESPACE pg_default;

create index IF not exists idx_gc_payments_general_cost on public.general_costs_payments using btree (general_cost_id) TABLESPACE pg_default;

create index IF not exists idx_gc_payments_wallet on public.general_costs_payments using btree (wallet_id) TABLESPACE pg_default;

## Vista GENERAL_COSTS_BY_CATEGORY_VIEW:

create view public.general_costs_by_category_view as
select
  general_costs_payments_view.organization_id,
  general_costs_payments_view.payment_month,
  general_costs_payments_view.category_id,
  general_costs_payments_view.category_name,
  sum(general_costs_payments_view.amount) as total_amount
from
  general_costs_payments_view
group by
  general_costs_payments_view.organization_id,
  general_costs_payments_view.payment_month,
  general_costs_payments_view.category_id,
  general_costs_payments_view.category_name;

## Vista GENERAL_COSTS_MONTHLY_SUMMARY_VIEW:

  create view public.general_costs_monthly_summary_view as
  select
    general_costs_payments_view.organization_id,
    general_costs_payments_view.payment_month,
    sum(general_costs_payments_view.amount) as total_amount,
    count(*) as payments_count
  from
    general_costs_payments_view
  group by
    general_costs_payments_view.organization_id,
    general_costs_payments_view.payment_month;

## Vista GENERAL_COSTS_PAYMENTS_VIEW:

create view public.general_costs_payments_view as
select
  gcp.id,
  gcp.organization_id,
  gcp.payment_date,
  date_trunc(
    'month'::text,
    gcp.payment_date::timestamp with time zone
  ) as payment_month,
  gcp.amount,
  gcp.currency_id,
  gcp.exchange_rate,
  gcp.status,
  gcp.wallet_id,
  gc.id as general_cost_id,
  gc.name as general_cost_name,
  gc.is_recurring,
  gc.recurrence_interval,
  gcc.id as category_id,
  gcc.name as category_name
from
  general_costs_payments gcp
  left join general_costs gc on gc.id = gcp.general_cost_id
  left join general_cost_categories gcc on gcc.id = gc.category_id
where
  gcp.status = 'confirmed'::text;