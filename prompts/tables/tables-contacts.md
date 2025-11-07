# Detalle de las tablas de Supabase para Contactos:

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

create trigger on_contact_link_user BEFORE INSERT
or
update OF email on contacts for EACH row
execute FUNCTION handle_contact_link_user ();

TABLA CONTACT_TYPES:

create table public.contact_types (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone null default now(),
  constraint contact_types_pkey primary key (id),
  constraint contact_types_name_key unique (name)
) TABLESPACE pg_default;

TABLA CONTACT_TYPE_LINKS:

create table public.contact_type_links (
  id uuid not null default gen_random_uuid (),
  contact_id uuid null,
  contact_type_id uuid null,
  created_at timestamp with time zone null default now(),
  organization_id uuid null,
  constraint contact_type_links_pkey primary key (id),
  constraint contact_type_links_contact_id_contact_type_id_key unique (contact_id, contact_type_id),
  constraint contact_type_links_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete CASCADE,
  constraint contact_type_links_contact_type_id_fkey foreign KEY (contact_type_id) references contact_types (id) on delete CASCADE,
  constraint contact_type_links_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
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