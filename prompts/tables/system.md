# Detalle de las tablas de Supabase de SISTEMA:

## Vista ADMIN_USERS:

create view public.admin_users as
select
  users.auth_id
from
  users
where
  users.role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid;

## Tabla APP_SETTINGS:

create table public.app_settings (
  key text not null,
  value text null,
  description text null,
  updated_at timestamp with time zone null default now(),
  constraint app_settings_pkey primary key (key)
) TABLESPACE pg_default;

## Tabla BANK_TRANSFER_PAYMENTS:

create table public.bank_transfer_payments (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  user_id uuid not null,
  amount numeric(14, 2) not null,
  currency text not null,
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
  image_bucket text null,
  image_path text null,
  constraint bank_transfer_payments_pkey primary key (id),
  constraint bank_transfer_payments_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint bank_transfer_payments_payment_id_fkey foreign KEY (payment_id) references payments (id) on delete CASCADE,
  constraint bank_transfer_payments_reviewed_by_fkey foreign KEY (reviewed_by) references users (id) on delete set null,
  constraint bank_transfer_payments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists bank_transfer_payments_user_idx on public.bank_transfer_payments using btree (user_id) TABLESPACE pg_default;

create index IF not exists bank_transfer_payments_order_idx on public.bank_transfer_payments using btree (order_id) TABLESPACE pg_default;

create index IF not exists bank_transfer_payments_payment_idx on public.bank_transfer_payments using btree (payment_id) TABLESPACE pg_default;

create trigger on_bank_transfer_payment_created_send_email
after INSERT on bank_transfer_payments for EACH row
execute FUNCTION notify_replit_email ();

create trigger on_bank_transfer_payment_send_email
after INSERT on bank_transfer_payments for EACH row
execute FUNCTION notify_replit_email ();

create trigger trg_btp_updated_at BEFORE
update on bank_transfer_payments for EACH row
execute FUNCTION update_updated_at_column ();

## Tabla BILLING_PROFILES:

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

create index IF not exists idx_contacts_org_email on public.contacts using btree (organization_id, email) TABLESPACE pg_default;

create trigger on_contact_link_user BEFORE INSERT
or
update OF email on contacts for EACH row
execute FUNCTION handle_contact_link_user ();

## Tabla COUPON_COURSES:

create table public.coupon_courses (
  coupon_id uuid not null,
  course_id uuid not null,
  constraint coupon_courses_pkey primary key (coupon_id, course_id),
  constraint coupon_courses_coupon_id_fkey foreign KEY (coupon_id) references coupons (id) on delete CASCADE,
  constraint coupon_courses_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_coupon_courses_coupon on public.coupon_courses using btree (coupon_id) TABLESPACE pg_default;

create index IF not exists idx_coupon_courses_course on public.coupon_courses using btree (course_id) TABLESPACE pg_default;

## Tabla COUPON_PLANS:

create table public.coupon_plans (
  coupon_id uuid not null,
  plan_id uuid not null,
  constraint coupon_plans_pkey primary key (coupon_id, plan_id),
  constraint coupon_plans_coupon_id_fkey foreign KEY (coupon_id) references coupons (id) on delete CASCADE,
  constraint coupon_plans_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_coupon_plans_plan_id on public.coupon_plans using btree (plan_id) TABLESPACE pg_default;

## Tabla COUPON_REDEMPTIONS:

create table public.coupon_redemptions (
  id uuid not null default gen_random_uuid (),
  coupon_id uuid not null,
  user_id uuid not null,
  course_id uuid null,
  order_id uuid null,
  amount_saved numeric(12, 2) not null,
  currency text null,
  created_at timestamp with time zone not null default now(),
  subscription_id uuid null,
  plan_id uuid null,
  constraint coupon_redemptions_pkey primary key (id),
  constraint coupon_redemptions_coupon_id_fkey foreign KEY (coupon_id) references coupons (id) on delete CASCADE,
  constraint coupon_redemptions_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint coupon_redemptions_plan_id_fkey foreign KEY (plan_id) references plans (id),
  constraint coupon_redemptions_subscription_id_fkey foreign KEY (subscription_id) references organization_subscriptions (id),
  constraint coupon_redemptions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_coupon_redemptions_subscription_id on public.coupon_redemptions using btree (subscription_id) TABLESPACE pg_default;

## Tabla COUPONS:

create table public.coupons (
  id uuid not null default gen_random_uuid (),
  code text not null,
  type public.coupon_type_t not null,
  amount numeric(12, 2) not null,
  currency text null,
  max_redemptions integer null,
  per_user_limit integer null default 1,
  starts_at timestamp with time zone null,
  expires_at timestamp with time zone null,
  min_order_total numeric(12, 2) null,
  applies_to_all boolean not null default true,
  is_active boolean not null default true,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  applies_to text null default 'courses'::text,
  constraint coupons_pkey primary key (id),
  constraint coupons_created_by_fkey foreign KEY (created_by) references users (id) on delete set null
) TABLESPACE pg_default;

create unique INDEX IF not exists coupons_code_lower_uidx on public.coupons using btree (lower(code)) TABLESPACE pg_default;

create trigger trg_coupons_set_updated BEFORE
update on coupons for EACH row
execute FUNCTION set_updated_at ();

## Tabla COURSE_ENROLLMENTS:

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

## Tabla COURSE_LESSON_NOTES:

create table public.course_lesson_notes (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  lesson_id uuid not null,
  body text not null,
  time_sec integer null,
  is_pinned boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  note_type text not null default 'marker'::text,
  constraint course_lesson_notes_pkey primary key (id),
  constraint course_lesson_notes_lesson_id_fkey foreign KEY (lesson_id) references course_lessons (id) on delete CASCADE,
  constraint course_lesson_notes_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint course_lesson_notes_time_nonneg_chk check (
    (
      (time_sec is null)
      or (time_sec >= 0)
    )
  ),
  constraint course_lesson_notes_type_chk check (
    (
      note_type = any (
        array[
          'summary'::text,
          'marker'::text,
          'todo'::text,
          'question'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_summary_per_user_lesson on public.course_lesson_notes using btree (user_id, lesson_id) TABLESPACE pg_default
where
  (note_type = 'summary'::text);

create index IF not exists lesson_notes_by_user_lesson on public.course_lesson_notes using btree (user_id, lesson_id, created_at desc) TABLESPACE pg_default;

create index IF not exists lesson_markers_idx on public.course_lesson_notes using btree (lesson_id, user_id, time_sec) TABLESPACE pg_default
where
  (note_type = 'marker'::text);

## Tabla COURSE_LESSON_PROGRESS:

create table public.course_lesson_progress (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  lesson_id uuid not null,
  progress_pct numeric(5, 2) not null default 0,
  last_position_sec integer not null default 0,
  completed_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  is_completed boolean null default false,
  is_favorite boolean not null default false,
  constraint lesson_progress_pkey primary key (id),
  constraint lesson_progress_unique unique (user_id, lesson_id),
  constraint lesson_progress_lesson_id_fkey foreign KEY (lesson_id) references course_lessons (id) on delete CASCADE,
  constraint lesson_progress_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_lesson_progress_favorites on public.course_lesson_progress using btree (user_id, is_favorite) TABLESPACE pg_default
where
  (is_favorite = true);

create index IF not exists lesson_progress_user_id_lesson_id_idx on public.course_lesson_progress using btree (user_id, lesson_id) TABLESPACE pg_default;

create index IF not exists idx_progress_user_updated_at on public.course_lesson_progress using btree (user_id, updated_at) TABLESPACE pg_default;

create unique INDEX IF not exists uq_progress_user_lesson on public.course_lesson_progress using btree (user_id, lesson_id) TABLESPACE pg_default;

create index IF not exists idx_course_lesson_progress_user_completed on public.course_lesson_progress using btree (user_id, is_completed, completed_at desc) TABLESPACE pg_default;

create trigger trg_progress_fill_user BEFORE INSERT on course_lesson_progress for EACH row
execute FUNCTION fill_progress_user_id_from_auth ();

## Tabla COURSES:

create table public.courses (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  title text not null,
  short_description text null,
  is_active boolean not null default true,
  visibility text not null default 'public'::text,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  price numeric null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  status text not null default 'available'::text,
  constraint courses_pkey primary key (id),
  constraint courses_slug_key unique (slug),
  constraint courses_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint courses_status_check check (
    (
      status = any (
        array[
          'available'::text,
          'coming_soon'::text,
          'maintenance'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists courses_not_deleted_idx on public.courses using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

## Tabla FEEDBACK:

create table public.feedback (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  message text not null,
  created_at timestamp with time zone not null default now(),
  metadata jsonb null default '{}'::jsonb,
  constraint feedback_pkey primary key (id)
) TABLESPACE pg_default;

create trigger trg_feedback_fill_user BEFORE INSERT on feedback for EACH row
execute FUNCTION fill_feedback_user_from_auth ();

## Tabla FORUM_POSTS:

create table public.forum_posts (
  id uuid not null default gen_random_uuid (),
  thread_id uuid not null,
  organization_id uuid not null,
  author_id uuid not null,
  parent_id uuid null,
  content jsonb not null,
  is_accepted_answer boolean null default false,
  is_deleted boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint forum_posts_pkey primary key (id),
  constraint forum_posts_author_id_fkey foreign KEY (author_id) references users (id) on delete CASCADE,
  constraint forum_posts_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint forum_posts_parent_id_fkey foreign KEY (parent_id) references forum_posts (id) on delete set null,
  constraint forum_posts_thread_id_fkey foreign KEY (thread_id) references forum_threads (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_forum_posts_thread on public.forum_posts using btree (thread_id) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger trg_update_thread_activity
after INSERT
or DELETE on forum_posts for EACH row
execute FUNCTION update_forum_thread_activity ();

## Tabla FORUM_THREADS:

create table public.forum_threads (
  id uuid not null default gen_random_uuid (),
  category_id uuid not null,
  organization_id uuid not null,
  author_id uuid not null,
  title text not null,
  slug text not null,
  content jsonb not null,
  view_count integer null default 0,
  reply_count integer null default 0,
  last_activity_at timestamp with time zone null default now(),
  is_pinned boolean null default false,
  is_locked boolean null default false,
  is_deleted boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint forum_threads_pkey primary key (id),
  constraint forum_threads_slug_key unique (slug),
  constraint forum_threads_author_id_fkey foreign KEY (author_id) references users (id) on delete set null,
  constraint forum_threads_category_id_fkey foreign KEY (category_id) references forum_categories (id) on delete RESTRICT,
  constraint forum_threads_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_forum_threads_category on public.forum_threads using btree (category_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_forum_last_activity on public.forum_threads using btree (last_activity_at desc) TABLESPACE pg_default;

## Tabla GLOBAL_ANNOUNCEMENTS:

create table public.global_announcements (
  id uuid not null default gen_random_uuid (),
  title text not null,
  message text not null,
  type text not null,
  link_text text null,
  link_url text null,
  audience text null default 'all'::text,
  is_active boolean null default true,
  starts_at timestamp with time zone null default now(),
  ends_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  created_by uuid null,
  primary_button_text text null,
  primary_button_url text null,
  secondary_button_text text null,
  secondary_button_url text null,
  constraint global_announcements_pkey primary key (id),
  constraint global_announcements_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint global_announcements_audience_check check (
    (
      audience = any (
        array[
          'all'::text,
          'free'::text,
          'pro'::text,
          'teams'::text
        ]
      )
    )
  ),
  constraint global_announcements_type_check check (
    (
      type = any (
        array[
          'info'::text,
          'warning'::text,
          'error'::text,
          'success'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

## Tabla HERO_SECTIONS:

create table public.hero_sections (
  id uuid not null default gen_random_uuid (),
  section_type text not null default 'learning_dashboard'::text,
  order_index integer not null default 0,
  title text null,
  description text null,
  primary_button_text text null,
  primary_button_action text null,
  primary_button_action_type text null default 'url'::text,
  secondary_button_text text null,
  secondary_button_action text null,
  secondary_button_action_type text null default 'url'::text,
  is_active boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint hero_sections_pkey primary key (id)
) TABLESPACE pg_default;

## Tabla LINKED_ACCOUNTS:

create table public.linked_accounts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  auth_id uuid not null,
  provider_source text null,
  created_at timestamp with time zone null default now(),
  constraint linked_accounts_pkey primary key (id),
  constraint linked_accounts_auth_id_key unique (auth_id),
  constraint linked_accounts_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

## Tabla MP_SUBSCRIPTION_PREFERENCES:

create table public.mp_subscription_preferences (
  id character varying(64) not null,
  preapproval_id text null,
  user_id uuid not null,
  organization_id uuid not null,
  plan_id uuid null,
  plan_slug text null,
  billing_period text not null,
  amount_ars numeric(10, 2) null,
  is_upgrade boolean null default false,
  previous_subscription_id uuid null,
  proration_credit numeric(10, 2) null,
  created_at timestamp without time zone null default now(),
  product_type text null,
  preference_id text null,
  invitee_email text null,
  role_id uuid null,
  subscription_id uuid null,
  payer_email text null,
  constraint mp_subscription_preferences_pkey primary key (id),
  constraint mp_subscription_preferences_billing_period_check check (
    (
      billing_period = any (array['monthly'::text, 'annual'::text])
    )
  )
) TABLESPACE pg_default;

create trigger trg_enforce_mp_subscription_preferences_user_id BEFORE INSERT on mp_subscription_preferences for EACH row
execute FUNCTION enforce_mp_subscription_preferences_user_id ();

create trigger trg_prevent_mp_subscription_preferences_org_id_update BEFORE
update on mp_subscription_preferences for EACH row
execute FUNCTION prevent_mp_subscription_preferences_org_id_update ();

create trigger trg_prevent_mp_subscription_preferences_user_id_update BEFORE
update on mp_subscription_preferences for EACH row
execute FUNCTION prevent_mp_subscription_preferences_user_id_update ();

## Tabla NOTIFICATIONS:

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

create trigger on_member_joins_founder_org
after INSERT on organization_members for EACH row
execute FUNCTION auto_enroll_founder_members ();

create trigger set_updated_at BEFORE
update on organization_members for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trigger_create_contact_on_new_member
after INSERT on organization_members for EACH row
execute FUNCTION handle_new_org_member_contact ();

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

## Tabla PAYMENT_EVENTS:

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

## Tabla PAYMENTS:

create table public.payments (
  id uuid not null default gen_random_uuid (),
  provider text not null,
  provider_payment_id text null,
  user_id uuid not null,
  course_id uuid null,
  amount numeric null,
  currency text null default 'USD'::text,
  status text not null default 'completed'::text,
  created_at timestamp with time zone not null default now(),
  product_type text null,
  product_id uuid null,
  organization_id uuid null,
  approved_at timestamp with time zone null,
  metadata jsonb null,
  gateway text null,
  constraint payments_pkey primary key (id),
  constraint payments_course_id_fkey foreign KEY (course_id) references courses (id) on delete set null,
  constraint payments_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete set null,
  constraint payments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint payments_status_chk check (
    (
      status = any (
        array[
          'pending'::text,
          'completed'::text,
          'rejected'::text,
          'refunded'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists uq_payments_provider_payment on public.payments using btree (provider, provider_payment_id) TABLESPACE pg_default
where
  (provider_payment_id is not null);

create index IF not exists idx_payments_user on public.payments using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_payments_course on public.payments using btree (course_id) TABLESPACE pg_default;

create trigger on_payment_created_send_email
after INSERT on payments for EACH row
execute FUNCTION notify_replit_email ();

## Tabla PAYPAL_SEAT_PREFERENCES:

create table public.paypal_seat_preferences (
  id character varying(50) not null,
  user_id uuid not null,
  organization_id uuid not null,
  invitee_email character varying(255) not null,
  role_id uuid not null,
  subscription_id uuid null,
  prorated_amount_usd numeric(10, 2) not null,
  billing_period character varying(20) not null,
  order_id character varying(100) null,
  status character varying(20) null default 'pending'::character varying,
  created_at timestamp with time zone null default now(),
  captured_at timestamp with time zone null,
  constraint paypal_seat_preferences_pkey primary key (id),
  constraint paypal_seat_preferences_organization_id_fkey foreign KEY (organization_id) references organizations (id),
  constraint paypal_seat_preferences_role_id_fkey foreign KEY (role_id) references roles (id),
  constraint paypal_seat_preferences_subscription_id_fkey foreign KEY (subscription_id) references organization_subscriptions (id),
  constraint paypal_seat_preferences_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create index IF not exists idx_paypal_seat_pref_org on public.paypal_seat_preferences using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_paypal_seat_pref_order on public.paypal_seat_preferences using btree (order_id) TABLESPACE pg_default;

## Tabla PAYPAL_UPGRADE_PREFERENCES:

create table public.paypal_upgrade_preferences (
  id character varying(50) not null,
  user_id uuid not null,
  organization_id uuid not null,
  plan_id uuid not null,
  plan_slug character varying(50) not null,
  billing_period character varying(20) not null,
  amount_usd numeric(10, 2) not null,
  order_id character varying(100) null,
  previous_subscription_id uuid null,
  proration_credit numeric(10, 2) null,
  full_price_usd numeric(10, 2) null,
  target_paypal_plan_id character varying(100) null,
  status character varying(20) null default 'pending'::character varying,
  created_at timestamp with time zone null default now(),
  captured_at timestamp with time zone null,
  constraint paypal_upgrade_preferences_pkey primary key (id),
  constraint paypal_upgrade_preferences_organization_id_fkey foreign KEY (organization_id) references organizations (id),
  constraint paypal_upgrade_preferences_plan_id_fkey foreign KEY (plan_id) references plans (id),
  constraint paypal_upgrade_preferences_previous_subscription_id_fkey foreign KEY (previous_subscription_id) references organization_subscriptions (id),
  constraint paypal_upgrade_preferences_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create index IF not exists idx_paypal_upgrade_pref_org on public.paypal_upgrade_preferences using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_paypal_upgrade_pref_order on public.paypal_upgrade_preferences using btree (order_id) TABLESPACE pg_default;

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

## Tabla PLANS:

create table public.plans (
  id uuid not null default gen_random_uuid (),
  name text not null,
  features jsonb null,
  is_active boolean null default true,
  billing_type text null default 'per_user'::text,
  slug text null,
  monthly_amount numeric null,
  annual_amount numeric null,
  paypal_product_id text null,
  paypal_plan_monthly_id text null,
  paypal_plan_annual_id text null,
  mp_plan_monthly_id text null,
  mp_plan_annual_id text null,
  status text not null default 'available'::text,
  constraint plans_pkey primary key (id),
  constraint plans_name_key unique (name),
  constraint plans_status_check check (
    (
      status = any (
        array[
          'available'::text,
          'coming_soon'::text,
          'maintenance'::text
        ]
      )
    )
  )
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

## Tabla SUSCRIPTION_NOTIFICATIONS_LOG:

create table public.subscription_notifications_log (
  id uuid not null default gen_random_uuid (),
  subscription_id uuid not null,
  notification_type text not null,
  sent_at timestamp with time zone null default now(),
  constraint subscription_notifications_log_pkey primary key (id),
  constraint subscription_notifications_lo_subscription_id_notification__key unique (subscription_id, notification_type),
  constraint subscription_notifications_log_subscription_id_fkey foreign KEY (subscription_id) references organization_subscriptions (id) on delete CASCADE
) TABLESPACE pg_default;

## Tabla SUPPORT_MESSAGES:

create table public.support_messages (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  message text not null,
  sender text not null,
  created_at timestamp with time zone null default now(),
  read_by_admin boolean not null default false,
  read_by_user boolean not null default false,
  constraint support_messages_pkey primary key (id),
  constraint support_messages_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint support_messages_sender_check check (
    (sender = any (array['user'::text, 'admin'::text]))
  )
) TABLESPACE pg_default;

create index IF not exists idx_support_messages_read_by_user on public.support_messages using btree (read_by_user, sender, user_id) TABLESPACE pg_default;

create index IF not exists idx_support_messages_read_by_admin on public.support_messages using btree (read_by_admin, sender) TABLESPACE pg_default;

create index IF not exists idx_support_messages_unread_user on public.support_messages using btree (sender, read_by_admin, user_id) TABLESPACE pg_default;

create trigger trg_enforce_support_messages_user_id BEFORE INSERT on support_messages for EACH row
execute FUNCTION enforce_support_messages_user_id ();

create trigger trg_prevent_support_messages_user_id_update BEFORE
update on support_messages for EACH row
execute FUNCTION prevent_support_messages_user_id_update ();

## Tabla SYSTEM_JOB_LOGS:

create table public.system_job_logs (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  subscription_id uuid null,
  job_type text not null,
  details jsonb null,
  status text not null,
  error_message text null,
  processed_at timestamp with time zone null default now(),
  constraint system_job_logs_pkey primary key (id),
  constraint system_job_logs_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

## Tabla TESTIMONIALS:

create table public.testimonials (
  id uuid not null default gen_random_uuid (),
  course_id uuid null,
  organization_id uuid null,
  product_id uuid null,
  author_name text not null,
  author_title text null,
  author_avatar_url text null,
  content text not null,
  rating integer null,
  is_featured boolean null default false,
  is_active boolean null default true,
  sort_index integer null default 0,
  is_deleted boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  user_id uuid null,
  constraint testimonials_pkey primary key (id),
  constraint testimonials_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint testimonials_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint testimonials_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint testimonials_rating_check check (
    (
      (rating >= 1)
      and (rating <= 5)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_testimonials_course on public.testimonials using btree (course_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_testimonials_org on public.testimonials using btree (organization_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_testimonials_active on public.testimonials using btree (is_active, is_deleted) TABLESPACE pg_default;

create index IF not exists idx_testimonials_user on public.testimonials using btree (user_id) TABLESPACE pg_default
where
  (
    (user_id is not null)
    and (is_deleted = false)
  );

create index IF not exists idx_testimonials_course_user on public.testimonials using btree (course_id, user_id) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger trg_enforce_testimonials_user_id BEFORE INSERT on testimonials for EACH row
execute FUNCTION enforce_testimonials_user_id ();

create trigger trg_prevent_testimonials_user_id_update BEFORE
update on testimonials for EACH row
execute FUNCTION prevent_testimonials_user_id_update ();

create trigger trigger_testimonials_updated_at BEFORE
update on testimonials for EACH row
execute FUNCTION update_testimonials_updated_at ();

## Tabla USER_DATA:

create table public.user_data (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  country uuid null,
  created_at timestamp with time zone null default now(),
  birthdate date null,
  updated_at timestamp with time zone null default now(),
  first_name text null,
  last_name text null,
  phone_e164 text null,
  constraint user_profile_data_pkey primary key (id),
  constraint user_data_id_key unique (id),
  constraint user_data_user_id_key unique (user_id),
  constraint user_data_country_fkey foreign KEY (country) references countries (id) on delete set null,
  constraint user_profile_data_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on user_data for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_user_data_fill_user BEFORE INSERT on user_data for EACH row
execute FUNCTION fill_user_data_user_id_from_auth ();

## Tabla USER_NOTIFICATIONS:

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

create trigger trg_enforce_user_notifications_user_id BEFORE INSERT on user_notifications for EACH row
execute FUNCTION enforce_user_notifications_user_id ();

create trigger trg_prevent_user_notifications_user_id_update BEFORE
update on user_notifications for EACH row
execute FUNCTION prevent_user_notifications_user_id_update ();

## Tabla USER_ORGANIZATION_PREFERENCES:

create table public.user_organization_preferences (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  organization_id uuid not null,
  last_project_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_organization_preferences_pkey primary key (id),
  constraint user_organization_preferences_user_id_organization_id_key unique (user_id, organization_id),
  constraint user_organization_preferences_last_project_id_fkey foreign KEY (last_project_id) references projects (id) on delete set null,
  constraint user_organization_preferences_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint user_organization_preferences_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger trg_enforce_user_org_prefs_user_id BEFORE INSERT on user_organization_preferences for EACH row
execute FUNCTION enforce_user_org_prefs_user_id ();

create trigger trg_prevent_user_org_prefs_org_id_update BEFORE
update on user_organization_preferences for EACH row
execute FUNCTION prevent_user_org_prefs_org_id_update ();

create trigger trg_prevent_user_org_prefs_user_id_update BEFORE
update on user_organization_preferences for EACH row
execute FUNCTION prevent_user_org_prefs_user_id_update ();

## Tabla USER_PREFERENCES:

create table public.user_preferences (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  last_organization_id uuid null,
  theme text null default 'light'::text,
  onboarding_completed boolean null default false,
  created_at timestamp with time zone null default now(),
  sidebar_docked boolean null default false,
  updated_at timestamp with time zone null default now(),
  last_user_type public.user_type null,
  home_checklist jsonb not null default '{"create_contact": false, "create_project": false, "create_movement": false}'::jsonb,
  home_banner_dismissed boolean not null default false,
  last_home_seen_at timestamp with time zone not null default now(),
  layout text not null default 'classic'::text,
  constraint user_preferences_pkey primary key (id),
  constraint user_preferences_user_id_key unique (user_id),
  constraint user_preferences_last_organization_id_fkey foreign KEY (last_organization_id) references organizations (id) on delete set null,
  constraint user_preferences_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint user_preferences_theme_chk check (
    (theme = any (array['light'::text, 'dark'::text]))
  )
) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on user_preferences for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_enforce_user_preferences_user_id BEFORE INSERT on user_preferences for EACH row
execute FUNCTION enforce_user_preferences_user_id ();

create trigger trg_prevent_user_preferences_user_id_update BEFORE
update on user_preferences for EACH row
execute FUNCTION prevent_user_preferences_user_id_update ();

## Tabla USER_PRESENCE:

create table public.user_presence (
  user_id uuid not null,
  org_id uuid not null,
  last_seen_at timestamp with time zone not null default now(),
  status text not null default 'online'::text,
  user_agent text null,
  locale text null,
  updated_from text null,
  current_view text null,
  updated_at timestamp with time zone null default now(),
  constraint user_presence_pkey primary key (user_id),
  constraint user_presence_user_id_key unique (user_id),
  constraint user_presence_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists user_presence_org_idx on public.user_presence using btree (org_id) TABLESPACE pg_default;

create trigger set_user_presence_updated_at BEFORE
update on user_presence for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_enforce_user_presence_user_id BEFORE INSERT on user_presence for EACH row
execute FUNCTION enforce_user_presence_user_id ();

create trigger trg_prevent_user_presence_user_id_update BEFORE
update on user_presence for EACH row
execute FUNCTION prevent_user_presence_user_id_update ();

## Tabla USER_VIEW_HISTORY:

create table public.user_view_history (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  organization_id uuid null,
  view_name text not null,
  entered_at timestamp with time zone not null default now(),
  exited_at timestamp with time zone null,
  duration_seconds integer null,
  created_at timestamp with time zone null default now(),
  constraint user_view_history_pkey primary key (id),
  constraint user_view_history_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint user_view_history_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger trg_enforce_user_view_history_user_id BEFORE INSERT on user_view_history for EACH row
execute FUNCTION enforce_user_view_history_user_id ();

create trigger trg_prevent_user_view_history_user_id_update BEFORE
update on user_view_history for EACH row
execute FUNCTION prevent_user_view_history_user_id_update ();

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