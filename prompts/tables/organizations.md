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
  settings jsonb null default '{}'::jsonb,
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

---------- TABLA ORGANIZATION_MEMBERS:

create table public.organization_members (
  created_at timestamp with time zone not null default now(),
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  is_active boolean not null default true,
  organization_id uuid not null,
  invited_by uuid null,
  joined_at timestamp with time zone null default now(),
  role_id uuid null,
  last_active_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  is_billable boolean not null default true,
  is_over_limit boolean null default false,
  constraint organization_members_pkey primary key (id),
  constraint organization_members_idd_key unique (id),
  constraint organization_members_invited_by_fkey foreign KEY (invited_by) references organization_members (id) on delete set null,
  constraint organization_members_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_members_role_id_fkey foreign KEY (role_id) references roles (id) on delete set null,
  constraint organization_members_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists organization_members_organization_id_idx on public.organization_members using btree (organization_id) TABLESPACE pg_default;

create index IF not exists organization_members_user_id_idx on public.organization_members using btree (user_id) TABLESPACE pg_default;

create unique INDEX IF not exists unique_user_per_organization on public.organization_members using btree (user_id, organization_id) TABLESPACE pg_default;

create index IF not exists idx_org_members_org_user on public.organization_members using btree (organization_id, user_id) TABLESPACE pg_default;

create index IF not exists org_members_over_limit_idx on public.organization_members using btree (organization_id, is_over_limit) TABLESPACE pg_default;

create trigger on_member_joins_founder_org
after INSERT on organization_members for EACH row
execute FUNCTION auto_enroll_founder_members ();

create trigger set_updated_at BEFORE
update on organization_members for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trigger_create_contact_on_new_member
after INSERT on organization_members for EACH row
execute FUNCTION handle_new_org_member_contact ();

---------- FUNCION handle_new_organization:

declare
  org_id uuid := gen_random_uuid();
  now_timestamp timestamptz := now();

  -- Roles, IDs y valores por defecto
  plan_free_id uuid := '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2';
  admin_role_id uuid := '81be9c24-1e85-4f48-a131-2c618e0d1888';
  default_currency_id uuid := '58c50aa7-b8b1-4035-b509-58028dd0e33f';
  default_wallet_id uuid := '2658c575-0fa8-4cf6-85d7-6430ded7e188';
  default_pdf_template_id uuid := 'b6266a04-9b03-4f3a-af2d-f6ee6d0a948b';

begin
  ------------------------------------------------------------------------------------
  -- 1) Crear organización (⚠️ ahora con owner_id)
  ------------------------------------------------------------------------------------
  insert into public.organizations (
    id,
    name,
    created_by,
    owner_id,
    created_at,
    updated_at,
    is_active,
    plan_id
  ) values (
    org_id,
    _organization_name,
    _user_id,
    _user_id,                -- 👈 dueño de la organización
    now_timestamp,
    now_timestamp,
    true,
    plan_free_id
  );

  ------------------------------------------------------------------------------------
  -- 2) organization_data
  ------------------------------------------------------------------------------------
  insert into public.organization_data (organization_id)
  values (org_id);

  ------------------------------------------------------------------------------------
  -- 3) organization_members (⚠️ con last_active_at)
  ------------------------------------------------------------------------------------
  insert into public.organization_members (
    id,
    user_id,
    organization_id,
    role_id,
    is_active,
    created_at,
    joined_at,
    last_active_at
  ) values (
    gen_random_uuid(),
    _user_id,
    org_id,
    admin_role_id,
    true,
    now_timestamp,
    now_timestamp,
    now_timestamp            -- 👈 consistencia con handle_new_user
  );

  ------------------------------------------------------------------------------------
  -- 4) organization_currencies
  ------------------------------------------------------------------------------------
  insert into public.organization_currencies (
    id,
    organization_id,
    currency_id,
    is_active,
    is_default,
    created_at
  ) values (
    gen_random_uuid(),
    org_id,
    default_currency_id,
    true,
    true,
    now_timestamp
  );

  ------------------------------------------------------------------------------------
  -- 5) organization_wallets
  ------------------------------------------------------------------------------------
  insert into public.organization_wallets (
    id,
    organization_id,
    wallet_id,
    is_active,
    is_default,
    created_at
  ) values (
    gen_random_uuid(),
    org_id,
    default_wallet_id,
    true,
    true,
    now_timestamp
  );

  ------------------------------------------------------------------------------------
  -- 6) organization_preferences
  ------------------------------------------------------------------------------------
  insert into public.organization_preferences (
    organization_id,
    default_currency_id,
    default_wallet_id,
    default_pdf_template_id,
    use_currency_exchange,
    created_at,
    updated_at
  ) values (
    org_id,
    default_currency_id,
    default_wallet_id,
    default_pdf_template_id,
    false,                  -- 👈 igual que en handle_new_user
    now_timestamp,
    now_timestamp
  );

  ------------------------------------------------------------------------------------
  -- 7) user_organization_preferences
  ------------------------------------------------------------------------------------
  insert into public.user_organization_preferences (
    id,
    user_id,
    organization_id,
    last_project_id,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    _user_id,
    org_id,
    null,
    now_timestamp,
    now_timestamp
  );

  ------------------------------------------------------------------------------------
  -- 8) Actualizar user_preferences para establecer esta organización como activa
  ------------------------------------------------------------------------------------
  update public.user_preferences
  set
    last_organization_id = org_id,
    updated_at = now_timestamp
  where user_id = _user_id;

  ------------------------------------------------------------------------------------
  return org_id;
end;