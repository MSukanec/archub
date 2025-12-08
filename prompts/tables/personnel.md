# Detalle de las tablas de Supabase de PERSONAL DE OBRA:

---------- TABLA CONTACTS:

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

---------- TABLA PROJECT_PERSONNEL:

create table public.project_personnel (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  contact_id uuid not null,
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  organization_id uuid null,
  labor_type_id uuid null,
  start_date date null,
  end_date date null,
  status text not null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint project_personnel_pkey primary key (id),
  constraint project_personnel_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint project_personnel_labor_type_id_fkey foreign KEY (labor_type_id) references labor_types (id) on delete set null,
  constraint project_personnel_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete CASCADE,
  constraint project_personnel_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint project_personnel_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint project_personnel_status_check check (
    (
      status = any (
        array['active'::text, 'absent'::text, 'inactive'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_project_personnel_project_id on public.project_personnel using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_project_personnel_contact_id on public.project_personnel using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_project_personnel_organization_id on public.project_personnel using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_project_personnel_labor_type_id on public.project_personnel using btree (labor_type_id) TABLESPACE pg_default;

create index IF not exists idx_project_personnel_status on public.project_personnel using btree (status) TABLESPACE pg_default;

create index IF not exists idx_project_personnel_is_deleted on public.project_personnel using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

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

---------- TABLA PERSONNEL_ATTENDEES:

create table public.personnel_attendees (
  id uuid not null default gen_random_uuid (),
  site_log_id uuid null,
  attendance_type text null default 'full'::text,
  hours_worked numeric(5, 2) null,
  description text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  project_id uuid null,
  personnel_id uuid null,
  organization_id uuid null,
  work_date date not null default CURRENT_DATE,
  status text null,
  constraint site_log_attendees_pkey primary key (id),
  constraint attendees_personnel_id_fkey foreign KEY (personnel_id) references project_personnel (id) on delete set null,
  constraint attendees_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint attendees_site_log_id_fkey foreign KEY (site_log_id) references site_logs (id) on delete set null,
  constraint personnel_attendees_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint attendees_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint personnel_attendees_status_check check (
    (
      (status is null)
      or (
        status = any (
          array[
            'present'::text,
            'absent'::text,
            'leave'::text,
            'holiday'::text
          ]
        )
      )
    )
  ),
  constraint site_log_attendees_attendance_type_check check (
    (
      attendance_type = any (array['full'::text, 'half'::text])
    )
  ),
  constraint personnel_attendees_hours_check check (
    (
      (hours_worked is null)
      or (
        (hours_worked >= (0)::numeric)
        and (hours_worked <= (24)::numeric)
      )
    )
  )
) TABLESPACE pg_default;