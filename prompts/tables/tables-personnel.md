# Detalle de las tablas de Supabase de Personal:

TABLA CONTACTS:

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
  constraint contacts_pkey primary key (id),
  constraint contacts_national_id_key unique (national_id),
  constraint contacts_avatar_attachment_id_fkey foreign KEY (avatar_attachment_id) references contact_attachments (id) on delete set null,
  constraint contacts_linked_user_id_fkey foreign KEY (linked_user_id) references users (id) on delete set null,
  constraint contacts_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

TABLA PROJECT_PERSONNEL:

create table public.project_personnel (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  contact_id uuid not null,
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint project_personnel_pkey primary key (id),
  constraint project_personnel_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete CASCADE,
  constraint project_personnel_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint project_personnel_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;

TABLA PERSONNEL_ATTENDEES (EX ATTENDEES):

create table public.personnel_attendees (
  id uuid not null default gen_random_uuid (),
  site_log_id uuid null,
  attendance_type text null default 'full'::text,
  hours_worked numeric null,
  description text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  project_id uuid null,
  personnel_id uuid null,
  organization_id uuid null,
  constraint site_log_attendees_pkey primary key (id),
  constraint attendees_personnel_id_fkey foreign KEY (personnel_id) references project_personnel (id) on delete set null,
  constraint attendees_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint attendees_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint personnel_attendees_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint attendees_site_log_id_fkey foreign KEY (site_log_id) references site_logs (id) on delete set null,
  constraint site_log_attendees_attendance_type_check check (
    (
      attendance_type = any (array['full'::text, 'half'::text])
    )
  )
) TABLESPACE pg_default;

TABLA PERSONNEL_INSURANCES

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
  constraint personnel_insurances_certificate_attachment_id_fkey foreign KEY (certificate_attachment_id) references contact_attachments (id) on delete set null,
  constraint personnel_insurances_personnel_id_fkey foreign KEY (personnel_id) references project_personnel (id) on delete CASCADE,
  constraint personnel_insurances_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
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

TABLA CONTACT_ATTACHMENTS:

create table public.contact_attachments (
  id uuid not null default gen_random_uuid (),
  contact_id uuid not null,
  storage_bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text null,
  size_bytes bigint null,
  category text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  constraint contact_attachments_pkey primary key (id),
  constraint contact_attachments_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete CASCADE,
  constraint contact_attachments_category_check check (
    (
      category = any (
        array[
          'dni_front'::text,
          'dni_back'::text,
          'document'::text,
          'photo'::text,
          'other'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

VISTA PERSONNEL_INSURANCE_VIEW:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "project_id",
    "data_type": "uuid"
  },
  {
    "column_name": "personnel_id",
    "data_type": "uuid"
  },
  {
    "column_name": "contact_id",
    "data_type": "uuid"
  },
  {
    "column_name": "insurance_type",
    "data_type": "text"
  },
  {
    "column_name": "policy_number",
    "data_type": "text"
  },
  {
    "column_name": "provider",
    "data_type": "text"
  },
  {
    "column_name": "coverage_start",
    "data_type": "date"
  },
  {
    "column_name": "coverage_end",
    "data_type": "date"
  },
  {
    "column_name": "reminder_days",
    "data_type": "ARRAY"
  },
  {
    "column_name": "certificate_attachment_id",
    "data_type": "uuid"
  },
  {
    "column_name": "notes",
    "data_type": "text"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "days_to_expiry",
    "data_type": "integer"
  },
  {
    "column_name": "status",
    "data_type": "text"
  }
]