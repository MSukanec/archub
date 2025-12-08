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