# Detalle de las tablas de Supabase de Construction:

---------- TABLA CLIENT_COMMITMENTS:

create table public.client_commitments (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  client_id uuid not null,
  organization_id uuid not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  exchange_rate numeric not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  contact_id uuid null,
  constraint project_client_commitments_pkey primary key (id),
  constraint fk_commit_client foreign KEY (client_id) references project_clients (id) on delete set null,
  constraint fk_commit_contact foreign KEY (contact_id) references contacts (id) on delete set null,
  constraint fk_commit_currency foreign KEY (currency_id) references currencies (id) on delete set null,
  constraint fk_commit_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_commit_project foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint client_commitments_amount_positive check ((amount > (0)::numeric)),
  constraint client_commitments_exchange_rate_positive check ((exchange_rate > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_client_commitments_org_project on public.client_commitments using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_client_commitments_org on public.client_commitments using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_client_commitments_client on public.client_commitments using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_client_commitments_currency on public.client_commitments using btree (currency_id) TABLESPACE pg_default;

create index IF not exists idx_client_commitments_created_at on public.client_commitments using btree (created_at) TABLESPACE pg_default;

---------- TABLA CLIENT_PAYMENT_SCHEDULE:

create table public.client_payment_schedule (
  id uuid not null default gen_random_uuid (),
  commitment_id uuid not null,
  due_date date not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  status text not null default 'pending'::text,
  paid_at timestamp with time zone null,
  payment_method text null,
  notes text null,
  organization_id uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint client_payment_schedule_pkey primary key (id),
  constraint client_payment_schedule_commitment_id_fkey foreign KEY (commitment_id) references client_commitments (id) on delete CASCADE,
  constraint client_payment_schedule_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint client_payment_schedule_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint client_payment_schedule_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'paid'::text,
          'overdue'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists client_payment_schedule_org_idx on public.client_payment_schedule using btree (organization_id) TABLESPACE pg_default;

create index IF not exists client_payment_schedule_commitment_idx on public.client_payment_schedule using btree (commitment_id) TABLESPACE pg_default;

create index IF not exists client_payment_schedule_due_idx on public.client_payment_schedule using btree (due_date) TABLESPACE pg_default;

---------- TABLA CLIENT_PAYMENTS:

create table public.client_payments (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  commitment_id uuid null,
  schedule_id uuid null,
  contact_id uuid not null,
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
  client_id uuid null,
  constraint client_payments_pkey primary key (id),
  constraint fk_payment_wallet foreign KEY (wallet_id) references organization_wallets (id) on delete set null,
  constraint fk_payment_project_client foreign KEY (client_id) references project_clients (id) on delete set null,
  constraint fk_payment_schedule foreign KEY (schedule_id) references client_payment_schedule (id) on delete set null,
  constraint fk_payment_client foreign KEY (client_id) references project_clients (id) on delete set null,
  constraint fk_payment_commitment foreign KEY (commitment_id) references client_commitments (id) on delete set null,
  constraint fk_payment_contact foreign KEY (contact_id) references contacts (id) on delete set null,
  constraint fk_payment_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint fk_payment_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_payment_project foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint client_payments_exchange_rate_positive check ((exchange_rate > (0)::numeric)),
  constraint client_payments_amount_positive check ((amount > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_client_payments_org_project on public.client_payments using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_client on public.client_payments using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_commitment on public.client_payments using btree (commitment_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_schedule on public.client_payments using btree (schedule_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_date on public.client_payments using btree (payment_date) TABLESPACE pg_default;

---------- TABLA PROJECT_CLIENTS:

create table public.project_clients (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  client_id uuid not null,
  committed_amount numeric(12, 2) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  currency_id uuid null,
  organization_id uuid null,
  unit text null,
  exchange_rate numeric null,
  is_primary boolean not null default false,
  notes text null,
  status text not null default 'active'::text,
  client_role_id uuid null,
  constraint project_clients_pkey primary key (id),
  constraint project_clients_client_role_id_fkey foreign KEY (client_role_id) references client_roles (id) on delete set null,
  constraint project_clients_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete set null,
  constraint project_clients_client_id_fkey foreign KEY (client_id) references contacts (id) on delete set null,
  constraint project_clients_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint project_clients_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint project_clients_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'inactive'::text,
          'deleted'::text,
          'potential'::text,
          'rejected'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_project_clients_is_primary on public.project_clients using btree (is_primary) TABLESPACE pg_default;

create index IF not exists idx_project_clients_org_project on public.project_clients using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_project_clients_project on public.project_clients using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_project_clients_client on public.project_clients using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_project_clients_created_at on public.project_clients using btree (created_at) TABLESPACE pg_default;

VISTA CLIENT_FINANCIAL_OVERVIEW:

create view public.client_financial_overview as
select
  pc.id as project_client_id,
  pc.project_id,
  pc.client_id,
  pc.organization_id,
  c.full_name as client_name,
  c.email as client_email,
  c.phone as client_phone,
  COALESCE(sum(cc.amount), 0::numeric) as total_committed_amount,
  COALESCE(sum(cp.amount), 0::numeric) as total_paid_amount,
  COALESCE(sum(cc.amount), 0::numeric) - COALESCE(sum(cp.amount), 0::numeric) as balance_due,
  count(cps.id) as total_schedule_items,
  count(
    case
      when cps.status = 'paid'::text then 1
      else null::integer
    end
  ) as schedule_paid,
  count(
    case
      when cps.status = 'overdue'::text then 1
      else null::integer
    end
  ) as schedule_overdue,
  min(
    case
      when cps.status = 'pending'::text then cps.due_date
      else null::date
    end
  ) as next_due_date,
  max(cp.payment_date) as last_payment_date
from
  project_clients pc
  left join contacts c on c.id = pc.client_id
  left join client_commitments cc on cc.project_id = pc.project_id
  and cc.client_id = pc.client_id
  left join client_payments cp on cp.project_id = pc.project_id
  and cp.client_id = pc.client_id
  left join client_payment_schedule cps on cps.commitment_id = cc.id
group by
  pc.id,
  pc.project_id,
  pc.client_id,
  pc.organization_id,
  c.full_name,
  c.email,
  c.phone;