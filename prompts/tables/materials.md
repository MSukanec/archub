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

---------- TABLA MATERIAL_PURCHASE_ORDERS:

create table public.material_purchase_orders (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  project_id uuid not null,
  requested_by uuid null,
  approved_by uuid null,
  provider_id uuid null,
  order_date date not null default now(),
  status text not null default 'draft'::text,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint material_purchase_orders_pkey primary key (id),
  constraint mpo_approved_by_fkey foreign KEY (approved_by) references organization_members (id) on delete set null,
  constraint mpo_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint mpo_project_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint mpo_provider_fkey foreign KEY (provider_id) references contacts (id) on delete set null,
  constraint mpo_requested_by_fkey foreign KEY (requested_by) references organization_members (id) on delete set null,
  constraint mpo_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'sent'::text,
          'quoted'::text,
          'approved'::text,
          'rejected'::text,
          'converted'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

---------- TABLA MATERIAL_PURCHASE_ORDER_ITEMS:

create table public.material_purchase_order_items (
  id uuid not null default gen_random_uuid (),
  purchase_order_id uuid not null,
  description text not null,
  quantity numeric(12, 4) not null default 1,
  unit_id uuid null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  organization_id uuid null,
  project_id uuid null,
  constraint mpo_items_pkey primary key (id),
  constraint mpo_items_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint mpo_items_order_fkey foreign KEY (purchase_order_id) references material_purchase_orders (id) on delete CASCADE,
  constraint mpo_items_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint mpo_items_project_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint mpo_items_unit_fkey foreign KEY (unit_id) references units (id) on delete set null
) TABLESPACE pg_default;