# Detalle de las tablas de Supabase para ORGANIZACIONES:

## Tabla CURRENCIES:

create table public.currencies (
  id uuid not null default gen_random_uuid (),
  code text not null,
  name text not null,
  symbol text not null,
  country text null,
  is_default boolean null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint currencies_pkey primary key (id),
  constraint currencies_code_key unique (code),
  constraint currencies_code_iso_chk check ((code ~ '^[A-Z]{3}$'::text)),
  constraint currencies_name_not_blank_chk check ((btrim(name) <> ''::text)),
  constraint currencies_symbol_not_blank_chk check ((btrim(symbol) <> ''::text))
) TABLESPACE pg_default;

create index IF not exists idx_currencies_name on public.currencies using btree (name) TABLESPACE pg_default;

create index IF not exists idx_currencies_code on public.currencies using btree (code) TABLESPACE pg_default;

## Tabla ORGANIZATION_ACTIVITY_LOGS:

create table public.organization_activity_logs (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  user_id uuid null,
  action text not null,
  target_table text not null,
  target_id uuid null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint organization_activity_logs_pkey primary key (id),
  constraint organization_activity_logs_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_activity_logs_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_org_id on public.organization_activity_logs using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_user_id on public.organization_activity_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_target on public.organization_activity_logs using btree (target_table, target_id) TABLESPACE pg_default;

create index IF not exists idx_org_activity_logs_created_at on public.organization_activity_logs using btree (created_at desc) TABLESPACE pg_default;

## Vista ORGANIZATION_ACTIVITY_LOGS_VIEW:

create view public.organization_activity_logs_view as
select
  l.id,
  l.organization_id,
  l.user_id,
  l.action,
  l.target_table,
  l.target_id,
  l.metadata,
  l.created_at,
  u.full_name,
  u.avatar_url,
  u.email
from
  organization_activity_logs l
  left join users u on l.user_id = u.id;

## Tabla ORGANIZATION_BILLING_CYCLES:

create table public.organization_billing_cycles (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  subscription_id uuid null,
  plan_id uuid not null,
  seats integer not null,
  amount_per_seat numeric(10, 2) not null,
  seat_price_source text null,
  base_amount numeric(10, 2) not null,
  proration_adjustment numeric(10, 2) null default 0,
  total_amount numeric(10, 2) not null,
  billing_period text not null,
  period_start timestamp with time zone not null,
  period_end timestamp with time zone not null,
  paid boolean null default false,
  status text null default 'pending'::text,
  payment_provider text null,
  payment_id text null,
  currency_code text not null default 'USD'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  billed_seats integer not null default 1,
  constraint organization_billing_cycles_pkey primary key (id),
  constraint organization_billing_cycles_organization_id_fkey foreign KEY (organization_id) references organizations (id),
  constraint organization_billing_cycles_plan_id_fkey foreign KEY (plan_id) references plans (id),
  constraint organization_billing_cycles_subscription_id_fkey foreign KEY (subscription_id) references organization_subscriptions (id)
) TABLESPACE pg_default;

create index IF not exists idx_billing_cycles_org on public.organization_billing_cycles using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_billing_cycles_subscription on public.organization_billing_cycles using btree (subscription_id) TABLESPACE pg_default;

create index IF not exists idx_billing_cycles_period on public.organization_billing_cycles using btree (period_start, period_end) TABLESPACE pg_default;

create index IF not exists idx_billing_cycles_status on public.organization_billing_cycles using btree (status) TABLESPACE pg_default;

## Tabla ORGANIZATION_CURRENCIES:

create table public.organization_currencies (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  currency_id uuid not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean null default false,
  deleted_at timestamp with time zone null,
  constraint organization_currencies_pkey primary key (id),
  constraint unique_org_currency unique (organization_id, currency_id),
  constraint organization_currencies_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete set null,
  constraint organization_currencies_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

## Tabla ORGANIZATION_DATA:

create table public.organization_data (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  slug text null,
  description text null,
  address text null,
  city text null,
  state text null,
  country text null,
  postal_code text null,
  phone text null,
  email text null,
  website text null,
  tax_id text null,
  lat numeric(9, 6) null,
  lng numeric(9, 6) null,
  address_full text null,
  place_id text null,
  timezone text null,
  location_type text null,
  accessibility_notes text null,
  constraint organization_data_pkey primary key (id),
  constraint organization_data_organization_id_key unique (organization_id),
  constraint organization_data_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists organization_data_city_idx on public.organization_data using btree (city) TABLESPACE pg_default;

create index IF not exists organization_data_country_idx on public.organization_data using btree (country) TABLESPACE pg_default;

## Tabla ORGANIZATION_INVITATIONS:

create table public.organization_invitations (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  email text not null,
  status text null default 'pending'::text,
  token text null,
  created_at timestamp with time zone null default now(),
  accepted_at timestamp with time zone null,
  role_id uuid null,
  invited_by uuid null,
  updated_at timestamp with time zone null default now(),
  user_id uuid null,
  constraint organization_invitations_pkey primary key (id),
  constraint organization_invitations_invited_by_fkey foreign KEY (invited_by) references organization_members (id) on delete set null,
  constraint organization_invitations_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_invitations_role_id_fkey foreign KEY (role_id) references roles (id) on delete set null,
  constraint organization_invitations_user_id_fkey foreign KEY (user_id) references users (id) on delete set null,
  constraint valid_invitation_status check (
    (
      status = any (
        array[
          'pending'::text,
          'registered'::text,
          'accepted'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists organization_invitations_email_idx on public.organization_invitations using btree (email) TABLESPACE pg_default;

create index IF not exists organization_invitations_organization_id_idx on public.organization_invitations using btree (organization_id) TABLESPACE pg_default;

create trigger trigger_create_contact_on_registered_invitation
after INSERT on organization_invitations for EACH row
execute FUNCTION handle_registered_invitation ();

## Vista ORGANIZATION_MEMBER_DETAILS:

create view public.organization_member_details as
select
  om.id as member_id,
  om.organization_id,
  om.user_id,
  om.role_id,
  om.is_active,
  om.joined_at,
  om.invited_by,
  u.full_name,
  u.email,
  u.avatar_url
from
  organization_members om
  join users u on om.user_id = u.id;

## Tabla ORGANIZATION_MEMBER_EVENTS:

create table public.organization_member_events (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  subscription_id uuid null,
  member_id uuid not null,
  user_id uuid null,
  event_type text not null,
  was_billable boolean null,
  is_billable boolean null,
  event_date timestamp with time zone not null default now(),
  performed_by uuid null,
  created_at timestamp with time zone null default now(),
  constraint organization_member_events_pkey primary key (id),
  constraint organization_member_events_member_id_fkey foreign KEY (member_id) references organization_members (id) on delete CASCADE,
  constraint organization_member_events_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_member_events_performed_by_fkey foreign KEY (performed_by) references users (id),
  constraint organization_member_events_subscription_id_fkey foreign KEY (subscription_id) references organization_subscriptions (id) on delete set null,
  constraint organization_member_events_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_member_events_org on public.organization_member_events using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_member_events_subscription on public.organization_member_events using btree (subscription_id) TABLESPACE pg_default;

create index IF not exists idx_member_events_member on public.organization_member_events using btree (member_id) TABLESPACE pg_default;

create index IF not exists idx_member_events_date on public.organization_member_events using btree (event_date) TABLESPACE pg_default;

create index IF not exists idx_member_events_type on public.organization_member_events using btree (event_type) TABLESPACE pg_default;

## Tabla ORGANIZATION_MEMBERS:

create table public.organization_members (
  created_at timestamp with time zone not null default now(),
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  is_active boolean not null default true,
  organization_id uuid not null,
  invited_by uuid null,
  joined_at timestamp with time zone null default now(),
  role_id uuid null,
  last_active_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  is_billable boolean not null default true,
  is_over_limit boolean null default false,
  constraint organization_members_pkey primary key (id),
  constraint organization_members_idd_key unique (id),
  constraint organization_members_invited_by_fkey foreign KEY (invited_by) references organization_members (id) on delete set null,
  constraint organization_members_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_members_role_id_fkey foreign KEY (role_id) references roles (id) on delete set null,
  constraint organization_members_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists organization_members_organization_id_idx on public.organization_members using btree (organization_id) TABLESPACE pg_default;

create index IF not exists organization_members_user_id_idx on public.organization_members using btree (user_id) TABLESPACE pg_default;

create unique INDEX IF not exists unique_user_per_organization on public.organization_members using btree (user_id, organization_id) TABLESPACE pg_default;

create index IF not exists idx_org_members_org_user on public.organization_members using btree (organization_id, user_id) TABLESPACE pg_default;

create index IF not exists org_members_over_limit_idx on public.organization_members using btree (organization_id, is_over_limit) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on organization_members for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trigger_create_contact_on_new_member
after INSERT on organization_members for EACH row
execute FUNCTION handle_new_org_member_contact ();

## Vista ORGANIZATION_ONLINE_USERS:

create view public.organization_online_users as
select
  up.org_id,
  up.user_id,
  up.last_seen_at,
  (now() - up.last_seen_at) <= '00:01:30'::interval as is_online
from
  user_presence up;

## Vista ORGANIZATION_MEMBERS_FULL_VIEW:

create view public.organization_members_full_view as
select
  om.id,
  om.user_id,
  om.organization_id,
  om.role_id,
  om.is_active,
  om.is_billable,
  om.is_over_limit,
  om.joined_at,
  om.last_active_at,
  om.invited_by,
  om.created_at,
  om.updated_at,
  u.full_name as user_full_name,
  u.email as user_email,
  u.avatar_url as user_avatar_url,
  r.id as role_id_ref,
  r.name as role_name,
  r.type as role_type
from
  organization_members om
  left join users u on om.user_id = u.id
  left join roles r on om.role_id = r.id;

## Vista ORGANIZATION_WALLETS_VIEW:

create view public.organization_wallets_view as
select
  ow.id,
  ow.organization_id,
  ow.wallet_id,
  ow.is_active,
  ow.is_default,
  ow.is_deleted,
  ow.deleted_at,
  ow.created_at,
  ow.updated_at,
  ow.created_by,
  w.name as wallet_name,
  w.is_active as wallet_is_active,
  w.created_at as wallet_created_at
from
  organization_wallets ow
  left join wallets w on ow.wallet_id = w.id;

## Vista ORGANIZATION_CURRENCIES_VIEW:

create view public.organization_currencies_view as
select
  oc.id,
  oc.organization_id,
  oc.currency_id,
  oc.is_active,
  oc.is_default,
  oc.is_deleted,
  oc.deleted_at,
  oc.created_at,
  oc.updated_at,
  c.code as currency_code,
  c.name as currency_name,
  c.symbol as currency_symbol,
  c.country as currency_country
from
  organization_currencies oc
  left join currencies c on oc.currency_id = c.id;

## Tabla ORGANIZATION_PREFERENCES:

create table public.organization_preferences (
  id uuid not null default gen_random_uuid (),
  organization_id uuid null,
  default_pdf_template_id uuid null,
  created_at timestamp with time zone null default now(),
  default_currency_id uuid null,
  default_wallet_id uuid null,
  updated_at timestamp with time zone null default now(),
  use_currency_exchange boolean not null default false,
  constraint organization_preferences_pkey primary key (id),
  constraint unique_organization_preferences unique (organization_id),
  constraint organization_preferences_default_currency_id_fkey foreign KEY (default_currency_id) references currencies (id) on delete set null,
  constraint organization_preferences_default_pdf_template_id_fkey foreign KEY (default_pdf_template_id) references pdf_templates (id) on delete CASCADE,
  constraint organization_preferences_default_wallet_id_fkey foreign KEY (default_wallet_id) references wallets (id) on delete set null,
  constraint organization_preferences_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on organization_preferences for EACH row
execute FUNCTION update_updated_at_column ();

create trigger update_organization_preferences_updated_at BEFORE
update on organization_preferences for EACH row
execute FUNCTION update_updated_at_column ();

## Tabla ORGANIZATION_SUSCRIPTIONS:

create table public.organization_subscriptions (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  plan_id uuid not null,
  payment_id uuid null,
  status text not null default 'active'::text,
  billing_period text not null,
  started_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null,
  cancelled_at timestamp with time zone null,
  amount numeric(10, 2) not null,
  currency text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  scheduled_downgrade_plan_id uuid null,
  provider_subscription_id text null,
  coupon_id uuid null,
  coupon_code text null,
  payer_email text null,
  constraint organization_subscriptions_pkey primary key (id),
  constraint organization_subscriptions_coupon_id_fkey foreign KEY (coupon_id) references coupons (id),
  constraint organization_subscriptions_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_subscriptions_payment_id_fkey foreign KEY (payment_id) references payments (id) on delete CASCADE,
  constraint organization_subscriptions_scheduled_downgrade_plan_id_fkey foreign KEY (scheduled_downgrade_plan_id) references plans (id) on delete set null,
  constraint organization_subscriptions_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete CASCADE,
  constraint organization_subscriptions_billing_period_check check (
    (
      billing_period = any (array['monthly'::text, 'annual'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_org_subs_scheduled_downgrade on public.organization_subscriptions using btree (scheduled_downgrade_plan_id) TABLESPACE pg_default
where
  (scheduled_downgrade_plan_id is not null);

create unique INDEX IF not exists org_subscriptions_unique_active on public.organization_subscriptions using btree (organization_id) TABLESPACE pg_default
where
  (status = 'active'::text);

create index IF not exists idx_org_subscriptions_coupon on public.organization_subscriptions using btree (coupon_id) TABLESPACE pg_default;

## Tabla ORGANIZATION_WALLETS:

create table public.organization_wallets (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  wallet_id uuid null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  is_default boolean not null default false,
  updated_at timestamp with time zone null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  constraint organization_wallets_pkey primary key (id),
  constraint organization_wallets_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint organization_wallets_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_wallets_wallet_id_fkey foreign KEY (wallet_id) references wallets (id) on delete set null,
  constraint org_wallets_default_active_chk check (
    (
      (not is_default)
      or is_active
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists org_wallets_org_wallet_uniq on public.organization_wallets using btree (organization_id, wallet_id) TABLESPACE pg_default;

create unique INDEX IF not exists org_wallets_org_default_uniq on public.organization_wallets using btree (organization_id) TABLESPACE pg_default
where
  (is_default = true);

create index IF not exists org_wallets_org_idx on public.organization_wallets using btree (organization_id) TABLESPACE pg_default;

create index IF not exists org_wallets_wallet_idx on public.organization_wallets using btree (wallet_id) TABLESPACE pg_default;

create trigger organization_wallets_set_updated_at BEFORE
update on organization_wallets for EACH row
execute FUNCTION set_timestamp ();

## Tabla ORGANIZATIONS:

create table public.organizations (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  created_by uuid null,
  is_active boolean not null default true,
  updated_at timestamp with time zone not null default now(),
  plan_id uuid null,
  is_system boolean null default false,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  owner_id uuid null,
  image_path text null,
  image_bucket text null,
  settings jsonb null default '{}'::jsonb,
  is_demo boolean not null default false,
  constraint organizations_pkey primary key (id),
  constraint organizations_id_key unique (id),
  constraint organizations_created_by_fkey foreign KEY (created_by) references users (id) on delete CASCADE,
  constraint organizations_owner_fkey foreign KEY (owner_id) references users (id) on delete set null,
  constraint organizations_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_organizations_updated_at on public.organizations using btree (updated_at) TABLESPACE pg_default;

create index IF not exists idx_organizations_active_not_deleted on public.organizations using btree (is_active, is_deleted) TABLESPACE pg_default;

create index IF not exists idx_organizations_plan on public.organizations using btree (plan_id) TABLESPACE pg_default;

create trigger organizations_set_updated_at BEFORE
update on organizations for EACH row when (old.updated_at is distinct from new.updated_at)
execute FUNCTION update_updated_at_column ();

## Tabla PERMISSIONS:

create table public.permissions (
  id uuid not null default gen_random_uuid (),
  key text not null,
  description text not null,
  category text not null,
  is_system boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint permissions_pkey primary key (id),
  constraint permissions_key_key unique (key)
) TABLESPACE pg_default;

## Tabla ROLE_PERMISSIONS:

create table public.role_permissions (
  id uuid not null default gen_random_uuid (),
  role_id uuid not null,
  permission_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint role_permissions_pkey primary key (id),
  constraint role_permissions_role_id_permission_id_key unique (role_id, permission_id),
  constraint role_permissions_permission_id_fkey foreign KEY (permission_id) references permissions (id) on delete CASCADE,
  constraint role_permissions_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_role_id on public.role_permissions using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_permission_id on public.role_permissions using btree (permission_id) TABLESPACE pg_default;

## Tabla ROLES:

create table public.roles (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  type text null,
  organization_id uuid null,
  is_system boolean not null default false,
  constraint roles_pkey primary key (id),
  constraint roles_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create unique INDEX IF not exists roles_unique_name_per_org on public.roles using btree (organization_id, name) TABLESPACE pg_default
where
  (is_system = false);

create index IF not exists idx_roles_organization_id on public.roles using btree (organization_id) TABLESPACE pg_default;


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

## Tabla WALLETS:

create table public.wallets (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone not null default now(),
  is_active boolean not null default true,
  updated_at timestamp with time zone not null default now(),
  constraint wallets_pkey primary key (id),
  constraint wallets_id_key unique (id),
  constraint wallets_name_key unique (name),
  constraint wallets_name_not_blank_chk check ((btrim(name) <> ''::text))
) TABLESPACE pg_default;
