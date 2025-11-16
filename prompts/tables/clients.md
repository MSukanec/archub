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
  created_by uuid null,
  constraint project_client_commitments_pkey primary key (id),
  constraint client_commitments_created_by_fkey foreign KEY (created_by) references organization_members (id),
  constraint fk_commit_client foreign KEY (client_id) references project_clients (id) on delete set null,
  constraint fk_commit_contact foreign KEY (contact_id) references contacts (id) on delete set null,
  constraint fk_commit_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_commit_project foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint fk_commit_currency foreign KEY (currency_id) references currencies (id) on delete set null,
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
  status text not null default 'confirmed'::text,
  created_by uuid null,
  file_url text null,
  constraint client_payments_pkey primary key (id),
  constraint client_payments_created_by_fkey foreign KEY (created_by) references organization_members (id),
  constraint fk_payment_wallet foreign KEY (wallet_id) references organization_wallets (id) on delete set null,
  constraint fk_payment_project foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint fk_payment_project_client foreign KEY (client_id) references project_clients (id) on delete set null,
  constraint fk_payment_schedule foreign KEY (schedule_id) references client_payment_schedule (id) on delete set null,
  constraint fk_payment_client foreign KEY (client_id) references project_clients (id) on delete set null,
  constraint fk_payment_commitment foreign KEY (commitment_id) references client_commitments (id) on delete set null,
  constraint fk_payment_contact foreign KEY (contact_id) references contacts (id) on delete set null,
  constraint fk_payment_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint fk_payment_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint client_payments_exchange_rate_positive check ((exchange_rate > (0)::numeric)),
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

create index IF not exists idx_client_payments_client on public.client_payments using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_commitment on public.client_payments using btree (commitment_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_schedule on public.client_payments using btree (schedule_id) TABLESPACE pg_default;

create index IF not exists idx_client_payments_date on public.client_payments using btree (payment_date) TABLESPACE pg_default;

---------- TABLA CLIENT_ROLES:

create table public.client_roles (
  id uuid not null default gen_random_uuid (),
  organization_id uuid null,
  name text not null,
  description text null,
  is_default boolean null default false,
  created_at timestamp with time zone null default now(),
  created_by uuid not null,
  updated_at timestamp with time zone null,
  constraint client_roles_pkey primary key (id),
  constraint client_roles_created_by_fkey foreign KEY (created_by) references organization_members (id),
  constraint client_roles_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

---------- TABLA PROJECT_CLIENTS:

create table public.project_clients (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  contact_id uuid not null,
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
  created_by uuid null,
  constraint project_clients_pkey primary key (id),
  constraint project_clients_client_role_id_fkey foreign KEY (client_role_id) references client_roles (id) on delete set null,
  constraint project_clients_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete RESTRICT,
  constraint project_clients_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete set null,
  constraint project_clients_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint project_clients_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint project_clients_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete set null,
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

create index IF not exists idx_project_clients_contact on public.project_clients using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_project_clients_created_at on public.project_clients using btree (created_at) TABLESPACE pg_default;

---------- VISTA CLIENT_FINANCIAL_OVERVIEW:

create view public.client_financial_overview as
with
  commitment_totals as (
    select
      client_commitments.client_id as project_client_id,
      client_commitments.organization_id,
      client_commitments.project_id,
      client_commitments.currency_id,
      sum(client_commitments.amount) as total_committed,
      max(client_commitments.exchange_rate) as commitment_exchange_rate
    from
      client_commitments
    group by
      client_commitments.client_id,
      client_commitments.organization_id,
      client_commitments.project_id,
      client_commitments.currency_id
  ),
  payments_converted as (
    select
      cc.client_id as project_client_id,
      cp.organization_id,
      cp.project_id,
      cc.currency_id,
      case
        when cp.currency_id = cc.currency_id then cp.amount
        when pay_curr.code = 'USD'::text
        and com_curr.code = 'ARS'::text then cp.amount * cp.exchange_rate
        when pay_curr.code = 'ARS'::text
        and com_curr.code = 'USD'::text then cp.amount / cp.exchange_rate
        else cp.amount
      end as converted_amount,
      case
        when cp.currency_id <> cc.currency_id
        and (
          cp.exchange_rate is null
          or cp.exchange_rate <= 0::numeric
        ) then 1
        else 0
      end as invalid_rate
    from
      client_payments cp
      join client_commitments cc on cp.commitment_id = cc.id
      or cp.commitment_id is null
      and cp.client_id = cc.client_id
      join currencies pay_curr on pay_curr.id = cp.currency_id
      join currencies com_curr on com_curr.id = cc.currency_id
  ),
  payment_totals as (
    select
      payments_converted.project_client_id,
      payments_converted.organization_id,
      payments_converted.project_id,
      payments_converted.currency_id,
      sum(payments_converted.converted_amount) as total_paid,
      sum(payments_converted.invalid_rate)::integer as payments_missing_rate
    from
      payments_converted
    group by
      payments_converted.project_client_id,
      payments_converted.organization_id,
      payments_converted.project_id,
      payments_converted.currency_id
  ),
  schedule_totals as (
    select
      cc.client_id as project_client_id,
      cc.organization_id,
      cc.project_id,
      min(cps.due_date) filter (
        where
          cps.status = any (array['pending'::text, 'overdue'::text])
      ) as next_due,
      count(*) filter (
        where
          cps.status = 'pending'::text
      )::integer as pending_invoices,
      count(*) filter (
        where
          cps.status = 'overdue'::text
      )::integer as overdue_invoices
    from
      client_commitments cc
      left join client_payment_schedule cps on cps.commitment_id = cc.id
    group by
      cc.client_id,
      cc.organization_id,
      cc.project_id
  )
select
  pc.id as project_client_id,
  COALESCE(ct.organization_id, pc.organization_id) as organization_id,
  COALESCE(ct.project_id, pc.project_id) as project_id,
  ct.currency_id,
  COALESCE(ct.total_committed, 0::numeric) as total_committed_amount,
  COALESCE(pt.total_paid, 0::numeric) as total_paid_amount,
  COALESCE(ct.total_committed, 0::numeric) - COALESCE(pt.total_paid, 0::numeric) as balance_due,
  COALESCE(pt.payments_missing_rate, 0) as payments_missing_rate,
  st.next_due,
  COALESCE(st.pending_invoices, 0) as pending_invoices,
  COALESCE(st.overdue_invoices, 0) as overdue_invoices
from
  project_clients pc
  left join commitment_totals ct on ct.project_client_id = pc.id
  left join payment_totals pt on pt.project_client_id = ct.project_client_id
  and pt.currency_id = ct.currency_id
  left join schedule_totals st on st.project_client_id = ct.project_client_id;

  ---------- TABLA CONTACTS:

  create table public.contacts (
    id uuid not null default gen_random_uuid (),
    organization_id uuid null,
    first_name text null,
    email text null,
    phone text null,
    company_name text null,
    location text null,
    notes text null,
    created_at timestamp with time zone null default now(),
    last_name text null,
    linked_user_id uuid null,
    full_name text null,
    updated_at timestamp with time zone null default now(),
    national_id text null,
    avatar_attachment_id uuid null,
    avatar_updated_at timestamp with time zone null,
    is_local boolean null default true,
    display_name_override text null,
    linked_at timestamp with time zone null,
    sync_status text null default 'local'::text,
    constraint contacts_pkey primary key (id),
    constraint contacts_national_id_key unique (national_id),
    constraint contacts_avatar_attachment_id_fkey foreign KEY (avatar_attachment_id) references contact_attachments (id) on delete set null,
    constraint contacts_linked_user_id_fkey foreign KEY (linked_user_id) references users (id) on delete set null,
    constraint contacts_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
  ) TABLESPACE pg_default;

  create unique INDEX IF not exists uniq_contacts_org_linked_user on public.contacts using btree (organization_id, linked_user_id) TABLESPACE pg_default
  where
    (linked_user_id is not null);

  create index IF not exists idx_contacts_org_email on public.contacts using btree (organization_id, email) TABLESPACE pg_default;

  create trigger on_contact_link_user BEFORE INSERT
  or
  update OF email on contacts for EACH row
  execute FUNCTION handle_contact_link_user ();