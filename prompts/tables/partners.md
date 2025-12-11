# Detalle de las tablas de Supabase de SOCIOS:

---------- TABLA PARTNERS:

create table public.partners (
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

create index IF not exists idx_partners_organization on public.partners using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_partners_contact on public.partners using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_partners_created_at on public.partners using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_partners_status on public.partners using btree (status) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_partner_organization_contact on public.partners using btree (organization_id, contact_id) TABLESPACE pg_default
where
  (is_deleted = false);