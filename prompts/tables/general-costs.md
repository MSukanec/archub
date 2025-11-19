# Detalle de las tablas de Supabase de COSTOS GENERALES:

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
  constraint general_costs_pkey primary key (id),
  constraint general_costs_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

---------- TABLA GENERAL_COSTS_PAYMENTS:

create table public.general_costs_payments (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  exchange_rate numeric not null,
  payment_date date not null default now(),
  notes text null,
  reference text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  wallet_id uuid null,
  general_cost_id uuid null,
  status text not null default 'confirmed'::text,
  created_by uuid null,
  file_url text null,
  constraint general_costs_payments_pkey primary key (id),
  constraint fk_gc_payment_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint fk_gc_payment_general_cost foreign KEY (general_cost_id) references general_costs (id) on delete set null,
  constraint fk_gc_payment_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_gc_payment_created_by foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint fk_gc_payment_wallet foreign KEY (wallet_id) references organization_wallets (id) on delete set null,
  constraint general_costs_payments_exchange_rate_positive check ((exchange_rate > (0)::numeric)),
  constraint general_costs_payments_amount_positive check ((amount > (0)::numeric))
) TABLESPACE pg_default;