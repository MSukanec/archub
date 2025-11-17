# Detalle de las tablas de Supabase de ARCHIVOS Y MEDIA:

---------- TABLA DOCUMENTS:

create table public.documents (
  id uuid not null default gen_random_uuid (),
  file_name text null,
  description text null,
  file_path text not null,
  file_url text null,
  file_type text null,
  project_id uuid null,
  organization_id uuid not null,
  status text null default 'pendiente'::text,
  created_at timestamp with time zone null default now(),
  file_size bigint null,
  folder_id uuid null,
  name text null,
  created_by uuid null,
  updated_at timestamp with time zone not null default now(),
  constraint design_documents_pkey primary key (id),
  constraint design_documents_folder_id_fkey foreign KEY (folder_id) references document_folders (id) on delete set null,
  constraint design_documents_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint design_documents_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint design_documents_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint design_documents_status_check check (
    (
      status = any (
        array[
          'pendiente'::text,
          'en_revision'::text,
          'aprobado'::text,
          'rechazado'::text
        ]
      )
    )
  ),
  constraint documents_file_type_check check (
    (
      (file_type is null)
      or (
        file_type ~ '^[a-zA-Z0-9._+-]+/[a-zA-Z0-9._+-]+$'::text
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists documents_org_idx on public.documents using btree (organization_id) TABLESPACE pg_default;

create index IF not exists documents_project_idx on public.documents using btree (project_id) TABLESPACE pg_default;

create index IF not exists documents_folder_idx on public.documents using btree (folder_id) TABLESPACE pg_default;

create index IF not exists documents_status_idx on public.documents using btree (status) TABLESPACE pg_default;

create index IF not exists documents_org_folder_idx on public.documents using btree (organization_id, folder_id) TABLESPACE pg_default;

create trigger documents_set_updated_at BEFORE
update on documents for EACH row
execute FUNCTION update_timestamp ();

create trigger documents_validate_project_org_trigger BEFORE INSERT
or
update on documents for EACH row
execute FUNCTION documents_validate_project_org ();

---------- TABLA DOCUMENT_FOLDERS:

create table public.document_folders (
  id uuid not null default gen_random_uuid (),
  organization_id uuid null,
  name text not null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  project_id uuid null,
  parent_id uuid null,
  created_by uuid null,
  constraint design_document_folders_pkey primary key (id),
  constraint design_document_folders_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint design_document_folders_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint design_document_folders_parent_id_fkey foreign KEY (parent_id) references document_folders (id) on delete CASCADE,
  constraint design_document_folders_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;