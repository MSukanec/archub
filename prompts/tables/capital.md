# Detalle de las tablas de Supabase de CAPITAL:

## Tabla CAPITAL_ADJUSTMENTS:

create table public.capital_adjustments (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  project_id uuid null,
  partner_id uuid null,
  currency_id uuid not null,
  exchange_rate numeric not null default 1,
  amount numeric(12, 2) not null,
  adjustment_date date not null default now(),
  reason text null,
  notes text null,
  reference text null,
  status text not null default 'confirmed'::text,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint capital_adjustments_pkey primary key (id),
  constraint capital_adjustments_project_fkey foreign KEY (project_id) references projects (id) on delete set null,
  constraint capital_adjustments_currency_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint capital_adjustments_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint capital_adjustments_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint capital_adjustments_partner_fkey foreign KEY (partner_id) references capital_participants (id) on delete set null,
  constraint capital_adjustments_status_check check (
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
  constraint capital_adjustments_exchange_rate_positive check ((exchange_rate > (0)::numeric)),
  constraint capital_adjustments_amount_not_zero check ((amount <> (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_capital_adjustments_org_date on public.capital_adjustments using btree (organization_id, adjustment_date desc) TABLESPACE pg_default;

create index IF not exists idx_capital_adjustments_partner_date on public.capital_adjustments using btree (partner_id, adjustment_date desc) TABLESPACE pg_default;

create index IF not exists idx_capital_adjustments_not_deleted on public.capital_adjustments using btree (organization_id) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger capital_adjustments_set_updated_at BEFORE
update on capital_adjustments for EACH row
execute FUNCTION set_timestamp ();

create trigger trg_update_balance_adjustment
after INSERT
or DELETE
or
update on capital_adjustments for EACH row
execute FUNCTION update_partner_balance_after_capital_change ();

## Tabla CAPITAL_PARTICIPANTS:

create table public.capital_participants (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  contact_id uuid null,
  organization_id uuid not null,
  updated_at timestamp with time zone null default now(),
  notes text null,
  status text not null default 'active'::text,
  created_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  ownership_percentage numeric(5, 2) null,
  constraint partners_pkey primary key (id),
  constraint partners_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete set null,
  constraint partners_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint partners_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint capital_participants_ownership_percentage_check check (
    (
      (ownership_percentage is null)
      or (
        (ownership_percentage > (0)::numeric)
        and (ownership_percentage <= (100)::numeric)
      )
    )
  ),
  constraint partners_status_check check (
    (
      status = any (
        array['active'::text, 'inactive'::text, 'deleted'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_partners_organization on public.capital_participants using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_partners_contact on public.capital_participants using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_partners_created_at on public.capital_participants using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_partners_status on public.capital_participants using btree (status) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_partner_organization_contact on public.capital_participants using btree (organization_id, contact_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_capital_participants_ownership_percentage on public.capital_participants using btree (organization_id, ownership_percentage) TABLESPACE pg_default;

## Tabla CONTACTS:

create table public.contacts (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
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
  avatar_updated_at timestamp with time zone null,
  is_local boolean null default true,
  display_name_override text null,
  linked_at timestamp with time zone null,
  sync_status text null default 'local'::text,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  image_bucket text null,
  image_path text null,
  constraint contacts_pkey primary key (id),
  constraint contacts_national_id_org_key unique (organization_id, national_id),
  constraint contacts_linked_user_id_fkey foreign KEY (linked_user_id) references users (id) on delete set null,
  constraint contacts_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_contacts_org_linked_user on public.contacts using btree (organization_id, linked_user_id) TABLESPACE pg_default
where
  (linked_user_id is not null);

create unique INDEX IF not exists idx_contacts_org_email on public.contacts using btree (organization_id, email) TABLESPACE pg_default
where
  (email is not null);

create index IF not exists idx_contacts_is_deleted_org on public.contacts using btree (organization_id, is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger on_contact_link_user BEFORE INSERT
or
update OF email on contacts for EACH row
execute FUNCTION handle_contact_link_user ();

## Vista PARTNER_BALANCE_SUMMARY_VIEW:

create view public.partner_balance_summary_view as
select
  pcb.partner_id,
  cp.organization_id,
  sum(pcb.balance_amount) as total_balance,
  max(pcb.balance_date) as last_balance_date
from
  partner_capital_balance pcb
  join capital_participants cp on cp.id = pcb.partner_id
where
  pcb.is_deleted = false
  and cp.is_deleted = false
group by
  pcb.partner_id,
  cp.organization_id;

## Tabla PARTNER_CAPITAL_BALANCE:

create table public.partner_capital_balance (
  id uuid not null default gen_random_uuid (),
  partner_id uuid not null,
  organization_id uuid not null,
  balance_amount numeric(12, 2) not null,
  balance_date date not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint partner_capital_balance_pkey primary key (id),
  constraint partner_capital_balance_unique unique (partner_id, organization_id),
  constraint fk_balance_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_balance_partner foreign KEY (partner_id) references capital_participants (id) on delete CASCADE
) TABLESPACE pg_default;

## Vista PARTNER_CAPITAL_KPI_VIEW:

create view public.partner_capital_kpi_view as
select
  pbs.partner_id,
  pbs.organization_id,
  pbs.total_balance,
  pbs.total_balance / NULLIF(
    sum(pbs.total_balance) over (
      partition by
        pbs.organization_id
    ),
    0::numeric
  ) as ownership_ratio
from
  partner_balance_summary_view pbs;

## Tabla PARTNER_CONTRIBUTIONS:

create table public.partner_contributions (
  id uuid not null default gen_random_uuid (),
  project_id uuid null,
  organization_id uuid not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  exchange_rate numeric not null,
  contribution_date date not null default now(),
  notes text null,
  reference text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  wallet_id uuid null,
  partner_id uuid null,
  status text not null default 'confirmed'::text,
  created_by uuid null,
  is_deleted boolean null default false,
  deleted_at timestamp with time zone null,
  constraint partner_contributions_pkey primary key (id),
  constraint fk_contribution_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint fk_contribution_partner foreign KEY (partner_id) references capital_participants (id) on delete set null,
  constraint fk_contribution_wallet foreign KEY (wallet_id) references organization_wallets (id) on delete set null,
  constraint fk_contribution_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint partner_contributions_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint fk_contribution_project foreign KEY (project_id) references projects (id) on delete set null,
  constraint partner_contributions_status_check check (
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
  constraint partner_contributions_amount_positive check ((amount > (0)::numeric)),
  constraint partner_contributions_exchange_rate_positive check ((exchange_rate > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_partner_contributions_not_deleted on public.partner_contributions using btree (organization_id, project_id) TABLESPACE pg_default
where
  (
    (is_deleted is null)
    or (is_deleted = false)
  );

create index IF not exists idx_partner_contributions_org_project on public.partner_contributions using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_partner_contributions_partner on public.partner_contributions using btree (partner_id) TABLESPACE pg_default;

create index IF not exists idx_partner_contributions_date on public.partner_contributions using btree (contribution_date) TABLESPACE pg_default;

create index IF not exists idx_partner_contributions_view_project on public.partner_contributions using btree (project_id, contribution_date desc) TABLESPACE pg_default;

create index IF not exists idx_partner_contributions_view_org on public.partner_contributions using btree (organization_id, contribution_date desc) TABLESPACE pg_default;

## Tabla PARTNER_WITHDRAWALS:

create table public.partner_withdrawals (
  id uuid not null default gen_random_uuid (),
  project_id uuid null,
  organization_id uuid not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  exchange_rate numeric not null,
  withdrawal_date date not null default now(),
  notes text null,
  reference text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  wallet_id uuid null,
  partner_id uuid null,
  status text not null default 'confirmed'::text,
  created_by uuid null,
  is_deleted boolean null default false,
  deleted_at timestamp with time zone null,
  constraint partner_withdrawals_pkey primary key (id),
  constraint fk_withdrawal_currency foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint fk_withdrawal_partner foreign KEY (partner_id) references capital_participants (id) on delete set null,
  constraint fk_withdrawal_wallet foreign KEY (wallet_id) references organization_wallets (id) on delete set null,
  constraint fk_withdrawal_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint partner_withdrawals_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint fk_withdrawal_project foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint partner_withdrawals_status_check check (
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
  constraint partner_withdrawals_amount_positive check ((amount > (0)::numeric)),
  constraint partner_withdrawals_exchange_rate_positive check ((exchange_rate > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_partner_withdrawals_org_project on public.partner_withdrawals using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_partner_withdrawals_partner on public.partner_withdrawals using btree (partner_id) TABLESPACE pg_default;

create index IF not exists idx_partner_withdrawals_date on public.partner_withdrawals using btree (withdrawal_date) TABLESPACE pg_default;

create index IF not exists idx_partner_withdrawals_view_project on public.partner_withdrawals using btree (project_id, withdrawal_date desc) TABLESPACE pg_default;

create index IF not exists idx_partner_withdrawals_view_org on public.partner_withdrawals using btree (organization_id, withdrawal_date desc) TABLESPACE pg_default;

create index IF not exists idx_partner_withdrawals_not_deleted on public.partner_withdrawals using btree (organization_id, project_id) TABLESPACE pg_default
where
  (
    (is_deleted is null)
    or (is_deleted = false)
  );

## Tabla USERS:

create table public.users (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  auth_id uuid not null,
  email text not null,
  avatar_url text null,
  avatar_source public.avatar_source_t null default 'email'::avatar_source_t,
  full_name text null,
  role_id uuid not null default 'e6cc68d2-fc28-421b-8bd3-303326ef91b8'::uuid,
  updated_at timestamp with time zone null default now(),
  is_active boolean not null default true,
  constraint users_pkey primary key (id),
  constraint users_auth_id_key unique (auth_id),
  constraint users_id_key unique (id),
  constraint users_auth_id_fkey foreign KEY (auth_id) references auth.users (id) on delete CASCADE,
  constraint users_role_id_fkey foreign KEY (role_id) references roles (id) on delete RESTRICT,
  constraint users_email_format_chk check (
    (
      email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists users_email_lower_uniq on public.users using btree (lower(email)) TABLESPACE pg_default;

create index IF not exists idx_users_auth_id on public.users using btree (auth_id) TABLESPACE pg_default;

create index IF not exists idx_users_role_id on public.users using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_users_avatar_source on public.users using btree (avatar_source) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_users_normalize_email BEFORE INSERT
or
update on users for EACH row
execute FUNCTION users_normalize_email ();

create trigger trigger_sync_contact_on_user_update
after
update on users for EACH row
execute FUNCTION sync_contact_on_user_update ();


