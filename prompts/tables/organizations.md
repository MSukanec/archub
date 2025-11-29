# Detalle de las tablas de Supabase para ORGANIZACIONES:

---------- TABLA ORGANIZATIONS:

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

---------- COLUMNAS IMPORTANTES:

- **id**: UUID único de la organización
- **name**: Nombre de la organización (requerido)
- **created_by**: Usuario que creó la organización (FK a users)
- **owner_id**: Propietario actual de la organización (FK a users)
- **plan_id**: Plan de suscripción activo (FK a plans)
- **is_active**: Si la organización está activa
- **is_deleted / deleted_at**: Soft delete
- **is_system**: Flag para organizaciones del sistema (internal use)
- **image_bucket**: Bucket de Supabase Storage donde está el logo (ej: 'public-assets')
- **image_path**: Path del logo dentro del bucket (ej: 'organizations/{org_id}/branding/logo.jpg')

---------- LOGO DE ORGANIZACIÓN (NUEVO SISTEMA):

El logo de la organización se almacena usando el sistema unificado de uploads:

- **EntityType**: `org_logo`
- **Bucket**: `public-assets` (público, sin autenticación requerida)
- **Path**: `organizations/{org_id}/branding/{filename}`
- **Compression Preset**: `avatar` (512px max, 90% quality, 0.3MB max)

Para subir el logo, usar:
```typescript
import { uploadOrgLogo } from '@/lib/storage';

const result = await uploadOrgLogo(file, organizationId);
// result.file_url contiene la URL pública del logo
```

Para obtener la URL del logo desde la base de datos:
```typescript
// El logo está en public-assets, así que se puede acceder directamente:
const logoUrl = organization.image_bucket && organization.image_path
  ? `${SUPABASE_URL}/storage/v1/object/public/${organization.image_bucket}/${organization.image_path}`
  : null;
```

---------- NOTA LEGACY:

⚠️ La columna `logo_url` fue deprecada y eliminada. Usar `image_bucket` + `image_path` en su lugar.

