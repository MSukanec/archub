# Detalle de las tablas de Supabase de Construction:

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

create trigger trg_sync_user_contact_on_member_ins
after INSERT on organization_members for EACH row
execute FUNCTION archub_sync_user_contact ();

create trigger trg_sync_user_contact_on_member_upd
after
update OF user_id on organization_members for EACH row when (
  new.user_id is not null
  and old.user_id is distinct from new.user_id
)
execute FUNCTION archub_sync_user_contact ();

create trigger trigger_create_contact_on_new_member
after INSERT on organization_members for EACH row
execute FUNCTION handle_new_org_member_contact ();

---------- TABLA ORGANIZATION_INVITATIONS:

create table public.organization_invitations (
  id uuid not null default gen_random_uuid (),
  organization_id uuid null,
  email text not null,
  status text null default 'pending'::text,
  token text null,
  created_at timestamp with time zone null default now(),
  accepted_at timestamp with time zone null,
  role_id uuid null,
  invited_by uuid null,
  updated_at timestamp with time zone null default now(),
  user_id uuid null,
  constraint organization_invitations_pkey primary key (id),
  constraint organization_invitations_invited_by_fkey foreign KEY (invited_by) references organization_members (id) on delete set null,
  constraint organization_invitations_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_invitations_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE,
  constraint organization_invitations_user_id_fkey foreign KEY (user_id) references users (id) on delete set null,
  constraint valid_invitation_status check (
    (
      status = any (
        array[
          'pending'::text,
          'registered'::text,
          'accepted'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists organization_invitations_email_idx on public.organization_invitations using btree (email) TABLESPACE pg_default;

create index IF not exists organization_invitations_organization_id_idx on public.organization_invitations using btree (organization_id) TABLESPACE pg_default;

create trigger trigger_create_contact_on_registered_invitation
after INSERT
or
update on organization_invitations for EACH row when (new.status = 'accepted'::text)
execute FUNCTION handle_registered_invitation ();

---------- FUNCION archub_sync_user_contact:


declare
  v_user record;
  v_updated int := 0;
begin
  -- Solo si tenemos user_id válido
  if NEW.user_id is null then
    return NEW;
  end if;

  -- Datos del usuario
  select u.id, u.full_name, u.email
    into v_user
  from public.users u
  where u.id = NEW.user_id;

  if v_user.id is null then
    return NEW;
  end if;

  -- 1) Si ya existe un contacto vinculado en esta org, salir
  if exists (
    select 1
    from public.contacts c
    where c.organization_id = NEW.organization_id
      and c.linked_user_id  = v_user.id
  ) then
    return NEW;
  end if;

  -- 2) Promover contacto local (sin linked_user_id) que coincida por email
  update public.contacts c
     set linked_user_id = v_user.id,
         full_name      = coalesce(v_user.full_name, c.full_name),
         email          = coalesce(v_user.email, c.email),
         updated_at     = now()
   where c.organization_id = NEW.organization_id
     and c.linked_user_id is null
     and c.email is not distinct from v_user.email;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  if v_updated > 0 then
    return NEW;
  end if;

  -- 3) Si no había contacto local, crear uno vinculado
  insert into public.contacts (
    id, organization_id, linked_user_id, full_name, email, created_at, updated_at
  )
  values (
    gen_random_uuid(), NEW.organization_id, v_user.id, v_user.full_name, v_user.email, now(), now()
  )
  on conflict (organization_id, linked_user_id)
  where linked_user_id is not null
  do update set
    full_name  = excluded.full_name,
    email      = excluded.email,
    updated_at = now();

  return NEW;
end;

---------- FUNCION handle_contact_link_user:


declare
  v_user_id uuid;
begin
  -- Buscar usuario con mismo email
  select id into v_user_id
  from public.users
  where lower(email) = lower(new.email)
  limit 1;

  -- Si existe, asignarlo
  if v_user_id is not null then
    new.linked_user_id := v_user_id;
  end if;

  return new;
end;

---------- FUNCION handle_new_org_member_contact:


declare
  v_user record;
  v_exists_same_link boolean;
  v_exists_local_match boolean;
begin
  -- Traer datos básicos del usuario
  select u.id, u.full_name, u.email
  into v_user
  from public.users u
  where u.id = new.user_id;

  if v_user.id is null then
    -- Si no hay usuario, no hacemos nada
    return new;
  end if;

  -- 1) ¿Ya existe un contacto vinculado a este user_id en esta organización?
  select exists (
    select 1
    from public.contacts c
    where c.organization_id = new.organization_id
      and c.linked_user_id = v_user.id
  ) into v_exists_same_link;

  if v_exists_same_link then
    return new;
  end if;

  -- 2) ¿Existe un contacto local (sin linked_user_id) que coincida por email?
  select exists (
    select 1
    from public.contacts c
    where c.organization_id = new.organization_id
      and c.linked_user_id is null
      and c.email is not distinct from v_user.email
  ) into v_exists_local_match;

  if v_exists_local_match then
    -- Promover el contacto local a vinculado
    update public.contacts c
    set linked_user_id = v_user.id,
        full_name      = coalesce(v_user.full_name, c.full_name),
        email          = coalesce(v_user.email, c.email),
        updated_at     = now()
    where c.organization_id = new.organization_id
      and c.linked_user_id is null
      and c.email is not distinct from v_user.email;

    return new;
  end if;

  -- 3) Si no hay coincidencias, crear el contacto vinculado
  insert into public.contacts (
    organization_id,
    linked_user_id,
    full_name,
    email,
    created_at,
    updated_at
  ) values (
    new.organization_id,
    v_user.id,
    v_user.full_name,
    v_user.email,
    now(),
    now()
  );

  return new;
end;

---------- FUNCION handle_registered_invitation:

declare
  v_user record;
  v_exists_same_link boolean;
  v_exists_local_match boolean;
begin
  -- Traer datos básicos del usuario asociado a la invitación
  select u.id, u.full_name, u.email
  into v_user
  from public.users u
  where u.id = new.user_id;

  if v_user.id is null then
    return new;
  end if;

  -- 1) ¿Ya existe un contacto vinculado a este user_id en esta organización?
  select exists (
    select 1
    from public.contacts c
    where c.organization_id = new.organization_id
      and c.linked_user_id = v_user.id
  ) into v_exists_same_link;

  if v_exists_same_link then
    return new;
  end if;

  -- 2) ¿Existe un contacto local (sin linked_user_id) que coincida por email?
  select exists (
    select 1
    from public.contacts c
    where c.organization_id = new.organization_id
      and c.linked_user_id is null
      and c.email is not distinct from v_user.email
  ) into v_exists_local_match;

  if v_exists_local_match then
    -- Promover el contacto local a vinculado
    update public.contacts c
    set linked_user_id = v_user.id,
        full_name      = coalesce(v_user.full_name, c.full_name),
        email          = coalesce(v_user.email, c.email),
        updated_at     = now()
    where c.organization_id = new.organization_id
      and c.linked_user_id is null
      and c.email is not distinct from v_user.email;

    return new;
  end if;

  -- 3) Si no hay coincidencias, crear el contacto vinculado
  insert into public.contacts (
    organization_id,
    linked_user_id,
    full_name,
    email,
    created_at,
    updated_at
  ) values (
    new.organization_id,
    v_user.id,
    v_user.full_name,
    v_user.email,
    now(),
    now()
  );

  return new;
end;

---------- FUNCION handle_registered_invitation:




