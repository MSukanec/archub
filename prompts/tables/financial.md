# Detalle de las tablas de Supabase de FINANCIAL:

## Tabla FINANCIAL_OPERATION_MOVEMENTS:

create table public.financial_operation_movements (
  id uuid not null default gen_random_uuid (),
  financial_operation_id uuid not null,
  organization_id uuid not null,
  project_id uuid null,
  wallet_id uuid not null,
  currency_id uuid not null,
  amount numeric(14, 2) not null,
  direction text not null,
  exchange_rate numeric(14, 6) null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint financial_operation_movements_pkey primary key (id),
  constraint financial_operation_movements_currency_fkey foreign KEY (currency_id) references currencies (id),
  constraint financial_operation_movements_operation_fkey foreign KEY (financial_operation_id) references financial_operations (id) on delete CASCADE,
  constraint financial_operation_movements_org_fkey foreign KEY (organization_id) references organizations (id),
  constraint financial_operation_movements_wallet_fkey foreign KEY (wallet_id) references organization_wallets (id),
  constraint financial_operation_movements_created_by_fkey foreign KEY (created_by) references organization_members (id),
  constraint financial_operation_movements_project_fkey foreign KEY (project_id) references projects (id),
  constraint financial_operation_movements_direction_check check (
    (direction = any (array['in'::text, 'out'::text]))
  )
) TABLESPACE pg_default;

## Tabla FINANCIAL_OPERATIONS:

create table public.financial_operations (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  project_id uuid null,
  type text not null,
  operation_date date not null default CURRENT_DATE,
  description text null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint financial_operations_pkey primary key (id),
  constraint financial_operations_created_by_fkey foreign KEY (created_by) references users (id),
  constraint financial_operations_organization_fkey foreign KEY (organization_id) references organizations (id),
  constraint financial_operations_project_fkey foreign KEY (project_id) references projects (id),
  constraint financial_operations_type_check check (
    (
      type = any (
        array[
          'wallet_transfer'::text,
          'currency_exchange'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;