# Detalle de las tablas de Supabase de CAPITAL:

---------- TABLA CAPITAL_PARTICIPANTS:

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
  constraint partners_pkey primary key (id),
  constraint partners_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete set null,
  constraint partners_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint partners_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
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

---------- TABLA PARTNER_CONTRIBUTIONS:

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

---------- TABLA PARTNER_WITHDRAWALS:

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

---------- TABLA PARTNER_BALANCE_SUMMARY_VIEW:

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