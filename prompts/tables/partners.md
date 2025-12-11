# Detalle de las tablas de Supabase de SOCIOS:

---------- TABLA PARTNERS:

create table public.partners (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  contact_id uuid null,
  organization_id uuid not null,
  constraint partners_pkey primary key (id),
  constraint partners_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete set null,
  constraint partners_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;