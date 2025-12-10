# Detalle de las tablas de Supabase de Construction:

---------- TABLA CLIENT_PAYMENTS:

create table public.client_payments (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  commitment_id uuid null,
  schedule_id uuid null,
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
  client_id uuid null,
  status text not null default 'confirmed'::text,
  created_by uuid null,
  functional_amount numeric(12, 2) null,
  constraint client_payments_pkey primary key (id),
  constraint client_payments_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint fk_payment_schedule foreign KEY (schedule_id) references client_payment_schedule (id) on delete set null,
  constraint fk_payment_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_payment_project foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint client_payments_wallet_id_fkey foreign KEY (wallet_id) references organization_wallets (id) on delete RESTRICT,
  constraint fk_payment_client foreign KEY (client_id) references project_clients (id) on delete set null,
  constraint fk_payment_commitment foreign KEY (commitment_id) references client_commitments (id) on delete set null,
  constraint fk_payment_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint client_payments_status_check check (
    (
      status = any (
        array[
          'confirmed'::text,
          'pending'::text,
          'rejected'::text,
          'void'::text
        ]
      )
    )
  ),
  constraint client_payments_amount_positive check ((amount > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_client_payments_org_project on public.client_payments using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_commitment on public.client_payments using btree (commitment_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_schedule on public.client_payments using btree (schedule_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_date on public.client_payments using btree (payment_date) TABLESPACE pg_default;

create index IF not exists idx_client_payments_view_project on public.client_payments using btree (project_id, payment_date desc) TABLESPACE pg_default;

create index IF not exists idx_client_payments_view_org on public.client_payments using btree (organization_id, payment_date desc) TABLESPACE pg_default;

create trigger set_client_payments_updated_at BEFORE
update on client_payments for EACH row
execute FUNCTION set_timestamp ();

---------- TABLA MATERIAL_PAYMENTS:

create table public.material_payments (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  organization_id uuid not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  exchange_rate numeric(18, 6) null,
  payment_date date not null default now(),
  notes text null,
  reference text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone not null default now(),
  wallet_id uuid not null,
  status text not null default 'confirmed'::text,
  created_by uuid null,
  purchase_id uuid null,
  constraint material_payments_pkey primary key (id),
  constraint material_payments_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint material_payments_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint material_payments_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint material_payments_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint material_payments_purchase_fkey foreign KEY (purchase_id) references material_purchases (id) on delete set null,
  constraint material_payments_wallet_id_fkey foreign KEY (wallet_id) references organization_wallets (id) on delete RESTRICT,
  constraint material_payments_status_check check (
    (
      status = any (
        array[
          'confirmed'::text,
          'pending'::text,
          'rejected'::text,
          'void'::text
        ]
      )
    )
  ),
  constraint material_payments_amount_positive check ((amount > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists material_payments_organization_id_project_id_idx on public.material_payments using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists material_payments_payment_date_idx on public.material_payments using btree (payment_date) TABLESPACE pg_default;

create index IF not exists material_payments_project_id_payment_date_idx on public.material_payments using btree (project_id, payment_date desc) TABLESPACE pg_default;

create index IF not exists material_payments_organization_id_payment_date_idx on public.material_payments using btree (organization_id, payment_date desc) TABLESPACE pg_default;

---------- TABLA PERSONNEL_PAYMENTS:

create table public.personnel_payments (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  personnel_id uuid null,
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
  status text not null default 'confirmed'::text,
  created_by uuid null,
  is_deleted boolean null default false,
  deleted_at timestamp with time zone null,
  constraint personnel_payments_pkey primary key (id),
  constraint fk_pp_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint fk_pp_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_pp_personnel foreign KEY (personnel_id) references project_personnel (id) on delete set null,
  constraint fk_pp_project foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint fk_pp_wallet foreign KEY (wallet_id) references organization_wallets (id) on delete set null,
  constraint fk_pp_created_by foreign KEY (created_by) references organization_members (id),
  constraint personnel_payments_exchange_rate_positive check ((exchange_rate > (0)::numeric)),
  constraint personnel_payments_amount_positive check ((amount > (0)::numeric)),
  constraint personnel_payments_status_check check (
    (
      status = any (
        array[
          'confirmed'::text,
          'pending'::text,
          'rejected'::text,
          'void'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_personnel_payments_date on public.personnel_payments using btree (payment_date) TABLESPACE pg_default;

create index IF not exists idx_personnel_payments_view_project on public.personnel_payments using btree (project_id, payment_date desc) TABLESPACE pg_default;

create index IF not exists idx_personnel_payments_view_org on public.personnel_payments using btree (organization_id, payment_date desc) TABLESPACE pg_default;

create index IF not exists idx_personnel_payments_not_deleted on public.personnel_payments using btree (organization_id, project_id) TABLESPACE pg_default
where
  (
    (is_deleted is null)
    or (is_deleted = false)
  );

create index IF not exists idx_personnel_payments_org_project on public.personnel_payments using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_personnel_payments_personnel on public.personnel_payments using btree (personnel_id) TABLESPACE pg_default;