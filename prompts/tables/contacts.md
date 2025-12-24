# Detalle de las tablas de Supabase para CONTACTOS:

## Tabla CONTACT_TYPE_LINKS:

create table public.contact_type_links (
  id uuid not null default gen_random_uuid (),
  contact_id uuid null,
  contact_type_id uuid null,
  created_at timestamp with time zone null default now(),
  organization_id uuid null,
  constraint contact_type_links_pkey primary key (id),
  constraint contact_type_links_contact_id_contact_type_id_key unique (contact_id, contact_type_id),
  constraint contact_type_links_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete set null,
  constraint contact_type_links_contact_type_id_fkey foreign KEY (contact_type_id) references contact_types (id) on delete set null,
  constraint contact_type_links_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

## Tabla CONTACT_TYPES:

create table public.contact_types (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  organization_id uuid null,
  constraint contact_types_pkey primary key (id),
  constraint contact_types_org_name_key unique (organization_id, name),
  constraint contact_types_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

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

---

# VISTAS SQL

## Vista CONTACTS_WITH_RELATIONS_VIEW

```sql
CREATE OR REPLACE VIEW contacts_with_relations_view AS
SELECT 
  c.*,
  u.full_name AS linked_user_full_name,
  u.email AS linked_user_email,
  u.avatar_url AS linked_user_avatar_url,
  COALESCE(
    (
      SELECT json_agg(json_build_object('id', ct.id, 'name', ct.name))
      FROM contact_type_links ctl
      JOIN contact_types ct ON ct.id = ctl.contact_type_id
      WHERE ctl.contact_id = c.id
        AND ct.is_deleted = false
    ),
    '[]'::json
  ) AS contact_types,
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = c.linked_user_id
      AND om.organization_id = c.organization_id
  ) AS is_organization_member
FROM contacts c
LEFT JOIN users u ON u.id = c.linked_user_id
WHERE c.is_deleted = false;
```

**Propósito:** Vista principal para obtener contactos con todas sus relaciones:
- Datos del usuario vinculado (linked_user_*)
- Tipos de contacto como JSON array
- Estado de membresía en la organización

**Uso:** `getContacts.ts`, `getContactById.ts`

---

## Vista CONTACTS_BY_TYPE_VIEW

```sql
CREATE OR REPLACE VIEW contacts_by_type_view AS
SELECT 
  c.organization_id,
  ct.id AS contact_type_id,
  ct.name AS contact_type_name,
  COUNT(DISTINCT c.id) AS total_contacts
FROM contacts c
JOIN contact_type_links ctl ON ctl.contact_id = c.id
JOIN contact_types ct ON ct.id = ctl.contact_type_id
WHERE c.is_deleted = false
  AND ct.is_deleted = false
GROUP BY c.organization_id, ct.id, ct.name;
```

**Propósito:** Recuento de contactos agrupados por tipo de contacto.

**Uso:** `getContactsByType.ts`, `useContactsByType` hook

---

## Vista CONTACTS_SUMMARY_VIEW

```sql
CREATE OR REPLACE VIEW contacts_summary_view AS
SELECT 
  c.organization_id,
  COUNT(*) AS total_contacts,
  COUNT(c.linked_user_id) AS linked_contacts,
  COUNT(CASE WHEN EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = c.linked_user_id
      AND om.organization_id = c.organization_id
  ) THEN 1 END) AS member_contacts
FROM contacts c
WHERE c.is_deleted = false
GROUP BY c.organization_id;
```

**Propósito:** Resumen estadístico de contactos por organización:
- Total de contactos activos
- Contactos vinculados a usuarios
- Contactos que son miembros de la organización

**Uso:** `getContactsSummary.ts`, `useContactsSummary` hook