# Detalle de las tablas de Supabase relacionadas a PAGOS Y SUSCRIPCIONES:

--------------- TABLA USERS:

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

---------- Tabla ORGANIZATIONS:

create table public.organizations (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  created_by uuid not null,
  is_active boolean null default true,
  updated_at timestamp with time zone null default now(),
  plan_id uuid null,
  is_system boolean null default false,
  logo_url text null,
  constraint organizations_pkey primary key (id),
  constraint organizations_id_key unique (id),
  constraint organizations_created_by_fkey foreign KEY (created_by) references users (id) on delete CASCADE,
  constraint organizations_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_organizations_updated_at on public.organizations using btree (updated_at) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on organizations for EACH row
execute FUNCTION update_updated_at_column ();

create trigger update_organizations_updated_at BEFORE
update on organizations for EACH row
execute FUNCTION update_updated_at_column ();

---------- Tabla PLANS:

create table public.plans (
  id uuid not null default gen_random_uuid (),
  name text not null,
  features jsonb null,
  price numeric null,
  is_active boolean null default true,
  billing_type text null default 'per_user'::text,
  constraint plans_pkey primary key (id),
  constraint plans_name_key unique (name)
) TABLESPACE pg_default;

---------- Tabla COURSES:

create table public.courses (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  title text not null,
  short_description text null,
  long_description text null,
  cover_url text null,
  is_active boolean not null default true,
  visibility text not null default 'public'::text,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint courses_pkey primary key (id),
  constraint courses_slug_key unique (slug),
  constraint courses_created_by_fkey foreign KEY (created_by) references users (id) on delete set null
) TABLESPACE pg_default;

---------- Tabla COURSE_PRICES:

create table public.course_prices (
  id uuid not null default gen_random_uuid (),
  course_id uuid not null,
  currency_code text not null,
  amount numeric(14, 2) not null,
  provider text not null default 'any'::text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  months integer null,
  constraint course_prices_pkey primary key (id),
  constraint course_prices_unique_per_provider unique (course_id, currency_code, provider),
  constraint course_prices_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint course_prices_amount_check check ((amount >= (0)::numeric)),
  constraint course_prices_currency_chk check (
    (
      currency_code = any (array['ARS'::text, 'USD'::text, 'EUR'::text])
    )
  ),
  constraint course_prices_months_check check (
    (
      (months is null)
      or (months >= 0)
    )
  )
) TABLESPACE pg_default;

---------- Tabla COURSE_ENROLLMENTS:

create table public.course_enrollments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  course_id uuid not null,
  status text not null default 'active'::text,
  started_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint course_enrollments_pkey primary key (id),
  constraint enroll_unique unique (user_id, course_id),
  constraint course_enrollments_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint course_enrollments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create unique INDEX IF not exists course_enrollments_user_course_uniq on public.course_enrollments using btree (user_id, course_id) TABLESPACE pg_default;

create index IF not exists course_enrollments_user_id_course_id_idx on public.course_enrollments using btree (user_id, course_id) TABLESPACE pg_default;

create index IF not exists idx_course_enrollments_user on public.course_enrollments using btree (user_id) TABLESPACE pg_default;

---------- Tabla BILLING_PROFILES:

create table public.billing_profiles (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  is_company boolean not null default false,
  full_name text null,
  company_name text null,
  tax_id text null,
  country_id uuid null,
  address_line1 text null,
  city text null,
  postcode text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint billing_profiles_pkey primary key (id),
  constraint billing_profiles_country_id_fkey foreign KEY (country_id) references countries (id) on delete set null,
  constraint billing_profiles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create unique INDEX IF not exists billing_profiles_user_id_uniq on public.billing_profiles using btree (user_id) TABLESPACE pg_default;

create trigger trg_billing_profiles_user_id_immutable BEFORE
update on billing_profiles for EACH row
execute FUNCTION forbid_user_id_change ();

---------- Tabla BANK_TRANSFER_PAYMENTS:

create table public.bank_transfer_payments (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  user_id uuid not null,
  amount numeric(14, 2) not null,
  currency text not null,
  receipt_url text null,
  payer_name text null,
  payer_note text null,
  status public.payment_review_status not null default 'pending'::payment_review_status,
  reviewed_by uuid null,
  reviewed_at timestamp with time zone null,
  review_reason text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  payment_id uuid null,
  course_id uuid null,
  discount_percent numeric null default 5.0,
  discount_amount numeric null default 0,
  constraint bank_transfer_payments_pkey primary key (id),
  constraint bank_transfer_payments_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint bank_transfer_payments_payment_id_fkey foreign KEY (payment_id) references payments (id) on delete CASCADE,
  constraint bank_transfer_payments_reviewed_by_fkey foreign KEY (reviewed_by) references users (id) on delete set null,
  constraint bank_transfer_payments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists bank_transfer_payments_user_idx on public.bank_transfer_payments using btree (user_id) TABLESPACE pg_default;

create index IF not exists bank_transfer_payments_order_idx on public.bank_transfer_payments using btree (order_id) TABLESPACE pg_default;

create index IF not exists bank_transfer_payments_payment_idx on public.bank_transfer_payments using btree (payment_id) TABLESPACE pg_default;

create trigger trg_btp_updated_at BEFORE
update on bank_transfer_payments for EACH row
execute FUNCTION update_updated_at_column ();

---------- Tabla COUPON_COURSES:

create table public.coupon_courses (
  coupon_id uuid not null,
  course_id uuid not null,
  constraint coupon_courses_pkey primary key (coupon_id),
  constraint coupon_courses_coupon_id_fkey foreign KEY (coupon_id) references coupons (id) on delete CASCADE,
  constraint coupon_courses_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE
) TABLESPACE pg_default;

---------- Tabla COUPON_REDEMPTIONS:

create table public.coupon_redemptions (
  id uuid not null default gen_random_uuid (),
  coupon_id uuid not null,
  user_id uuid not null,
  course_id uuid not null,
  order_id uuid null,
  amount_saved numeric(12, 2) not null,
  currency text null,
  created_at timestamp with time zone not null default now(),
  constraint coupon_redemptions_pkey primary key (id),
  constraint coupon_redemptions_coupon_id_fkey foreign KEY (coupon_id) references coupons (id) on delete CASCADE,
  constraint coupon_redemptions_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint coupon_redemptions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

---------- Tabla IA_USAGE_LOGS:

create table public.ia_usage_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  provider text null default 'openai'::text,
  model text null default 'gpt-4o'::text,
  prompt_tokens integer null,
  completion_tokens integer null,
  total_tokens integer null,
  cost_usd numeric(6, 4) null,
  context_type text null,
  created_at timestamp with time zone null default now(),
  constraint ia_usage_logs_pkey primary key (id),
  constraint ia_usage_logs_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ia_usage_logs_user_id on public.ia_usage_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_ia_usage_logs_context_type on public.ia_usage_logs using btree (context_type) TABLESPACE pg_default;

---------- Tabla IA_USAGE_LIMITS:

create table public.ia_user_usage_limits (
  user_id uuid not null,
  plan text not null default 'free'::text,
  daily_limit integer not null default 3,
  prompts_used_today integer not null default 0,
  last_prompt_at timestamp with time zone null,
  last_reset_at date null default CURRENT_DATE,
  constraint ia_user_usage_limits_pkey primary key (user_id),
  constraint ia_user_usage_limits_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ia_user_usage_limits_plan on public.ia_user_usage_limits using btree (plan) TABLESPACE pg_default;

create index IF not exists idx_ia_user_usage_limits_last_reset on public.ia_user_usage_limits using btree (last_reset_at) TABLESPACE pg_default;

create trigger trg_reset_prompt_limit BEFORE
update on ia_user_usage_limits for EACH row
execute FUNCTION reset_daily_prompt_limit_if_needed ();

---------- Tabla NOTIFICATIONS:

create table public.notifications (
  id uuid not null default gen_random_uuid (),
  type text not null,
  title text not null,
  body text null,
  data jsonb null,
  audience text not null default 'direct'::text,
  role_id uuid null,
  org_id uuid null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  start_at timestamp with time zone null,
  expires_at timestamp with time zone null,
  constraint notifications_pkey primary key (id),
  constraint notifications_created_by_fkey foreign KEY (created_by) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists notifications_created_at_idx on public.notifications using btree (created_at desc) TABLESPACE pg_default;

---------- Tabla PAYMENT_EVENTS:

create table public.payment_events (
  id uuid not null default gen_random_uuid (),
  provider_event_id text null,
  provider_event_type text null,
  status text null default 'RECEIVED'::text,
  raw_headers jsonb null,
  raw_payload jsonb not null,
  created_at timestamp with time zone null default now(),
  order_id text null,
  custom_id text null,
  user_hint text null,
  course_hint text null,
  provider text not null default 'paypal'::text,
  provider_payment_id text null,
  amount numeric null,
  currency text null,
  constraint paypal_events_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_payment_events_provider on public.payment_events using btree (provider) TABLESPACE pg_default;

create index IF not exists idx_payment_events_order_id on public.payment_events using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_payment_events_custom_id on public.payment_events using btree (custom_id) TABLESPACE pg_default;

---------- Tabla PAYMENTS:

create table public.payment_events (
  id uuid not null default gen_random_uuid (),
  provider_event_id text null,
  provider_event_type text null,
  status text null default 'RECEIVED'::text,
  raw_headers jsonb null,
  raw_payload jsonb not null,
  created_at timestamp with time zone null default now(),
  order_id text null,
  custom_id text null,
  user_hint text null,
  course_hint text null,
  provider text not null default 'paypal'::text,
  provider_payment_id text null,
  amount numeric null,
  currency text null,
  constraint paypal_events_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_payment_events_provider on public.payment_events using btree (provider) TABLESPACE pg_default;

create index IF not exists idx_payment_events_order_id on public.payment_events using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_payment_events_custom_id on public.payment_events using btree (custom_id) TABLESPACE pg_default;

---------- Tabla USER_NOTIFICATIONS:

create table public.user_notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  notification_id uuid not null,
  delivered_at timestamp with time zone not null default now(),
  read_at timestamp with time zone null,
  clicked_at timestamp with time zone null,
  constraint user_notifications_pkey primary key (id),
  constraint user_notifications_user_id_notification_id_key unique (user_id, notification_id),
  constraint user_notifications_notification_id_fkey foreign KEY (notification_id) references notifications (id) on delete CASCADE,
  constraint user_notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists user_notifications_user_idx on public.user_notifications using btree (user_id, read_at) TABLESPACE pg_default;

---------- Tabla PLAN_PRICES:

create table public.plan_prices (
  id uuid not null default gen_random_uuid (),
  plan_id uuid not null,
  currency_code text not null,
  monthly_amount numeric(10, 2) not null,
  annual_amount numeric(10, 2) not null,
  provider text null default 'any'::text,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint plan_prices_pkey primary key (id),
  constraint plan_prices_unique unique (plan_id, currency_code, provider),
  constraint plan_prices_plan_id_fkey foreign KEY (plan_id) references plans (id),
  constraint plan_prices_currency_code_check check (
    (
      currency_code = any (array['ARS'::text, 'USD'::text, 'EUR'::text])
    )
  )
) TABLESPACE pg_default;

---------- Tabla ORGANIZATION_SUBSCRIPTIONS:

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
  constraint organization_subscriptions_pkey primary key (id),
  constraint organization_subscriptions_organization_id_fkey foreign KEY (organization_id) references organizations (id),
  constraint organization_subscriptions_payment_id_fkey foreign KEY (payment_id) references payments (id),
  constraint organization_subscriptions_plan_id_fkey foreign KEY (plan_id) references plans (id),
  constraint organization_subscriptions_billing_period_check check (
    (
      billing_period = any (array['monthly'::text, 'annual'::text])
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists org_subscriptions_unique_active on public.organization_subscriptions using btree (organization_id) TABLESPACE pg_default
where
  (status = 'active'::text);

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

create trigger set_updated_at BEFORE
update on organization_members for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_sync_user_contact_on_member_ins
after INSERT on organization_members for EACH row
execute FUNCTION archub_sync_user_contact ();

create trigger trg_sync_user_contact_on_member_upd
after
update OF user_id on organization_members for EACH row when (
  new.user_id is not null
  and old.user_id is distinct from new.user_id
)
execute FUNCTION archub_sync_user_contact ();

create trigger trigger_create_contact_on_new_member
after INSERT on organization_members for EACH row
execute FUNCTION handle_new_org_member_contact ();

---------- Tabla ORGANIZATION_BILLING_CYCLES:

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
  constraint organization_billing_cycles_pkey primary key (id),
  constraint organization_billing_cycles_organization_id_fkey foreign KEY (organization_id) references organizations (id),
  constraint organization_billing_cycles_plan_id_fkey foreign KEY (plan_id) references plans (id),
  constraint organization_billing_cycles_subscription_id_fkey foreign KEY (subscription_id) references organization_subscriptions (id)
) TABLESPACE pg_default;

create index IF not exists idx_billing_cycles_org on public.organization_billing_cycles using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_billing_cycles_subscription on public.organization_billing_cycles using btree (subscription_id) TABLESPACE pg_default;

create index IF not exists idx_billing_cycles_period on public.organization_billing_cycles using btree (period_start, period_end) TABLESPACE pg_default;

create index IF not exists idx_billing_cycles_status on public.organization_billing_cycles using btree (status) TABLESPACE pg_default;