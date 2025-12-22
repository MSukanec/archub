# Detalle de las tablas de Supabase de PERSONAL DE OBRA:

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

## Tabla PERSONNEL_ATTENDEES:

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

## Vista PERSONNEL_INSURANCE_VIEW:

create view public.personnel_insurance_view as
select
  pi.id,
  pi.organization_id,
  pi.project_id,
  pi.personnel_id,
  pp.contact_id,
  pi.insurance_type,
  pi.policy_number,
  pi.provider,
  pi.coverage_start,
  pi.coverage_end,
  pi.reminder_days,
  pi.certificate_attachment_id,
  pi.notes,
  pi.created_by,
  pi.created_at,
  pi.updated_at,
  pi.coverage_end - CURRENT_DATE as days_to_expiry,
  case
    when CURRENT_DATE > pi.coverage_end then 'vencido'::text
    when (pi.coverage_end - CURRENT_DATE) <= 30 then 'por_vencer'::text
    else 'vigente'::text
  end as status
from
  personnel_insurances pi
  left join project_personnel pp on pp.id = pi.personnel_id;

## Tabla PERSONNEL_INSURANCES:

create table public.personnel_insurances (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  project_id uuid null,
  personnel_id uuid not null,
  insurance_type text not null,
  policy_number text null,
  provider text null,
  coverage_start date not null,
  coverage_end date not null,
  reminder_days smallint[] null default array[30, 15, 7],
  certificate_attachment_id uuid null,
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  coverage_range daterange GENERATED ALWAYS as (
    daterange (coverage_start, coverage_end, '[]'::text)
  ) STORED null,
  constraint personnel_insurances_pkey primary key (id),
  constraint personnel_insurances_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint personnel_insurances_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint personnel_insurances_personnel_id_fkey foreign KEY (personnel_id) references project_personnel (id) on delete CASCADE,
  constraint personnel_insurances_project_id_fkey foreign KEY (project_id) references projects (id) on delete set null,
  constraint personnel_insurances_insurance_type_check check (
    (
      insurance_type = any (
        array[
          'ART'::text,
          'vida'::text,
          'accidentes'::text,
          'responsabilidad_civil'::text,
          'salud'::text,
          'otro'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

## Tabla PERSONNEL_PAYMENTS:

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

## Tabla PERSONNEL_RATES:

create table public.personnel_rates (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  personnel_id uuid null,
  labor_type_id uuid null,
  rate_hour numeric(12, 2) null,
  rate_day numeric(12, 2) null,
  rate_month numeric(12, 2) null,
  currency_id uuid not null,
  valid_from date not null,
  valid_to date null,
  is_active boolean not null default true,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  pay_type text not null default 'hour'::text,
  constraint personnel_rates_pkey primary key (id),
  constraint personnel_rates_currency_id_fkey foreign KEY (currency_id) references currencies (id),
  constraint personnel_rates_labor_type_id_fkey foreign KEY (labor_type_id) references labor_types (id) on delete CASCADE,
  constraint personnel_rates_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint personnel_rates_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint personnel_rates_personnel_id_fkey foreign KEY (personnel_id) references project_personnel (id) on delete CASCADE,
  constraint personnel_rates_owner_check check (
    (
      (
        (personnel_id is not null)
        and (labor_type_id is null)
      )
      or (
        (personnel_id is null)
        and (labor_type_id is not null)
      )
    )
  ),
  constraint personnel_rates_pay_type_check check (
    (
      pay_type = any (array['hour'::text, 'day'::text, 'month'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_personnel_rates_org on public.personnel_rates using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_personnel_rates_personnel on public.personnel_rates using btree (personnel_id) TABLESPACE pg_default;

create index IF not exists idx_personnel_rates_labor_type on public.personnel_rates using btree (labor_type_id) TABLESPACE pg_default;

create index IF not exists idx_personnel_rates_validity on public.personnel_rates using btree (valid_from, valid_to) TABLESPACE pg_default;

create index IF not exists idx_personnel_rates_is_active on public.personnel_rates using btree (is_active) TABLESPACE pg_default;

## Tabla PROJECT_PERSONNEL:

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

## Vista PERSONNNEL_PAYMENTS_VIEW:

  CREATE OR REPLACE VIEW public.personnel_payments_view AS
  SELECT
    pp.id,
    pp.organization_id,
    pp.project_id,
    pp.personnel_id,
    pp.payment_date,
    date_trunc('month'::text, pp.payment_date::timestamp with time zone) AS payment_month,
    pp.amount,
    pp.currency_id,
    pp.exchange_rate,
    pp.status,
    pp.wallet_id,
    pp.notes,
    pp.reference,
    pp.created_at,
    pp.updated_at,
    pp.created_by,
    pp.is_deleted,
    pp.deleted_at,
    -- Monto en moneda base
    (pp.amount * pp.exchange_rate) AS amount_in_base,
    -- Datos del personal
    prj_p.contact_id,
    prj_p.labor_type_id,
    prj_p.status AS personnel_status,
    -- Datos del contacto
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    COALESCE(ct.display_name_override, ct.full_name, CONCAT(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    ct.national_id AS contact_national_id,
    -- Datos del tipo de trabajo
    lt.name AS labor_type_name,
    -- Datos del proyecto
    proj.name AS project_name
  FROM
    personnel_payments pp
    LEFT JOIN project_personnel prj_p ON prj_p.id = pp.personnel_id
    LEFT JOIN contacts ct ON ct.id = prj_p.contact_id
    LEFT JOIN labor_types lt ON lt.id = prj_p.labor_type_id
    LEFT JOIN projects proj ON proj.id = pp.project_id;


## Vista PERSONNNEL_BY_LABOR_TYPE_VIEW:

  CREATE OR REPLACE VIEW public.personnel_by_labor_type_view AS
  SELECT
    ppv.organization_id,
    ppv.project_id,
    ppv.payment_month,
    ppv.labor_type_id,
    ppv.labor_type_name,
    SUM(ppv.amount_in_base) AS total_amount_base,
    COUNT(*) AS payments_count
  FROM
    personnel_payments_view ppv
  WHERE
    ppv.status = 'confirmed'
    AND (ppv.is_deleted IS NULL OR ppv.is_deleted = false)
  GROUP BY
    ppv.organization_id,
    ppv.project_id,
    ppv.payment_month,
    ppv.labor_type_id,
    ppv.labor_type_name;


## Vista PERSONNEL_MONTHLY_SUMMARY_VIEW:

  CREATE OR REPLACE VIEW public.personnel_monthly_summary_view AS
  SELECT
    ppv.organization_id,
    ppv.project_id,
    ppv.payment_month,
    SUM(ppv.amount_in_base) AS total_amount_base,
    COUNT(*) AS payments_count,
    COUNT(DISTINCT ppv.personnel_id) AS unique_personnel_count
  FROM
    personnel_payments_view ppv
  WHERE
    ppv.status = 'confirmed'
    AND (ppv.is_deleted IS NULL OR ppv.is_deleted = false)
  GROUP BY
    ppv.organization_id,
    ppv.project_id,
    ppv.payment_month;


## Vista PROJECT_PERSONNEL_VIEW:

  CREATE OR REPLACE VIEW public.project_personnel_view AS
  SELECT
    pp.id,
    pp.organization_id,
    pp.project_id,
    pp.contact_id,
    pp.labor_type_id,
    pp.status,
    pp.start_date,
    pp.end_date,
    pp.notes,
    pp.created_by,
    pp.created_at,
    pp.updated_at,
    pp.is_deleted,
    pp.deleted_at,
    -- Datos del contacto
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    COALESCE(c.display_name_override, c.full_name, CONCAT(c.first_name, ' ', c.last_name)) AS contact_display_name,
    c.national_id AS contact_national_id,
    c.phone AS contact_phone,
    c.email AS contact_email,
    c.image_bucket AS contact_image_bucket,
    c.image_path AS contact_image_path,
    -- Datos del tipo de trabajo
    lt.name AS labor_type_name,
    -- Datos del proyecto
    proj.name AS project_name,
    -- Métricas agregadas
    (
      SELECT COUNT(*)
      FROM personnel_payments pay
      WHERE pay.personnel_id = pp.id
        AND pay.status = 'confirmed'
        AND (pay.is_deleted IS NULL OR pay.is_deleted = false)
    ) AS total_payments_count,
    (
      SELECT COALESCE(SUM(pay.amount * pay.exchange_rate), 0)
      FROM personnel_payments pay
      WHERE pay.personnel_id = pp.id
        AND pay.status = 'confirmed'
        AND (pay.is_deleted IS NULL OR pay.is_deleted = false)
    ) AS total_paid_base,
    (
      SELECT COUNT(*)
      FROM personnel_attendees pa
      WHERE pa.personnel_id = pp.id
        AND pa.status = 'present'
    ) AS total_attendance_days,
    -- Estado del seguro ART
    (
      SELECT 
        CASE
          WHEN CURRENT_DATE > pi.coverage_end THEN 'vencido'
          WHEN (pi.coverage_end - CURRENT_DATE) <= 30 THEN 'por_vencer'
          ELSE 'vigente'
        END
      FROM personnel_insurances pi
      WHERE pi.personnel_id = pp.id
        AND pi.insurance_type = 'ART'
      ORDER BY pi.coverage_end DESC
      LIMIT 1
    ) AS art_insurance_status
  FROM
    project_personnel pp
    LEFT JOIN contacts c ON c.id = pp.contact_id
    LEFT JOIN labor_types lt ON lt.id = pp.labor_type_id
    LEFT JOIN projects proj ON proj.id = pp.project_id;